// app/api/dashboard/update/route.ts
import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { updateUserProfile, saveUserLinks, saveUserWidgets } from '@/lib/storage';

export async function PUT(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const body = await req.json();
    const { profile, links, widgets } = body;

    if (profile.username && !/^[a-zA-Z0-9_-]{3,30}$/.test(profile.username)) {
      return new Response(JSON.stringify({ error: 'Invalid username format' }), { status: 400 });
    }

    await updateUserProfile(session.user.id, {
      name: profile.name?.substring(0, 100) || '',
      username: profile.username?.trim().toLowerCase() || '',
      avatar: profile.avatar?.trim() || '',
      profileBanner: profile.profileBanner?.trim() || '',
      pageBackground: profile.pageBackground?.trim() || '',
      bio: profile.bio?.substring(0, 500) || '',
      location: profile.location?.substring(0, 100) || '',
      plan: profile.plan || 'free',
      theme: ['indigo', 'purple', 'green', 'red', 'halloween'].includes(profile.theme) 
        ? profile.theme 
        : 'indigo',
      layoutStructure: profile.layoutStructure,
      seoMeta: profile.seoMeta || { title: '', description: '', keywords: '' },
      analyticsCode: profile.analyticsCode || '',
      email: profile.email,
    });

    await saveUserLinks(session.user.id, links || []);
    await saveUserWidgets(session.user.id, widgets || []);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    console.error('Dashboard update error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to update profile' }), { status: 400 });
  }
}
