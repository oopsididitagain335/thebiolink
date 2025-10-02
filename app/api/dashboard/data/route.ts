// app/api/dashboard/data/route.ts
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getUserById } from '@/lib/storage';

export async function GET(request: NextRequest) {
  const sessionId = (await cookies()).get('biolink_session')?.value;
  
  if (!sessionId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // ✅ sessionId is the user's _id string (not an ObjectId instance)
    const user = await getUserById(sessionId);
    
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json({
      user: {
        _id: user._id,
        name: user.name || '',
        username: user.username || '',
        avatar: user.avatar || '',
        bio: user.bio || '',
        background: user.background || '',
        isEmailVerified: user.isEmailVerified,
        plan: 'free', // or pull from DB if you add it
      },
      links: user.links || [],
      widgets: user.widgets || [], // ✅ from updated storage.ts
      layout: user.layout || 'classic', // ✅
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    return Response.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
