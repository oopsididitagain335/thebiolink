import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserById } from '@/lib/storage';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user._id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userData = await getUserById(user._id.toString());

    if (!userData) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json({
      success: true,
      user: {
        _id: userData._id,
        name: userData.name,
        username: userData.username,
        avatar: userData.avatar,
        bio: userData.bio,
        location: userData.location || '',
        background: userData.background || '',
        backgroundVideo: (userData as any).backgroundVideo || '', // safe access
        backgroundAudio: (userData as any).backgroundAudio || '', // safe access
        isEmailVerified: userData.isEmailVerified,
        plan: userData.plan || 'free',
        profileViews: userData.profileViews || 0,
        theme: userData.theme || 'indigo',
        badges: Array.isArray(userData.badges) ? userData.badges : [],
        email: user.email, // from secure session
      },
      links: userData.links || [],
      widgets: userData.widgets || [],
      layoutStructure: userData.layoutStructure || [
        { id: 'bio', type: 'bio' },
        { id: 'spacer-1', type: 'spacer', height: 20 },
        { id: 'links', type: 'links' },
      ],
    });
  } catch (error: any) {
    console.error('Dashboard data fetch error:', error);
    return Response.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}
