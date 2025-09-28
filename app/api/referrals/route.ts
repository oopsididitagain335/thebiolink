// app/api/admin/referral-stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserById, getReferralStats } from '@/lib/storage';

interface Badge {
  name: string;
}

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session-token')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserById(sessionToken);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin =
      user.email === 'lyharry31@gmail.com' ||
      user.badges.some((b: Badge) => b.name === 'Owner');

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const stats = await getReferralStats();
    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error('Referral stats API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
