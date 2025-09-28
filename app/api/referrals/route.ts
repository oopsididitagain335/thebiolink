// Only admins can access referral endpoints
import { NextRequest, NextResponse } from 'next/server';
import { getUserById, getUserByReferralCode, getTopReferrers } from '@/lib/storage';

interface Badge {
  name: string;
}

interface User {
  _id: string;
  email: string;
  username: string;
  badges: Badge[];
}

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session-token')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserById(sessionToken) as User | null;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 🔒 ONLY admins allowed
    const isAdmin =
      user.email === 'lyharry31@gmail.com' ||
      user.badges.some((b: Badge) => b.name === 'Owner');

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Admins only' },
        { status: 403 }
      );
    }

    const referrers = await getTopReferrers(10);
    return NextResponse.json(referrers, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session-token')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserById(sessionToken) as User | null;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 🔒 ONLY admins allowed
    const isAdmin =
      user.email === 'lyharry31@gmail.com' ||
      user.badges.some((b: Badge) => b.name === 'Owner');

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Admins only' },
        { status: 403 }
      );
    }

    const { referralCode, referralId } = await req.json();
    if (!referralCode || !referralId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const referredUser = await getUserByReferralCode(referralCode, referralId) as User | null;
    if (!referredUser) {
      return NextResponse.json({ error: 'Invalid referral' }, { status: 404 });
    }

    return NextResponse.json(
      { userId: referredUser._id, username: referredUser.username },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
