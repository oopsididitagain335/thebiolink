// app/api/auth/login/route.ts
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers'; // Correct import for App Router
import { getUserByEmail } from '@/lib/storage';
import bcrypt from 'bcryptjs';

// Simple in-memory rate limiting (use MongoDB for persistence in production)
const failedAttempts = new Map<string, { count: number; lastAttempt: number }>();

// Helper to get client IP correctly
function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);

  // --- Rate Limiting (Inside Node.js Route) ---
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
      failedAttempts.delete(ip); // Reset after lockout
    }
  }
  // --- End Rate Limiting ---

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }

    const user = await getUserByEmail(email);

    // --- Null Check ---
    if (!user) {
        // Track failed attempt for invalid email too
        if (attempts) {
            failedAttempts.set(ip, {
            count: attempts.count + 1,
            lastAttempt: Date.now(),
            });
        } else {
            failedAttempts.set(ip, { count: 1, lastAttempt: Date.now() });
        }
        return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    // --- End Null Check ---

    // --- Timing Attack Prevention ---
    const isValid = await bcrypt.compare(password, user.passwordHash);
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

    // --- Clear Failed Attempts on Success ---
    failedAttempts.delete(ip);
    // --- End Clearing ---

    // Set cookie using the correct App Router method
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
