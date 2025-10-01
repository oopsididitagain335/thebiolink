// app/api/admin/users/route.ts
import { NextRequest } from 'next/server';
import {
  getAllUsers,
  addUserBadge,
  removeUserBadge,
  banUser,
  unbanUser,
} from '@/lib/storage';

export async function GET() {
  try {
    const users = await getAllUsers();
    return Response.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return Response.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, badge } = await req.json();
    if (!userId || !badge?.id || !badge.name || !badge.icon) {
      return Response.json({ error: 'Invalid badge data' }, { status: 400 });
    }

    await addUserBadge(userId, {
      id: badge.id,
      name: badge.name,
      icon: badge.icon,
      awardedAt: new Date().toISOString(),
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to add badge:', error);
    return Response.json({ error: 'Failed to add badge' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId, badgeId } = await req.json();
    if (!userId || !badgeId) {
      return Response.json({ error: 'User ID and badge ID required' }, { status: 400 });
    }

    await removeUserBadge(userId, badgeId);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to remove badge:', error);
    return Response.json({ error: 'Failed to remove badge' }, { status: 500 });
  }
}

// Handle ban/unban via separate route or extend this — but for now, keep simple
