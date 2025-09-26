// app/api/admin/users/route.ts
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getUserById, getAllUsers, addUserBadge, removeUserBadge } from '@/lib/storage';
import { ObjectId } from 'mongodb';

export async function GET() {
  const sessionId = (await cookies()).get('biolink_session')?.value;
  if (!sessionId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await getUserById(sessionId);
    if (!user || user.email !== 'lyharry31@gmail.com') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await getAllUsers();
    return Response.json(users);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const sessionId = (await cookies()).get('biolink_session')?.value;
  if (!sessionId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await getUserById(sessionId);
    if (!user || user.email !== 'lyharry31@gmail.com') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, badge } = await request.json();
    
    // Validate ObjectId
    try {
      new ObjectId(userId);
    } catch {
      return Response.json({ error: 'Invalid user ID' }, { status: 400 });
    }
    
    await addUserBadge(userId, {
      id: new ObjectId().toString(),
      name: badge.name,
      icon: badge.icon,
      awardedAt: new Date().toISOString()
    });
    
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'Failed to add badge' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const sessionId = (await cookies()).get('biolink_session')?.value;
  if (!sessionId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await getUserById(sessionId);
    if (!user || user.email !== 'lyharry31@gmail.com') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, badgeId } = await request.json();
    
    // Validate ObjectId
    try {
      new ObjectId(userId);
    } catch {
      return Response.json({ error: 'Invalid user ID' }, { status: 400 });
    }
    
    await removeUserBadge(userId, badgeId);
    
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'Failed to remove badge' }, { status: 500 });
  }
}\
