// app/api/referrals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserById, getUserByReferralCode, getTopReferrers } from '@/lib/storage';

// Define types for type safety
interface Badge {
  name: string;
  // Add other fields if needed (e.g., id, awardedAt)
}

interface User {
  _id: string;        // This is your user ID
  email: string;
  username: string;
  badges: Badge[];
  referralCode?: string; // Optional: if you store it on the user
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

    // ✅ Allow access if:
    // - User is admin (Owner badge or your email), OR
    // - User has the "Sponsored" badge
    const isAdmin =
      user.email === 'lyharry31@gmail.com' ||
      user.badges.some((b: Badge) => b.name === 'Owner');

    const isSponsored = user.badges.some((b: Badge) => b.name === 'Sponsored');

    if (!isAdmin && !isSponsored) {
      return NextResponse.json(
        { error: 'Forbidden: Only admins or sponsored users can access this data' },
        { status: 403 }
      );
    }

    const referrers = await getTopReferrers(10);
    return NextResponse.json(referrers, { status: 200 });
  } catch (error) {
    console.error('Error fetching top referrers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { referralCode, referralId } = await req.json();
    if (!referralCode || !referralId) {
      return NextResponse.json(
        { error: 'Missing referral code or ID' },
        { status: 400 }
      );
    }

    const user = await getUserByReferralCode(referralCode, referralId) as User | null;
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid referral code or ID' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { userId: user._id, username: user.username },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error validating referral:', error);
    return NextResponse.json(
      { error: 'Failed to validate referral' },
      { status: 500 }
    );
  }
}
