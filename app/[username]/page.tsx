// app/[username]/page.tsx
import { headers } from 'next/headers';
import { getUserByUsername } from '@/lib/storage';
import ClientProfile from './ClientProfile';
import WhackTheBanHammerGame from './WhackTheBanHammerGame';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function UserPage({ params }: any) {
  const username = params.username;
  const subPath = params.subPath?.join('/') || '';

  const headersList = headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0';

  let userData;
  try {
    userData = await getUserByUsername(username, ip);
  } catch (error) {
    console.error('UserPage fetch error:', error);
    userData = null;
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <p className="text-white">Profile not found</p>
      </div>
    );
  }

  if (userData.isBanned) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <WhackTheBanHammerGame />
      </div>
    );
  }

  // ... rest of your render logic with ClientProfile
  const profileUrl = `https://thebiolink.lol/${username}`;
  const visibleBadges = userData.badges?.filter((b: any) => !b.hidden) || [];

  return (
    <ClientProfile
      username={username}
      name={userData.name || ''}
      avatar={userData.avatar || ''}
      profileBanner={userData.profileBanner || ''}
      pageBackground={userData.pageBackground || ''}
      bio={userData.bio || ''}
      location={userData.location || ''}
      visibleBadges={visibleBadges}
      profileViews={userData.profileViews || 0}
      links={userData.links || []}
      widgets={userData.widgets || []}
      layoutStructure={userData.layoutStructure || []}
      theme={userData.theme || 'indigo'}
      glow="shadow-[0_0_20px_rgba(99,102,241,0.6)]"
      hasBanner={!!userData.profileBanner}
      hasPageBackground={!!userData.pageBackground}
      hasVideoBackground={false}
      profileUrl={profileUrl}
      specialTag={null}
      xp={userData.xp || 0}
      level={userData.level || 1}
      loginStreak={userData.loginStreak || 0}
      customCSS={userData.customCSS || ''}
      customJS={userData.customJS || ''}
      seoMeta={{ title: '', description: '', keywords: '' }}
      analyticsCode={userData.analyticsCode || ''}
    />
  );
}
