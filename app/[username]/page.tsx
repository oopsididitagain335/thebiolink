import { headers } from 'next/headers';
import { getUserByUsername } from '@/lib/storage';
import ClientProfile from './ClientProfile';
import WhackTheBanHammerGame from './WhackTheBanHammerGame';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getSpecialProfileTag(username: string): string | null {
  switch (username.toLowerCase()) {
    case 'xsetnews': return 'Biggest Sponsored Member';
    case 'ceosolace': return 'Founder of BioLinkHQ';
    default: return null;
  }
}

export default async function UserPage({ params }: { params: { username: string; subPath?: string[] } }) {
  const { username } = params;
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
        <div className="max-w-md w-full bg-gray-900/60 backdrop-blur-xl rounded-2xl shadow-xl p-6 text-center border border-gray-700">
          <h1 className="text-xl font-bold text-white mb-2">Profile Not Found</h1>
          <p className="text-gray-400 mb-4">No BioLink exists for <span className="font-semibold">@{username}</span>.</p>
          <a href="/" className="inline-block bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl font-medium">
            Create Yours
          </a>
        </div>
      </div>
    );
  }

  if (userData.isBanned) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900/85 backdrop-blur-2xl rounded-3xl p-8 text-center border border-red-800/50">
          <h1 className="text-4xl font-black text-red-500 mb-2">BANNED</h1>
          <p className="text-gray-400 text-sm mb-6">
            This account violated our community standards.<br />
            <span className="text-red-400/80">No appeals accepted.</span>
          </p>
          <div className="bg-black/30 rounded-xl p-4 mb-6 border border-red-900/30">
            <WhackTheBanHammerGame />
          </div>
          <a href="/" className="text-red-300 px-5 py-2.5 rounded-xl font-medium">
            Return to Safety
          </a>
        </div>
      </div>
    );
  }

  const currentPageStructure = subPath
    ? userData.layoutStructure.filter(s => s.pagePath === subPath)
    : userData.layoutStructure.filter(s => !s.pagePath || s.pagePath === 'home');

  const {
    name = '',
    avatar = '',
    profileBanner = '',
    pageBackground = '',
    bio = '',
    location = '',
    badges = [],
    links = [],
    widgets = [],
    profileViews = 0,
    theme = 'indigo',
    xp = 0,
    level = 1,
    loginStreak = 0,
    customCSS = '',
    customJS = '',
    seoMeta = { title: '', description: '', keywords: '' },
    analyticsCode = '',
  } = userData;

  const visibleBadges = badges.filter((badge: any) => !badge.hidden);

  const hasBanner = !!profileBanner;
  const hasPageBackground = !!(pageBackground && /\.(png|jpe?g|webp|gif)$/i.test(pageBackground));
  const hasVideoBackground = !!(pageBackground && /\.(mp4|webm|ogg)$/i.test(pageBackground));

  const sortedLinks = [...links].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const themeGlowMap: Record<string, string> = {
    indigo: 'shadow-[0_0_20px_rgba(99,102,241,0.6)]',
    purple: 'shadow-[0_0_20px_rgba(168,85,247,0.6)]',
    green: 'shadow-[0_0_20px_rgba(34,197,94,0.6)]',
    red: 'shadow-[0_0_20px_rgba(239,68,68,0.6)]',
    halloween: 'shadow-[0_0_20px_rgba(234,88,12,0.6)]',
  };
  const glow = themeGlowMap[theme] || themeGlowMap.indigo;

  const profileUrl = `https://thebiolink.lol/${username}`;

  return (
    <ClientProfile
      username={username}
      name={name}
      avatar={avatar}
      profileBanner={profileBanner}
      pageBackground={pageBackground}
      bio={bio}
      location={location}
      visibleBadges={visibleBadges}
      profileViews={profileViews}
      links={sortedLinks}
      widgets={widgets}
      layoutStructure={currentPageStructure}
      theme={theme}
      glow={glow}
      hasBanner={hasBanner}
      hasPageBackground={hasPageBackground}
      hasVideoBackground={hasVideoBackground}
      profileUrl={profileUrl}
      specialTag={getSpecialProfileTag(username)}
      xp={xp}
      level={level}
      loginStreak={loginStreak}
      customCSS={customCSS}
      customJS={customJS}
      seoMeta={seoMeta}
      analyticsCode={analyticsCode}
    />
  );
}

export async function generateMetadata({ params }: { params: { username: string } }) {
  const { username } = params;
  try {
    const user = await getUserByUsername(username, '0.0.0.0');
    if (!user || user.isBanned) {
      return { title: 'Banned | The BioLink' };
    }
    return {
      title: `${user.name || username} (Level ${user.level}) | The BioLink`,
      description: user.bio?.substring(0, 160) || `Check out ${user.name || username}'s BioLink`,
    };
  } catch {
    return { title: 'Not Found | The BioLink' };
  }
}
