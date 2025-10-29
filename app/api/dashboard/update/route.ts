// app/api/dashboard/update/route.ts
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { updateUserProfile, saveUserLinks, saveUserWidgets } from '@/lib/storage';

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { profile, links, widgets } = body;

    // Validate username format
    if (profile.username && !/^[a-zA-Z0-9_-]{3,30}$/.test(profile.username)) {
      return new Response(JSON.stringify({ error: 'Invalid username format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Sanitize and prepare profile data
    const sanitizedProfile = {
      name: (profile.name || '').toString().substring(0, 100).trim(),
      username: (profile.username || '').toString().trim().toLowerCase(),
      avatar: (profile.avatar || '').toString().trim(),
      profileBanner: (profile.profileBanner || '').toString().trim(), // preserved but not editable
      pageBackground: (profile.pageBackground || '').toString().trim(),
      bio: (profile.bio || '').toString().substring(0, 500).trim(),
      location: (profile.location || '').toString().substring(0, 100).trim(),
      plan: ['free', 'premium'].includes(profile.plan) ? profile.plan : 'free',
      theme: ['indigo', 'purple', 'green', 'red', 'halloween'].includes(profile.theme)
        ? profile.theme
        : 'indigo',
      layoutStructure: Array.isArray(profile.layoutStructure) ? profile.layoutStructure : [],
      seoMeta: {
        title: (profile.seoMeta?.title || '').toString().substring(0, 100).trim(),
        description: (profile.seoMeta?.description || '').toString().substring(0, 200).trim(),
        keywords: (profile.seoMeta?.keywords || '').toString().substring(0, 200).trim(),
      },
      analyticsCode: (profile.analyticsCode || '').toString().trim(),
      email: profile.email, // optional, may be ignored by storage layer
      // ❌ audioUrl REMOVED
    };

    // Sanitize links
    const sanitizedLinks = (Array.isArray(links) ? links : [])
      .filter(link => link.url?.trim() && link.title?.trim())
      .map((link, index) => ({
        id: String(link.id || Date.now() + index),
        url: link.url.toString().trim(),
        title: link.title.toString().substring(0, 100).trim(),
        icon: (link.icon || '').toString().trim(),
        position: index,
      }));

    // Sanitize widgets
    const sanitizedWidgets = (Array.isArray(widgets) ? widgets : [])
      .map((widget, index) => ({
        id: String(widget.id || Date.now() + index),
        type: ['spotify', 'youtube', 'twitter', 'custom', 'form', 'ecommerce', 'api', 'calendar'].includes(widget.type)
          ? widget.type
          : 'custom',
        title: (widget.title || '').toString().substring(0, 100).trim(),
        content: (widget.content || '').toString().trim(),
        url: (widget.url || '').toString().trim(),
        position: index,
      }));

    // Save to database
    await updateUserProfile(session.user.id, sanitizedProfile);
    await saveUserLinks(session.user.id, sanitizedLinks);
    await saveUserWidgets(session.user.id, sanitizedWidgets);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Dashboard update error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Failed to update profile'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
