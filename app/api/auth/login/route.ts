// app/api/auth/login/route.ts
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getUserByEmail } from '@/lib/storage';
import bcrypt from 'bcryptjs';

// Simple in-memory store for failed attempts (consider Redis/MongoDB for production scaling)
const failedAttempts = new Map<string, { count: number; lastAttempt: number }>();

// Helper to get client IP
function getClientIP(request: NextRequest): string {
  // Prefer X-Forwarded-For header (set by proxies like Render)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP in the list (client IP)
    return forwardedFor.split(',')[0].trim();
  }
  // Fallback to X-Real-IP
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }
  // Ultimate fallback (might be localhost/proxy IP)
  return '127.0.0.1';
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);

  // --- Rate Limiting Logic (Inside Node.js Route) ---
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  const attempts = failedAttempts.get(ip);
  if (attempts && attempts.count >= MAX_ATTEMPTS) {
    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
    if (timeSinceLastAttempt < LOCKOUT_DURATION_MS) {
      return Response.json(
        { error: 'Too many failed attempts. Try again later.' },
        { status: 429 }
      );
    } else {
      // Reset attempts after lockout period
      failedAttempts.delete(ip);
    }
  }
  // --- End Rate Limiting ---

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }

    const user = await getUserByEmail(email);

    // --- Timing Attack Prevention ---
    const dummyHash = await bcrypt.hash('dummy', 12); // Always hash something
    const isValid = user ? await bcrypt.compare(password, user.passwordHash) : await bcrypt.compare(password, dummyHash);
    // --- End Timing Attack Prevention ---

    if (!isValid) {
      // --- Track Failed Attempts ---
      if (attempts) {
        failedAttempts.set(ip, {
          count: attempts.count + 1,
          lastAttempt: Date.now(),
        });
      } else {
        failedAttempts.set(ip, { count: 1, lastAttempt: Date.now() });
      }
      // --- End Tracking ---
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // --- Null Check: Handle case where email doesn't exist ---
    // Although isValid should be false if user is null, double-checking is safer
    if (!user) {
        // This case should theoretically not happen due to isValid check,
        // but TS requires the check and it's good defensive programming.
        return Response.json({ error: 'Authentication failed' }, { status: 500 });
    }
    // --- End Null Check ---

    // ✅ CHECK IF USER IS BANNED (AFTER VALID AUTHENTICATION)
    if (user.isBanned) {
        return Response.json({ error: 'Account has been banned' }, { status: 403 });
    }
    // ✅ END BAN CHECK

    // --- Clear Failed Attempts on Success ---
    failedAttempts.delete(ip);
    // --- End Clearing ---

    (await cookies()).set('biolink_session', user._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      sameSite: 'lax',
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    return Response.json({ error: 'Login failed' }, { status: 500 });
  }
}
