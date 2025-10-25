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

    const updateData: any = {
      name: typeof profile.name === 'string' ? profile.name.substring(0, 100) : '',
      username: typeof profile.username === 'string' ? profile.username.toLowerCase().substring(0, 30) : '',
      avatar: typeof profile.avatar === 'string' ? profile.avatar : '',
      profileBanner: typeof profile.profileBanner === 'string' ? profile.profileBanner : '',
      pageBackground: typeof profile.pageBackground === 'string' ? profile.pageBackground : '',
      bio: typeof profile.bio === 'string' ? profile.bio.substring(0, 500) : '',
      location: typeof profile.location === 'string' ? profile.location.substring(0, 100) : '',
      theme: ['indigo', 'purple', 'green', 'red', 'halloween'].includes(profile.theme) ? profile.theme : 'indigo',
      seoMeta: {
        title: typeof profile.seoMeta?.title === 'string' ? profile.seoMeta.title.substring(0, 100) : '',
        description: typeof profile.seoMeta?.description === 'string' ? profile.seoMeta.description.substring(0, 200) : '',
        keywords: typeof profile.seoMeta?.keywords === 'string' ? profile.seoMeta.keywords.substring(0, 200) : '',
      },
      layoutStructure: Array.isArray(profile.layoutStructure) ? profile.layoutStructure : [],
      analyticsCode: typeof profile.analyticsCode === 'string' ? profile.analyticsCode : '',
      email: typeof profile.email === 'string' ? profile.email : '',
    };

    await updateUserProfile(user._id, updateData);

    if (Array.isArray(links)) {
      await saveUserLinks(user._id, links);
    }
    if (Array.isArray(widgets)) {
      await saveUserWidgets(user._id, widgets);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Dashboard update error:', error);
    return Response.json({ error: 'Update failed' }, { status: 500 });
  }
}
