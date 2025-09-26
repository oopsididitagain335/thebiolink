import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getUserById } from '@/lib/storage';
import { ObjectId } from 'mongodb';

export async function GET() {
  const sessionId = (await cookies()).get('biolink_session')?.value;
  if (!sessionId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Validate session ID
    let userId: string;
    try {
      userId = new ObjectId(sessionId).toString();
    } catch {
      return Response.json({ error: 'Invalid session' }, { status: 401 });
    }

    const user = await getUserById(userId);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json({
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        isEmailVerified: user.isEmailVerified
      },
      links: user.links || []
    });
  } catch (error: any) {
    console.error('Data fetch error:', error);
    return Response.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
