import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserById } from '@/lib/storage';

// Define the UserData interface to clarify types
interface UserData {
  _id: string;
  name: string;
  username: string;
  avatar: string;
  profileBanner?: string;
  pageBackground?: string;
  bio: string;
  location?: string;
  isEmailVerified: boolean;
  plan?: string;
  profileViews?: number;
  theme?: string;
  badges?: Array<{ id: string; name: string; icon: string; hidden?: boolean }>;
  email: string;
  discordId?: string;
  xp?: number;
  level?: number;
  loginStreak?: number;
  lastLogin?: string; // ISO string (e.g., "2025-10-20T00:38:00.000Z")
  loginHistory?: string[]; // Array of ISO strings
  lastMonthlyBadge?: string;
  customCSS?: string;
  customJS?: string;
  seoMeta?: { title: string; description: string; keywords: string };
  analyticsCode?: string;
  links?: Array<{
    id: string;
    url: string;
    title: string;
    icon?: string;
    position: number;
  }>;
  widgets?: Array<{
    id: string;
    type: 'spotify' | 'youtube' | 'twitter' | 'custom' | 'form' | 'ecommerce' | 'api' | 'calendar';
    title?: string;
    content?: string;
    url?: string;
    position: number;
  }>;
  layoutStructure?: Array<{
    id: string;
    type: string;
    widgetId?: string;
    content?: string;
    styling?: { [key: string]: string };
    visibleLinks?: string[];
  }>;
}

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

    return Response.json({
      success: true,
      user: {
        _id: userData._id,
        name: userData.name,
        username: userData.username,
        avatar: userData.avatar,
        profileBanner: userData.profileBanner || '',
        pageBackground: userData.pageBackground || '',
        bio: userData.bio,
        location: userData.location || '',
        isEmailVerified: userData.isEmailVerified,
        plan: userData.plan || 'free',
        profileViews: userData.profileViews || 0,
        theme: userData.theme || 'indigo',
        badges: Array.isArray(userData.badges) ? userData.badges : [],
        email: user.email,
        discordId: userData.discordId,
        xp: userData.xp || 0,
        level: userData.level || 1,
        loginStreak: userData.loginStreak || 0,
        lastLogin: userData.lastLogin && !isNaN(Date.parse(userData.lastLogin))
          ? new Date(userData.lastLogin).toISOString()
          : '',
        loginHistory: (userData.loginHistory || []).map((d) =>
          !isNaN(Date.parse(d)) ? new Date(d).toISOString() : ''
        ),
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
  } catch (error: any) {
    console.error('Dashboard data fetch error:', error);
    return Response.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}
