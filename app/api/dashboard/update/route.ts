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

    if (profile) {
      await updateUserProfile(user._id, {
        name: profile.name?.substring(0, 100) || '',
        username: profile.username?.toLowerCase() || '',
        avatar: profile.avatar || '',
        profileBanner: profile.profileBanner || '',
        pageBackground: profile.pageBackground || '',
        bio: profile.bio?.substring(0, 500) || '',
        location: profile.location?.substring(0, 100) || '',
        theme: ['indigo', 'purple', 'green', 'red', 'halloween'].includes(profile.theme) 
          ? profile.theme 
          : 'indigo',
        layoutStructure: profile.layoutStructure || [],
        customCSS: '',
        customJS: '',
        seoMeta: profile.seoMeta || { title: '', description: '', keywords: '' },
        analyticsCode: profile.analyticsCode || '',
        discordId: profile.discordId,
      });
    }

    if (Array.isArray(links)) await saveUserLinks(user._id, links);
    if (Array.isArray(widgets)) await saveUserWidgets(user._id, widgets);

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Update error:', error);
    return Response.json({ error: 'Update failed' }, { status: 400 });
  }
}
