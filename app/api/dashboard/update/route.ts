// app/api/dashboard/update/route.ts
import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateUserProfile, saveUserLinks, saveUserWidgets } from '@/lib/storage';

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user._id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { profile, links, widgets } = await request.json();

    if (profile && typeof profile === 'object') {
      const validThemes = ['indigo', 'purple', 'green', 'red', 'halloween'];
      const theme = validThemes.includes(profile.theme) ? profile.theme : 'indigo';

      const name = (profile.name || '').trim().substring(0, 100);
      const username = (profile.username || '').trim().toLowerCase();
      const bio = (profile.bio || '').trim().substring(0, 500);
      const avatar = (profile.avatar || '').trim();
      const profileBanner = (profile.profileBanner || '').trim();
      const pageBackground = (profile.pageBackground || '').trim();
      const location = profile.location ? profile.location.trim().substring(0, 100) : '';

      // 🔒 SECURITY: Do NOT allow email or plan changes from frontend
      const updateData = {
        name,
        username,
        bio,
        avatar,
        profileBanner,
        pageBackground,
        location,
        theme,
        layoutStructure: profile.layoutStructure,
        discordId: profile.discordId,
      };

      await updateUserProfile(user._id, updateData);
    }

    if (Array.isArray(links)) {
      await saveUserLinks(user._id, links);
    }

    if (Array.isArray(widgets)) {
      await saveUserWidgets(user._id, widgets);
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Update error:', error);
    return Response.json(
      { error: error.message || 'Update failed' },
      { status: 400 }
    );
  }
}
