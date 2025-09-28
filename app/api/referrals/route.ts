import { NextRequest, NextResponse } from 'next/server';
import { getUserById, getUserByReferralCode, getTopReferrers } from '@/lib/storage';

export async function GET(req: NextRequest) {
  try {
    // Check for session cookie
    const sessionToken = req.cookies.get('session-token')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user based on session token
    const user = await getUserById(sessionToken);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.email !== 'lyharry31@gmail.com') {
      return NextResponse.json({ error: 'Forbidden: Only admin can access top referrers' }, { status: 403 });
    }

    const referrers = await getTopReferrers(10);
    return NextResponse.json(referrers, { status: 200 });
  } catch (error) {
    console.error('Error fetching top referrers:', error);
    return NextResponse.json({ error: 'Failed to fetch top referrers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { referralCode, referralId } = await req.json();
    if (!referralCode || !referralId) {
      return NextResponse.json({ error: 'Missing referral code or ID' }, { status: 400 });
    }

    const user = await getUserByReferralCode(referralCode, referralId);
    if (!user) {
      return NextResponse.json({ error: 'Invalid referral code or ID' }, { status: 404 });
    }

    return NextResponse.json({ userId: user._id, username: user.username }, { status: 200 });
  } catch (error) {
    console.error('Error validating referral:', error);
    return NextResponse.json({ error: 'Failed to validate referral' }, { status: 500 });
  }
}
