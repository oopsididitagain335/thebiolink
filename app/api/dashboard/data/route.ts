// app/api/dashboard/data/route.ts
import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserById } from '@/lib/storage';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user._id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userData = await getUserById(user._id.toString());

    if (!userData) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Safe date formatter
    const safeIso = (d: any) => {
      if (!d) return '';
      const date = new Date(d);
      return isNaN(date.getTime()) ? '' : date.toISOString();
    };

    return Response.json({
      success: true,
      user: {
        _id: userData._id,
        name: userData.name || '',
        username: userData.username || '',
        avatar: userData.avatar || '',
        profileBanner: userData.profileBanner || '',
        pageBackground: userData.pageBackground || '',
        bio: userData.bio || '',
        location: userData.location || '',
        isEmailVerified: Boolean(userData.isEmailVerified),
        plan: userData.plan || 'free',
        profileViews: userData.profileViews || 0,
        theme: userData.theme || 'indigo',
        badges: Array.isArray(userData.badges) ? userData.badges : [],
        email: user.email || '',
        discordId: userData.discordId || '',
        xp: userData.xp || 0,
        level: userData.level || 1,
        loginStreak: userData.loginStreak || 0,
        lastLogin: safeIso(userData.lastLogin),
        loginHistory: Array.isArray(userData.loginHistory)
          ? userData.loginHistory.map(safeIso).filter(Boolean)
          : [],
        lastMonthlyBadge: userData.lastMonthlyBadge || '',
        customCSS: userData.customCSS || '',
        customJS: userData.customJS || '',
        seoMeta: userData.seoMeta || { title: '', description: '', keywords: '' },
        analyticsCode: userData.analyticsCode || '',
      },
      links: userData.links || [],
      widgets: userData.widgets || [],
      layoutStructure: userData.layoutStructure || [],
    });
  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    return Response.json({ error: 'Failed to load dashboard data' }, { status: 500 });
  }
}
