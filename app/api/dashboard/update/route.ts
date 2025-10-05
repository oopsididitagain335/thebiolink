// api/dashboard/update/route.ts
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import {
  updateUserProfile,
  saveUserLinks,
  saveUserWidgets,
  getUserById,
  getUserByUsername,
} from '@/lib/storage';
export async function PUT(request: NextRequest) {
  const sessionId = (await cookies()).get('biolink_session')?.value;
  if (!sessionId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const currentUser = await getUserById(sessionId);
  if (!currentUser || currentUser.isBanned) {
    return Response.json({ error: 'Invalid session' }, { status: 403 });
  }
  const body = await request.json();
  const { profile, links = [], widgets = [] } = body;
  // ✅ Validate username uniqueness (if username is being changed)
  if (profile?.username) {
    const incoming = profile.username.trim();
    const incomingNormalized = incoming.toLowerCase();
    // 🔒 Safely handle possibly undefined currentUser.username
    const currentNormalized = currentUser.username?.toLowerCase() || '';
    if (incomingNormalized !== currentNormalized) {
      const existingUser = await getUserByUsername(incomingNormalized);
      if (existingUser) {
        return Response.json(
          { error: 'Username is already taken.' },
          { status: 409 }
        );
      }
    }
    // ✅ Validate username format
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(incoming)) {
      return Response.json(
        { error: 'Username must be 3–30 characters (letters, numbers, _, -).' },
        { status: 400 }
      );
    }
    // Preserve case
    profile.username = incoming;
  }
  try {
    // Save profile (includes layoutStructure)
    await updateUserProfile(currentUser._id, profile);
    // Save links and widgets
    await saveUserLinks(currentUser._id, links);
    await saveUserWidgets(currentUser._id, widgets);
    // Return fresh data
    const freshUser = await getUserById(currentUser._id);
    if (!freshUser || freshUser.isBanned) {
      return Response.json({ error: 'User not found after save' }, { status: 404 });
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
