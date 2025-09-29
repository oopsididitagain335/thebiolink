// app/api/auth/signup/route.ts
import { NextRequest } from 'next/server';
import { createUser } from '@/lib/storage';
import { hashPassword } from '@/lib/auth';

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

async function checkAccountLimit(ipAddress: string): Promise<boolean> {
  return true; // placeholder
}

async function sendVerificationEmail(email: string, userId: string) {
  const response = await fetch('https://thebiolinkemail3.vercel.app/api/send-verification', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, id: userId }),
  });

  if (!response.ok) {
    console.error('Verification email failed to send');
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);

  const canCreateAccount = await checkAccountLimit(ip);
  if (!canCreateAccount) {
    return Response.json({
      error: 'Account creation limit reached for this IP'
    }, { status: 429 });
  }

  try {
    const { email, password, username, name, background } = await request.json();

    if (!email || !password || !username || !name) {
      return Response.json({ error: 'All fields required' }, { status: 400 });
    }

    if (password.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    if (background) {
      try {
        const url = new URL(background);
        const validHosts = ['giphy.com', 'media.giphy.com', 'tenor.com', 'media.tenor.com'];
        const isValidHost = validHosts.some(host => url.hostname.includes(host));
        const isValidFormat = background.toLowerCase().endsWith('.gif');
        if (!isValidHost || !isValidFormat) {
          return Response.json({ error: 'Invalid GIF URL. Must be from Giphy or Tenor (.gif)' }, { status: 400 });
        }
      } catch {
        return Response.json({ error: 'Invalid GIF URL format' }, { status: 400 });
      }
    }

    const hashedPassword = await hashPassword(password);

    // ✅ Pass 7 arguments — isEmailVerified = false
    const user = await createUser(
      email,
      hashedPassword,
      username,
      name,
      background,
      ip,
      false // ← email not verified yet
    );

    // ✉️ Send verification email
    await sendVerificationEmail(email, user.id);

    return Response.json({
      success: true,
      message: 'Account created! Please check your email to verify your account and continue.',
      requiresVerification: true
    }, { status: 201 });

  } catch (error: any) {
    console.error("Signup error:", error);
    if (error.message?.includes('already exists') || error.code === 11000) {
      return Response.json({ error: 'An account with this email already exists' }, { status: 409 });
    }
    return Response.json({ error: 'Account creation failed. Please try again.' }, { status: 500 });
  }
}
