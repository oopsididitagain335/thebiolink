// app/api/auth/signup/route.ts
import { NextRequest } from 'next/server';
import { createUser, isIpBanned, checkAccountLimit } from '@/lib/storage';

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    '127.0.0.1'
  );
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);

  // 🔒 BLOCK IF IP IS BANNED
  if (await isIpBanned(ip)) {
    return Response.json({
      error: 'Account creation blocked from this IP due to policy violations.'
    }, { status: 403 });
  }

  // 🚫 ENFORCE 2 ACCOUNTS PER IP — EVER
  if (!(await checkAccountLimit(ip))) {
    return Response.json({
      error: 'Maximum account limit (2) reached for this IP address.'
    }, { status: 403 });
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

    const user = await createUser(email, password, username, name, background, ip);
    return Response.json({ success: true, message: 'Account created successfully!' });
  } catch (error: any) {
    console.error('Signup error:', error);
    if (error.message.includes('Email already registered')) {
      return Response.json({ error: 'Email already in use' }, { status: 409 });
    }
    if (error.message.includes('Username already taken')) {
      return Response.json({ error: 'Username already taken' }, { status: 409 });
    }
    return Response.json({ error: 'Account creation failed' }, { status: 500 });
  }
}
