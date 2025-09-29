// app/api/auth/signup/route.ts
export const runtime = 'nodejs'; // ← Required for MongoDB

import { NextRequest } from 'next/server';
import { createUser, logReferral } from '@/lib/storage';
import { ObjectId } from 'mongodb';

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

async function checkAccountLimit(ipAddress: string): Promise<boolean> {
  // ✅ Use connectDB from storage instead of separate '@/lib/db'
  const db = await (await import('@/lib/storage')).connectDB();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const count = await db.collection('users').countDocuments({
    ipAddress,
    createdAt: { $gte: twentyFourHoursAgo }
  });
  return count < 2; // Max 2 accounts per IP per day
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const canCreateAccount = await checkAccountLimit(ip);
  if (!canCreateAccount) {
    return Response.json({
      error: 'Account creation limit reached for this IP address'
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

    // ✅ Extract referrer from URL query
    const { searchParams } = new URL(request.url);
    const referrerId = searchParams.get('ref');

    // Create user
    const newUser = await createUser(email, password, username, name, background, ip);

    // ✅ Log referral if valid
    if (referrerId && ObjectId.isValid(referrerId)) {
      // ✅ Use newUser.id (already a string), not newUser._id
      await logReferral(referrerId, newUser.id);
    }

    return Response.json({
      success: true,
      message: 'Account created successfully!'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Signup error:', error);
    if (error.code === 11000) {
      return Response.json({ error: 'Email or username already taken' }, { status: 409 });
    }
    return Response.json({ error: 'Account creation failed' }, { status: 500 });
  }
}
