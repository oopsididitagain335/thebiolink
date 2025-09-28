import { NextRequest, NextResponse } from 'next/server';
import { getUserById, addUserBadge } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session-token')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserById(sessionToken);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = user.email === 'lyharry31@gmail.com' || user.badges.some((b) => b.name === 'Owner');
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Only admin can award badges' }, { status: 403 });
    }

    const { userId, badge } = await req.json();
    if (!userId || !badge) {
      return NextResponse.json({ error: 'Missing userId or badge' }, { status: 400 });
    }

    await addUserBadge(userId, badge);
    return NextResponse.json({ message: 'Badge awarded successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error awarding badge:', error);
    return NextResponse.json({ error: 'Failed to award badge' }, { status: 500 });
  }
}
