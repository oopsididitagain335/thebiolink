// app/api/dashboard/data/route.ts
import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { getUserById } from '@/lib/storage';

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const userData = await getUserById(session.user.id);
    if (!userData) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    return new Response(JSON.stringify({
      user: {
        _id: userData._id,
        name: userData.name,
        username: userData.username,
        avatar: userData.avatar,
        profileBanner: userData.profileBanner,
        pageBackground: userData.pageBackground,
        bio: userData.bio,
        location: userData.location,
        isEmailVerified: userData.isEmailVerified,
        plan: userData.plan,
        profileViews: userData.profileViews,
        theme: userData.theme,
        badges: userData.badges,
        email: session.user.email, // from session
        xp: userData.xp,
        level: userData.level,
        loginStreak: userData.loginStreak,
        lastLogin: userData.lastLogin,
        loginHistory: userData.loginHistory,
        lastMonthlyBadge: userData.lastMonthlyBadge,
        seoMeta: userData.seoMeta,
        analyticsCode: userData.analyticsCode,
      },
      links: userData.links,
      widgets: userData.widgets,
      layoutStructure: userData.layoutStructure,
    }), { status: 200 });
  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
