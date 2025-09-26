// app/api/admin/ban/route.ts
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getUserById, banUser, unbanUser } from '@/lib/storage'; // ✅ Now imports correctly
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  const sessionId = (await cookies()).get('biolink_session')?.value;
  if (!sessionId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const adminUser = await getUserById(sessionId);
    if (!adminUser || adminUser.email !== 'lyharry31@gmail.com') { // ✅ Fixed email check
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, action } = await request.json();

    // Validate ObjectId
    try {
      new ObjectId(userId);
    } catch {
      return Response.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    if (action === 'ban') {
      await banUser(userId); // ✅ Now works
    } else if (action === 'unban') {
      await unbanUser(userId); // ✅ Now works
    } else {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Ban/Unban error:', error);
    return Response.json({ error: 'Operation failed' }, { status: 500 });
  }
}
