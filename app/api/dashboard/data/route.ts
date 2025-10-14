// app/api/dashboard/data/route.ts
import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserById } from '@/lib/storage';

// Extend the expected user shape to include new optional fields
interface ExtendedUser {
  _id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  location: string;
  background: string;
  backgroundVideo?: string;
  backgroundAudio?: string;
  isEmailVerified: boolean;
  plan: string;
  profileViews: number;
  theme: string;
  layoutStructure: any[];
  links: any[];
  widgets: any[];
  badges: any[];
}

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

    // Cast to ExtendedUser to safely access new fields
    const safeUserData = userData as ExtendedUser;

    return Response.json({
      success: true,
      user: {
        _id: safeUserData._id,
        name: safeUserData.name,
        username: safeUserData.username,
        avatar: safeUserData.avatar,
        bio: safeUserData.bio,
        location: safeUserData.location || '',
        background: safeUserData.background,
        backgroundVideo: safeUserData.backgroundVideo || '',
        backgroundAudio: safeUserData.backgroundAudio || '',
        isEmailVerified: safeUserData.isEmailVerified,
        plan: safeUserData.plan || 'free',
        profileViews: safeUserData.profileViews || 0,
        theme: safeUserData.theme || 'indigo',
        badges: Array.isArray(safeUserData.badges) ? safeUserData.badges : [],
        email: user.email, // from secure session
      },
      links: safeUserData.links || [],
      widgets: safeUserData.widgets || [],
      layoutStructure: safeUserData.layoutStructure || [
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
