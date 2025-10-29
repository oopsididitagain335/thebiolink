// app/api/dashboard/data/route.ts
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getUserById } from '@/lib/storage';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const userData = await getUserById(session.user.id);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Use email from session (trusted), not stored data
    const email = session.user.email || null;

    return new Response(
      JSON.stringify({
        user: {
          _id: userData._id,
          name: userData.name,
          username: userData.username,
          avatar: userData.avatar,
          profileBanner: userData.profileBanner, // kept for integrity, not editable
          pageBackground: userData.pageBackground,
          bio: userData.bio,
          location: userData.location,
          isEmailVerified: userData.isEmailVerified,
          plan: userData.plan,
          profileViews: userData.profileViews,
          theme: userData.theme,
          badges: userData.badges,
          email,
          xp: userData.xp,
          level: userData.level,
          loginStreak: userData.loginStreak,
          lastLogin: userData.lastLogin,
          loginHistory: userData.loginHistory,
          lastMonthlyBadge: userData.lastMonthlyBadge,
          seoMeta: userData.seoMeta,
          analyticsCode: userData.analyticsCode,
          // ❌ audioUrl REMOVED
        },
        links: userData.links || [],
        widgets: userData.widgets || [],
        layoutStructure: userData.layoutStructure || [
          { id: 'bio', type: 'bio' },
          { id: 'spacer-1', type: 'spacer', height: 24 },
          { id: 'links', type: 'links' },
        ],
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
