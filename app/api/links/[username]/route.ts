// app/api/links/[username]/route.ts
import { NextRequest } from 'next/server';
import { getUserByUsername } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const clientId = request.headers.get('x-client-id') || 'anon';
  const data = await getUserByUsername(username, clientId);

  if (!data) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  return Response.json({
    name: data.name,
    username: data.username,
    avatar: data.avatar,
    profileBanner: data.profileBanner,
    pageBackground: data.pageBackground,
    bio: data.bio,
    location: data.location,
    badges: data.badges,
    isBanned: data.isBanned,
    profileViews: data.profileViews,
    links: data.links,
    widgets: data.widgets,
    layoutStructure: data.layoutStructure,
    theme: data.theme,
    xp: data.xp,
    level: data.level,
    loginStreak: data.loginStreak,
    customCSS: data.customCSS,
    customJS: data.customJS,
    analyticsCode: data.analyticsCode,
  });
}
