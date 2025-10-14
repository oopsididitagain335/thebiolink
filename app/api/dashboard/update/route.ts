// app/api/dashboard/route.ts
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
        email: user.email, // from secure auth session
        avatar: userData.avatar,
        bio: userData.bio,
        location: userData.location,
        background: userData.background,
        backgroundVideo: userData.backgroundVideo,
        backgroundAudio: userData.backgroundAudio,
        plan: userData.plan,
        theme: userData.theme,
        layoutStructure: userData.layoutStructure,
        profileViews: userData.profileViews,
        isEmailVerified: userData.isEmailVerified,
        badges: Array.isArray(userData.badges) ? userData.badges : [],
        links: userData.links || [],
        widgets: userData.widgets || [],
      },
    });
  } catch (error: any) {
    console.error('Dashboard fetch error:', error);
    return Response.json(
      { error: 'Failed to load dashboard' },
      { status: 500 }
    );
  }
}
