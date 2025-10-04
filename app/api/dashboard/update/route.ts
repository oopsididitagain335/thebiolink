// app/api/dashboard/update/route.ts
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import {
  updateUserProfile,
  saveUserLinks,
  saveUserWidgets,
  getUserById,
} from '@/lib/storage';

export async function PUT(request: NextRequest) {
  const sessionId = (await cookies()).get('biolink_session')?.value;
  if (!sessionId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await getUserById(sessionId);
  if (!user || user.isBanned) {
    return Response.json({ error: 'Invalid session' }, { status: 403 });
  }

  const body = await request.json();
  const { profile, links = [], widgets = [] } = body;

  try {
    // Save profile (includes layoutStructure)
    await updateUserProfile(user._id, profile);

    // Save links and widgets (backend generates new _id's)
    await saveUserLinks(user._id, links);
    await saveUserWidgets(user._id, widgets);

    // ✅ Return FRESH data with real widget IDs
    const freshUser = await getUserById(user._id);
    if (!freshUser || freshUser.isBanned) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json({
      success: true,
      user: {
        _id: freshUser._id,
        name: freshUser.name,
        username: freshUser.username,
        avatar: freshUser.avatar,
        bio: freshUser.bio,
        background: freshUser.background,
        isEmailVerified: freshUser.isEmailVerified,
        email: freshUser.email,
        plan: freshUser.plan,
      },
      links: freshUser.links,
      widgets: freshUser.widgets,
      layoutStructure: freshUser.layoutStructure,
    });
  } catch (error: any) {
    console.error('Save error:', error);
    return Response.json({ error: error.message || 'Save failed' }, { status: 500 });
  }
}
