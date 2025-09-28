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

    // Verify the target user exists
    const targetUser = await getUserById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Check if badge already exists
    const hasBadge = targetUser.badges.some((b) => b.id === badge.id);
    if (hasBadge) {
      return NextResponse.json({ error: 'Badge already awarded' }, { status: 400 });
    }

    await addUserBadge(userId, badge);
    console.log(`Badge awarded to user ${userId}: ${badge.name}`); // Debug log
    return NextResponse.json({ message: 'Badge awarded successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error awarding badge:', error);
    return NextResponse.json({ error: 'Failed to award badge' }, { status: 500 });
  }
}
