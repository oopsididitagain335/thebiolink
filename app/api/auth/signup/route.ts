// app/api/auth/signup/route.ts
import { NextRequest } from 'next/server';
import { createUser, logReferral } from '@/lib/storage';
import { ObjectId } from 'mongodb';

// ✅ Helper to get client IP correctly
function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

// ✅ Check if IP has exceeded account creation limit (e.g., max 2 accounts per 24h)
async function checkAccountLimit(ipAddress: string): Promise<boolean> {
  const { db } = await import('@/lib/db'); // Lazy import to avoid edge runtime issues

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const count = await db.collection('users').countDocuments({
    signupIP: ipAddress,
    createdAt: { $gte: twentyFourHoursAgo }
  });

  return count < 2; // Allow up to 2 accounts per IP per day
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);

  // --- Account Creation Limit Check ---
  const canCreateAccount = await checkAccountLimit(ip);
  if (!canCreateAccount) {
    return Response.json({
      error: 'Account creation limit reached for this IP address'
    }, { status: 429 });
  }
  // --- End Limit Check ---

  try {
    const { email, password, username, name, background } = await request.json();

    if (!email || !password || !username || !name) {
      return Response.json({ error: 'All fields required' }, { status: 400 });
    }

    if (password.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Validate background GIF (Giphy/Tenor only)
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

    // ✅ Extract referrer from URL query params
    const { searchParams } = new URL(request.url);
    const referrerId = searchParams.get('ref');

    // Create user
    const newUser = await createUser(email, password, username, name, background, ip);

    // ✅ Log referral if valid
    if (referrerId && ObjectId.isValid(referrerId)) {
      // Verify referrer exists
      const { db } = await import('@/lib/db');
      const referrer = await db.collection('users').findOne({ _id: new ObjectId(referrerId) });
      if (referrer) {
        await logReferral(referrerId, newUser._id.toString());
      }
    }

    return Response.json({
      success: true,
      message: 'Account created successfully!'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Signup error:', error);
    if (error.message?.includes?.('already exists') || error.code === 11000) {
      return Response.json({ error: 'This email or username is already taken' }, { status: 409 });
    }
    return Response.json({ error: 'Account creation failed' }, { status: 500 });
  }
}
