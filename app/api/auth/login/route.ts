// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Reuse your existing connectDB and getUserByEmail
import { connectDB, getUserByEmail } from '@/lib/storage';

// === CONFIGURATION ===
const MAX_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10);
const LOCKOUT_BASE_MINUTES = 15;
const MIN_HUMAN_DELAY_MS = 800;
const MAX_HUMAN_DELAY_MS = 10 * 60 * 1000;
const DUMMY_BCRYPT_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

// === INPUT VALIDATION ===
const LoginSchema = z.object({
  email: z.string().email().min(1).max(255),
  password: z.string().min(1).max(1024),
  recaptchaToken: z.string().min(1),
  timingToken: z.string().min(1),
});

// === IN-MEMORY RATE LIMITING (USE REDIS IN PROD) ===
const failedAttempts = new Map<string, { count: number; lastAttempt: number }>();

// === HELPERS ===
function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip')?.trim() ||
    '127.0.0.1'
  );
}

function getFingerprint(req: NextRequest): string {
  const parts = [
    req.headers.get('user-agent') || '',
    req.headers.get('accept') || '',
    req.headers.get('accept-language') || '',
    req.headers.get('accept-encoding') || '',
  ];
  return crypto.createHash('sha256').update(parts.join('||')).digest('hex');
}

function verifyTimingToken(token: string): boolean {
  const [ts, sig] = token.split('.');
  if (!ts || !sig || sig.length !== 64) return false;

  const expected = crypto
    .createHmac('sha256', process.env.LOGIN_TIMING_SECRET!)
    .update(ts)
    .digest('hex');

  const validSig = crypto.timingSafeEqual(
    Buffer.from(sig, 'hex'),
    Buffer.from(expected, 'hex')
  );

  if (!validSig) return false;

  const age = Date.now() - parseInt(ts, 10);
  return age >= MIN_HUMAN_DELAY_MS && age <= MAX_HUMAN_DELAY_MS;
}

async function checkLockout(ip: string, fp: string) {
  const key = `${ip}:${fp}`;
  const rec = failedAttempts.get(key);
  if (!rec) return;

  const lockMin = Math.min(
    LOCKOUT_BASE_MINUTES * Math.pow(2, rec.count - MAX_ATTEMPTS),
    24 * 60
  );
  const lockMs = lockMin * 60 * 1000;

  if (rec.count >= MAX_ATTEMPTS && Date.now() - rec.lastAttempt < lockMs) {
    throw { code: 'LOCKED', minutes: Math.ceil(lockMin) };
  }

  if (rec.count >= MAX_ATTEMPTS) failedAttempts.delete(key);
}

async function recordFail(ip: string, fp: string): Promise<number> {
  const key = `${ip}:${fp}`;
  const now = Date.now();
  const count = (failedAttempts.get(key)?.count || 0) + 1;
  failedAttempts.set(key, { count, lastAttempt: now });
  return count;
}

// === MAIN HANDLER ===
export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const fp = getFingerprint(request);

  try {
    const body = await request.json();
    const { email, password, recaptchaToken, timingToken } = LoginSchema.parse(body);

    // 1. Verify human timing
    if (!verifyTimingToken(timingToken)) {
      console.warn(`[BOT] Invalid timing from ${ip}`);
      return NextResponse.json({ error: 'Security check failed' }, { status: 403 });
    }

    // 2. Check lockout
    try {
      await checkLockout(ip, fp);
    } catch (e: any) {
      if (e.code === 'LOCKED') {
        return NextResponse.json(
          { error: `Too many attempts. Try again in ${e.minutes} minutes.` },
          { status: 429 }
        );
      }
      throw e;
    }

    // 3. Verify reCAPTCHA
    const resCaptcha = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
      { method: 'POST' }
    );
    const captchaData = await resCaptcha.json();
    if (captchaData.score < 0.7) {
      console.warn(`[BOT] Low CAPTCHA score (${captchaData.score}) from ${ip}`);
      return NextResponse.json({ error: 'Security check failed' }, { status: 403 });
    }

    // 4. Authenticate
    const user = await getUserByEmail(email.toLowerCase().trim());
    const valid = user
      ? await bcrypt.compare(password, user.passwordHash)
      : await bcrypt.compare(password, DUMMY_BCRYPT_HASH);

    if (!valid || !user) {
      const attempts = await recordFail(ip, fp);
      console.warn(`[AUTH] Failed login for ${email} from ${ip} (${attempts} attempts)`);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (user.isBanned) {
      console.warn(`[SECURITY] Banned user ${user.email} login attempt from ${ip}`);
      return NextResponse.json({ error: 'Account banned' }, { status: 403 });
    }

    // 5. CREATE SESSION IN DB (without modifying storage.ts)
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const db = await connectDB();
    const { ObjectId } = await import('mongodb');
    
    await db.collection('sessions').insertOne({
      _id: new ObjectId(),
      sessionToken,
      userId: new ObjectId(user.id),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      createdAt: new Date(),
    });

    // Clear failed attempts
    failedAttempts.delete(`${ip}:${fp}`);

    // Set secure cookie
    (await cookies()).set('biolink_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax',
    });

    console.info(`[AUTH] Success: ${user.email} from ${ip}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });
  }
}
