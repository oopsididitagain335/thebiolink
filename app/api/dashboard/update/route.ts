// app/api/dashboard/update/route.ts

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateUserProfile, saveUserLinks, saveUserWidgets } from '@/lib/storage';

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { profile, links, widgets } = await request.json();

    if (profile) {
      // Validate and sanitize theme
      const validThemes = ['indigo', 'purple', 'green', 'red', 'halloween'];
      const theme = validThemes.includes(profile.theme) ? profile.theme : 'indigo';

      // Sanitize all text fields
      const name = (profile.name || '').trim().substring(0, 100);
      const username = (profile.username || '').trim().toLowerCase();
      const bio = (profile.bio || '').trim().substring(0, 500);
      const avatar = (profile.avatar || '').trim();
      const background = (profile.background || '').trim();
      const location = profile.location ? profile.location.trim().substring(0, 100) : '';
      const email = profile.email ? profile.email.trim() : user.email;

      // Prepare update payload
      const updateData = {
        name,
        username,
        bio,
        avatar,
        background,
        location, // ✅ Now correctly saved
        theme,
        plan: profile.plan || user.plan || 'free',
        layoutStructure: profile.layoutStructure || user.layoutStructure,
        email,
      };

      // Save to database
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
    console.error('Update error:', error.message);
    return Response.json({ error: error.message || 'Failed to update data' }, { status: 400 });
  }
}
