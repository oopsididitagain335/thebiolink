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
      const validThemes = ['indigo', 'purple', 'green', 'red', 'halloween'];
      const theme = validThemes.includes(profile.theme) ? profile.theme : 'indigo';

      // Sanitize location
      const location = profile.location ? profile.location.trim().substring(0, 100) : '';

      await updateUserProfile(user._id, {
        ...profile,
        theme,
        location, // ←←← PASS TO STORAGE
      });
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
