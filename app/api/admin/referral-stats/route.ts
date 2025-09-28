// app/api/admin/referral-stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserById } from '@/lib/storage';

interface Badge {
  name: string;
}

interface User {
  email: string;
  badges: Badge[];
}

// ✅ SELF-CONTAINED MOCK — no external dependency
// Replace this function with real DB logic when ready
async function getReferralStats() {
  // In production, you would:
  // 1. Query a 'referrals' collection
  // 2. Group by referrerId
  // 3. Join with users to get usernames

  // For now, return empty or mock data
  return [];
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

    const isAdmin =
      user.email === 'lyharry31@gmail.com' ||
      user.badges.some((b: Badge) => b.name === 'Owner');

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
    }

    const stats = await getReferralStats();
    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error('Referral stats error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
