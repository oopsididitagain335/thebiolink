```tsx
import { headers } from 'next/headers';
import { getUserByUsername } from '@/lib/storage';
import ClientProfile from './ClientProfile';
import WhackTheBanHammerGame from './WhackTheBanHammerGame';
import { NextPage } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface UserPageProps {
  params: Promise<{ username: string; subPath?: string[] }>;
}

const UserPage: NextPage<UserPageProps> = async ({ params }) => {
  const resolvedParams = await params;
  const { username, subPath } = resolvedParams;
  const subPathString = subPath?.join('/') || '';

  const headersList = await headers();
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
      <div className="min-h-screen bg-black flex items-center justify-center p-4 text-white">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Profile Not Found</h1>
          <p>No BioLink exists for @{username}</p>
          <a href="/" className="mt-4 inline-block text-indigo-400 hover:underline">Create yours</a>
        </div>
      </div>
    );
  }

  if (userData.isBanned) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-500 mb-4">BANNED</h1>
          <WhackTheBanHammerGame />
          <a href="/" className="mt-6 inline-block text-red-400 hover:underline">Return home</a>
        </div>
      </div>
    );
  }

  const currentPageStructure = subPathString
    ? userData.layoutStructure.filter((s: any) => s.pagePath === subPathString)
    : userData.layoutStructure.filter((s: any) => !s.pagePath || s.pagePath === 'home');

  const visibleBadges = (userData.badges || []).filter((badge: any) => !badge.hidden);
  const sortedLinks = [...(userData.links || [])].sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));

  const themeGlowMap: Record<string, string> = {
    indigo: 'shadow-[0_0_20px_rgba(99,102,241,0.6)]',
    purple: 'shadow-[0_0_20px_rgba(168,85,247,0.6)]',
    green: 'shadow-[0_0_20px_rgba(34,197,94,0.6)]',
    red: 'shadow-[0_0_20px_rgba(239,68,68,0.6)]',
    halloween: 'shadow-[0_0_20px_rgba(234,88,12,0.6)]',
  };
  const glow = themeGlowMap[userData.theme || 'indigo'] || themeGlowMap.indigo;

  const profileUrl = `https://thebiolink.lol/${username}`;

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
      links={sortedLinks}
      widgets={userData.widgets || []}
      layoutStructure={currentPageStructure}
      theme={userData.theme || 'indigo'}
      glow={glow}
      hasBanner={!!userData.profileBanner}
      hasPageBackground={!!userData.pageBackground && /\.(png|jpe?g|webp|gif)$/i.test(userData.pageBackground)}
      hasVideoBackground={!!userData.pageBackground && /\.(mp4|webm|ogg)$/i.test(userData.pageBackground)}
      profileUrl={profileUrl}
      specialTag={(() => {
        const lower = username.toLowerCase();
        if (lower === 'xsetnews') return 'Biggest Sponsored Member';
        if (lower === 'ceosolace') return 'Founder of BioLinkHQ';
        return null;
      })()}
      xp={userData.xp || 0}
      level={userData.level || 1}
      loginStreak={userData.loginStreak || 0}
      customCSS={userData.customCSS || ''}
      customJS={userData.customJS || ''}
      seoMeta={{ title: '', description: '', keywords: '' }}
      analyticsCode={userData.analyticsCode || ''}
    />
  );
};

export default UserPage;

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  try {
    const user = await getUserByUsername(username, '0.0.0.0');
    if (!user || user.isBanned) {
      return { title: 'Banned | The BioLink' };
    }
    const desc = user.bio?.substring(0, 160) || `Check out ${user.name || username}'s BioLink`;
    return {
      title: `${user.name || username} (Level ${user.level}) | The BioLink`,
      description: desc,
      openGraph: { title: `${user.name || username} | The BioLink`, description: desc },
    };
  } catch {
    return { title: 'Not Found | The BioLink' };
  }
}
```
