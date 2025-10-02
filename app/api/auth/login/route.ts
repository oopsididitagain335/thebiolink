// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getUserByEmail, createSession } from '@/lib/storage';
import { verifyRecaptcha } from '@/lib/recaptcha';

// === CONFIGURATION ===
const MAX_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10);
const LOCKOUT_BASE_MINUTES = 15;
const MIN_HUMAN_DELAY_MS = 800;    // Humans take >800ms to submit
const MAX_HUMAN_DELAY_MS = 10 * 60 * 1000; // Max 10 minutes (prevent replay)
const DUMMY_BCRYPT_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'; // bcrypt("dummy")

// === INPUT VALIDATION SCHEMA ===
const LoginSchema = z.object({
  email: z.string().email().min(1).max(255),
  password: z.string().min(1).max(1024), // Prevent DoS via huge passwords
  recaptchaToken: z.string().min(1),
  timingToken: z.string().min(1),
});

// === IN-MEMORY RATE LIMITING STORE (USE REDIS IN PRODUCTION) ===
const failedAttempts = new Map<string, { count: number; lastAttempt: number }>();

// === HELPER FUNCTIONS ===
function getClientIP(req: NextRequest): string {
  // Check common proxy headers
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP (original client)
    return forwardedFor.split(',')[0].trim();
  }
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }
  return '127.0.0.1';
}

function getDeviceFingerprint(req: NextRequest): string {
  // Create non-PII device fingerprint
  const parts = [
    req.headers.get('user-agent') || '',
    req.headers.get('accept') || '',
    req.headers.get('accept-language') || '',
    req.headers.get('accept-encoding') || '',
  ];
  return crypto.createHash('sha256').update(parts.join('||')).digest('hex');
}

function verifyTimingToken(token: string): boolean {
  const [timestampStr, signature] = token.split('.');
  
  // Validate structure
  if (!timestampStr || !signature || signature.length !== 64) {
    return false;
  }

  // Verify HMAC signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.LOGIN_TIMING_SECRET!)
    .update(timestampStr)
    .digest('hex');

  const isValidSignature = crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );

  if (!isValidSignature) {
    return false;
  }

  // Check timing window
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    return false;
  }

  const ageMs = Date.now() - timestamp;
  return ageMs >= MIN_HUMAN_DELAY_MS && ageMs <= MAX_HUMAN_DELAY_MS;
}

async function checkLockout(ip: string, fingerprint: string): Promise<void> {
  const key = `${ip}:${fingerprint}`;
  const record = failedAttempts.get(key);
  
  if (!record) return;

  // Calculate dynamic lockout duration (exponential backoff)
  const lockoutMinutes = Math.min(
    LOCKOUT_BASE_MINUTES * Math.pow(2, record.count - MAX_ATTEMPTS),
    24 * 60 // Max 24 hours
  );
  const lockoutMs = lockoutMinutes * 60 * 1000;

  // Check if still locked out
  if (record.count >= MAX_ATTEMPTS && (Date.now() - record.lastAttempt) < lockoutMs) {
    throw { 
      code: 'LOCKED_OUT', 
      minutes: Math.ceil(lockoutMinutes) 
    };
  }

  // Auto-reset expired lockouts
  if (record.count >= MAX_ATTEMPTS) {
    failedAttempts.delete(key);
  }
}

async function recordFailedAttempt(ip: string, fingerprint: string): Promise<number> {
  const key = `${ip}:${fingerprint}`;
  const now = Date.now();
  const current = failedAttempts.get(key) || { count: 0, lastAttempt: 0 };
  const newCount = current.count + 1;
  failedAttempts.set(key, { count: newCount, lastAttempt: now });
  return newCount;
}

async function clearFailedAttempts(ip: string, fingerprint: string): Promise<void> {
  const key = `${ip}:${fingerprint}`;
  failedAttempts.delete(key);
}

// === MAIN HANDLER ===
export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const fingerprint = getDeviceFingerprint(request);

  try {
    // === 1. PARSE AND VALIDATE REQUEST BODY ===
    const body = await request.json();
    const { email, password, recaptchaToken, timingToken } = LoginSchema.parse(body);

    // === 2. VERIFY HUMAN INTERACTION TIMING ===
    if (!verifyTimingToken(timingToken)) {
      console.warn(`[SECURITY] Invalid timing token from IP: ${ip}`);
      return NextResponse.json(
        { error: 'Security verification failed' },
        { status: 403 }
      );
    }

    // === 3. CHECK ACCOUNT LOCKOUT STATUS ===
    try {
      await checkLockout(ip, fingerprint);
    } catch (e: any) {
      if (e.code === 'LOCKED_OUT') {
        const message = `Too many failed attempts. Please try again in ${e.minutes} minute${e.minutes === 1 ? '' : 's'}.`;
        return NextResponse.json(
          { error: message },
          { status: 429 }
        );
      }
      throw e; // Re-throw unexpected errors
    }

    // === 4. VERIFY reCAPTCHA v3 SCORE ===
    const captchaScore = await verifyRecaptcha(recaptchaToken);
    if (captchaScore < 0.7) {
      console.warn(`[SECURITY] Low reCAPTCHA score (${captchaScore}) from IP: ${ip}`);
      return NextResponse.json(
        { error: 'Security verification failed' },
        { status: 403 }
      );
    }

    // === 5. AUTHENTICATE USER (WITH TIMING ATTACK PROTECTION) ===
    const normalizedEmail = email.toLowerCase().trim();
    const user = await getUserByEmail(normalizedEmail);

    // Constant-time comparison to prevent timing attacks
    const isValidPassword = user
      ? await bcrypt.compare(password, user.passwordHash)
      : await bcrypt.compare(password, DUMMY_BCRYPT_HASH);

    if (!isValidPassword || !user) {
      // Record failed attempt
      const attempts = await recordFailedAttempt(ip, fingerprint);
      
      // Log without revealing user existence
      if (!user) {
        console.info(`[AUTH] Login attempt for non-existent email: ${normalizedEmail} from ${ip}`);
      } else {
        console.warn(`[AUTH] Failed login for ${normalizedEmail} from ${ip} (attempt #${attempts})`);
      }

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // === 6. POST-AUTH SECURITY CHECKS ===
    if (user.isBanned) {
      console.warn(`[SECURITY] Banned user ${user.email} attempted login from ${ip}`);
      return NextResponse.json(
        { error: 'This account has been suspended' },
        { status: 403 }
      );
    }

    // === 7. SUCCESS: CREATE SESSION AND SET COOKIE ===
    await clearFailedAttempts(ip, fingerprint);

    // Generate cryptographically secure session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    await createSession(sessionToken, user.id);

    // Set secure HttpOnly cookie
    (await cookies()).set('biolink_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
      sameSite: 'lax',
    });

    console.info(`[AUTH] Successful login for ${user.email} from ${ip}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      console.error('Login validation error:', error.errors);
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    // Handle all other errors
    console.error('Login route unexpected error:', error);
    return NextResponse.json(
      { error: 'Authentication service unavailable' },
      { status: 500 }
    );
  }
}
