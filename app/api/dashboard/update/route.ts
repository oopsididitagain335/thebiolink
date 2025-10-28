import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateUserProfile, saveUserLinks, saveUserWidgets } from '@/lib/storage';
import { revalidatePath } from 'next/cache';
import { connectDB } from '@/lib/storage';
import { ObjectId } from 'mongodb';

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user._id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { profile, links, widgets } = await request.json();

    // --- Validate and sanitize profile fields ---
    const sanitizedProfile = {
      name: typeof profile.name === 'string' ? profile.name.substring(0, 100).trim() : '',
      username: typeof profile.username === 'string'
        ? profile.username.toLowerCase().replace(/[^a-z0-9_-]/g, '').substring(0, 30)
        : '',
      avatar: typeof profile.avatar === 'string' ? profile.avatar.trim() : '',
      pageBackground: typeof profile.pageBackground === 'string' ? profile.pageBackground.trim() : '',
      bio: typeof profile.bio === 'string' ? profile.bio.substring(0, 500).trim() : '',
      location: typeof profile.location === 'string' ? profile.location.substring(0, 100).trim() : '',
      theme: ['indigo', 'purple', 'green', 'red', 'halloween'].includes(profile.theme)
        ? profile.theme
        : 'indigo',
      seoMeta: {
        title: typeof profile.seoMeta?.title === 'string' ? profile.seoMeta.title.substring(0, 100).trim() : '',
        description: typeof profile.seoMeta?.description === 'string' ? profile.seoMeta.description.substring(0, 200).trim() : '',
        keywords: typeof profile.seoMeta?.keywords === 'string' ? profile.seoMeta.keywords.substring(0, 200).trim() : '',
      },
      analyticsCode: typeof profile.analyticsCode === 'string' ? profile.analyticsCode.trim() : '',
      email: typeof profile.email === 'string' ? profile.email.trim() : '',
    };

    // --- Validate username uniqueness (excluding current user) ---
    if (sanitizedProfile.username) {
      const db = await connectDB();
      const existing = await db.collection('users').findOne({
        username: sanitizedProfile.username,
        _id: { $ne: new ObjectId(user._id) },
      });
      if (existing) {
        return Response.json({ error: 'Username already taken' }, { status: 409 });
      }
    }

    // --- Save all data ---
    await updateUserProfile(user._id, sanitizedProfile);

    if (Array.isArray(links)) {
      await saveUserLinks(user._id, links);
    }

    if (Array.isArray(widgets)) {
      // Filter out any 'audio' type widgets (defense in depth)
      const cleanWidgets = widgets.filter(w => w.type !== 'audio');
      await saveUserWidgets(user._id, cleanWidgets);
    }

    // ✅ Revalidate the user's public profile page
    const username = sanitizedProfile.username || user.username;
    revalidatePath(`/${username}`, 'page');

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Dashboard update error:', error);
    return Response.json({ error: error.message || 'Update failed' }, { status: 500 });
  }
}
