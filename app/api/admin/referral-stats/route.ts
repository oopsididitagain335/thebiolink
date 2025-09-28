// app/api/admin/referral-stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserById } from '@/lib/storage';

// Mock or real function to get referral counts
// You must implement `getReferralStats()` in your storage layer
import { getReferralStats } from '@/lib/storage';

interface Badge {
  name: string;
}

interface User {
  email: string;
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

    const isAdmin =
      user.email === 'lyharry31@gmail.com' ||
      user.badges.some((b: Badge) => b.name === 'Owner');

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Returns: [{ userId: '...', username: '...', usageCount: 5 }, ...]
    const stats = await getReferralStats();
    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error('Referral stats error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
