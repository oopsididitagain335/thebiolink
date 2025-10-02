// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserByEmail } from '@/lib/storage';
import bcrypt from 'bcryptjs';
import { verifyRecaptcha } from '@/lib/recaptcha'; // You'll create this
import { rateLimit } from '@/lib/rate-limit'; // Redis-backed or in-memory

// Fallback in-memory store (only for dev/small scale)
const failedAttempts = new Map<string, { count: number; lastAttempt: number }>();

// Helper to get real client IP
function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }
  return '127.0.0.1';
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // === 1. RATE LIMITING (Use Redis in prod, fallback to memory) ===
  const MAX_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10);
  const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  try {
    // Try Redis-based rate limiter first (recommended for production)
    await rateLimit(ip, MAX_ATTEMPTS, LOCKOUT_DURATION_MS);
  } catch (rateLimitError: any) {
    if (rateLimitError.code === 'RATE_LIMIT_EXCEEDED') {
      console.warn(`[SECURITY] Rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }
    // If Redis fails, fall back to in-memory (not ideal for clusters)
    const attempts = failedAttempts.get(ip);
    if (attempts && attempts.count >= MAX_ATTEMPTS) {
      const timeSinceLast = Date.now() - attempts.lastAttempt;
      if (timeSinceLast < LOCKOUT_DURATION_MS) {
        return NextResponse.json(
          { error: 'Too many login attempts. Please try again later.' },
          { status: 429 }
        );
      } else {
        failedAttempts.delete(ip);
      }
    }
  }

  // === 2. PARSE & VALIDATE REQUEST ===
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { email, password, recaptchaToken } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  // === 3. reCAPTCHA v3 VERIFICATION ===
  if (!recaptchaToken) {
    return NextResponse.json({ error: 'Missing security token' }, { status: 400 });
  }

  const captchaScore = await verifyRecaptcha(recaptchaToken);
  if (captchaScore < 0.7) {
    console.warn(`[SECURITY] Low reCAPTCHA score (${captchaScore}) from IP: ${ip}`);
    return NextResponse.json({ error: 'Security check failed' }, { status: 403 });
  }

  // === 4. AUTHENTICATION WITH TIMING ATTACK PROTECTION ===
  const user = await getUserByEmail(email.toLowerCase().trim());

  // Always compare against a real hash to prevent timing leaks
  const dummyHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'; // precomputed bcrypt of "dummy"
  const isValid = user
    ? await bcrypt.compare(password, user.passwordHash)
    : await bcrypt.compare(password, dummyHash);

  if (!isValid || !user) {
    // Track failed attempt (use Redis if available)
    try {
      await rateLimit(ip, MAX_ATTEMPTS, LOCKOUT_DURATION_MS, true); // increment
    } catch {
      // Fallback to in-memory
      const current = failedAttempts.get(ip) || { count: 0, lastAttempt: 0 };
      failedAttempts.set(ip, {
        count: current.count + 1,
        lastAttempt: Date.now(),
      });
    }

    // Log suspicious activity (without exposing user existence)
    if (!user) {
      console.info(`[AUTH] Login attempt for non-existent email: ${email} from ${ip}`);
    } else {
      console.warn(`[AUTH] Failed login for ${email} from ${ip} (UA: ${userAgent})`);
    }

    // Generic error to prevent user enumeration
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  // === 5. POST-AUTH SECURITY CHECKS ===
  if (user.isBanned) {
    console.warn(`[SECURITY] Banned user ${user.email} attempted login from ${ip}`);
    return NextResponse.json({ error: 'Account access denied' }, { status: 403 });
  }

  if (!user.emailVerified) {
    return NextResponse.json({ error: 'Please verify your email first' }, { status: 403 });
  }

  // === 6. CLEAR FAILED ATTEMPTS & SET SESSION ===
  try {
    await rateLimit(ip, MAX_ATTEMPTS, LOCKOUT_DURATION_MS, false); // reset
  } catch {
    failedAttempts.delete(ip);
  }

  // Set secure, HttpOnly session cookie
  const sessionCookie = {
    name: 'biolink_session',
    value: user._id.toString(),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
    sameSite: 'lax', // or 'strict' if no cross-site needs
  };

  (await cookies()).set(sessionCookie);

  // Optional: Rotate session ID on login (advanced)
  // (Not shown here for simplicity)

  console.info(`[AUTH] Successful login for ${user.email} from ${ip}`);
  return NextResponse.json({ success: true });
}
