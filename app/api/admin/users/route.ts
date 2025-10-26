// app/api/admin/users/route.ts
import { NextRequest } from 'next/server';
import {
  getAllUsers,
  addUserBadge,
  removeUserBadge,
  banUser,
  unbanUser,
  updateUserById,
  deleteUserById,
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
    const body = await req.json();
    
    // Case 1: Remove badge (userId + badgeId)
    if (body.userId && body.badgeId) {
      await removeUserBadge(body.userId, body.badgeId);
      return Response.json({ success: true });
    }

    // Case 2: Delete user (only userId or id)
    if (body.userId || body.id) {
      const userId = body.userId || body.id;
      await deleteUserById(userId);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  } catch (error) {
    console.error('Delete operation failed:', error);
    return Response.json({ error: 'Operation failed' }, { status: 500 });
  }
}

// Handle user edits
export async function PUT(req: NextRequest) {
  try {
    const { id, name, username, email } = await req.json();
    if (!id || !name || !username || !email) {
      return Response.json({ error: 'ID, name, username, and email are required' }, { status: 400 });
    }

    const updatedUser = await updateUserById(id, { name, username, email });
    if (!updatedUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json(updatedUser);
  } catch (error: any) {
    console.error('Failed to update user:', error);
    if (error.code === 11000) {
      return Response.json({ error: 'Username or email already in use' }, { status: 409 });
    }
    return Response.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
