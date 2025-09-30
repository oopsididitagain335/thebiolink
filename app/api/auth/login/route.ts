// app/api/auth/login/route.ts
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getUserByEmail } from '@/lib/storage';
import bcrypt from 'bcryptjs';

const failedAttempts = new Map<string, { count: number; lastAttempt: number }>();

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
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

  const attempts = failedAttempts.get(ip);
  if (attempts && attempts.count >= MAX_ATTEMPTS) {
    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
    if (timeSinceLastAttempt < LOCKOUT_DURATION_MS) {
      const url = new URL('/pricing', process.env.NEXTAUTH_URL || 'http://localhost:3000');
      url.searchParams.set('login', 'failed');
      url.searchParams.set('error', 'Too many failed attempts. Try again later.');
      return Response.redirect(url, 303);
    } else {
      failedAttempts.delete(ip);
    }
  }

  try {
    const contentType = request.headers.get('content-type');
    let email: string | null = null;
    let password: string | null = null;
    let redirectTo: string | null = null;

    if (contentType?.includes('application/json')) {
      const body = await request.json();
      email = body.email;
      password = body.password;
      redirectTo = body.redirectTo;
    } else {
      const formData = await request.formData();
      email = formData.get('email') as string | null;
      password = formData.get('password') as string | null;
      redirectTo = formData.get('redirectTo') as string | null;
    }

    const safeRedirectTo = redirectTo?.startsWith('/pricing') ? '/pricing' : '/dashboard';

    // Validate inputs
    if (!email || !password) {
      const url = new URL(safeRedirectTo, process.env.NEXTAUTH_URL || 'http://localhost:3000');
      url.searchParams.set('login', 'failed');
      url.searchParams.set('error', 'Email and password required');
      return Response.redirect(url, 303);
    }

    // ✅ Get user and ensure passwordHash is loaded
    const user = await getUserByEmail(email);
    if (!user || !user.passwordHash) {
      // Track failed attempt
      if (attempts) {
        failedAttempts.set(ip, { count: attempts.count + 1, lastAttempt: Date.now() });
      } else {
        failedAttempts.set(ip, { count: 1, lastAttempt: Date.now() });
      }

      const url = new URL(safeRedirectTo, process.env.NEXTAUTH_URL || 'http://localhost:3000');
      url.searchParams.set('login', 'failed');
      url.searchParams.set('error', 'Invalid credentials');
      return Response.redirect(url, 303);
    }

    // ✅ Compare password securely
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      if (attempts) {
        failedAttempts.set(ip, { count: attempts.count + 1, lastAttempt: Date.now() });
      } else {
        failedAttempts.set(ip, { count: 1, lastAttempt: Date.now() });
      }

      const url = new URL(safeRedirectTo, process.env.NEXTAUTH_URL || 'http://localhost:3000');
      url.searchParams.set('login', 'failed');
      url.searchParams.set('error', 'Invalid credentials');
      return Response.redirect(url, 303);
    }

    // ✅ Check ban status
    if (user.isBanned) {
      const url = new URL(safeRedirectTo, process.env.NEXTAUTH_URL || 'http://localhost:3000');
      url.searchParams.set('login', 'failed');
      url.searchParams.set('error', 'Account has been banned');
      return Response.redirect(url, 303);
    }

    // ✅ Success: clear attempts and set session
    failedAttempts.delete(ip);
    (await cookies()).set('biolink_session', user._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      sameSite: 'lax',
    });

    const url = new URL(safeRedirectTo, process.env.NEXTAUTH_URL || 'http://localhost:3000');
    url.searchParams.set('login', 'success');
    return Response.redirect(url, 303);

  } catch (error: any) {
    // 🔥 Log real error for debugging
    console.error('🚨 Login route crashed:', error.message || error);

    const url = new URL('/pricing', process.env.NEXTAUTH_URL || 'http://localhost:3000');
    url.searchParams.set('login', 'failed');
    url.searchParams.set('error', 'Login temporarily unavailable. Please try again.');
    return Response.redirect(url, 303);
  }
}
