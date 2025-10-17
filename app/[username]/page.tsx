// app/[username]/page.tsx
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

function getYouTubeId(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.*?v=))([^&?# ]{11})/);
  return match ? match[1] : '';
}

function getSpotifyId(url: string): string {
  const match = url.match(/spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/);
  return match ? `${match[1]}/${match[2]}` : '';
}

type LegacyBadge = {
  id: string;
  name: string;
  icon: string;
  awardedAt: string;
};

type Badge = {
  id: string;
  name: string;
  icon: string;
  awardedAt?: string;
  earnedAt?: string;
  hidden?: boolean;
};

export default async function UserPage({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = await params;
  const { username } = resolvedParams;

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
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900/60 backdrop-blur-xl rounded-2xl shadow-xl p-6 text-center border border-gray-700">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-indigo-600/20 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m2 0a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2h2m2-4v4m0 0v4m0-4h4m-4 0H7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Profile Not Found</h1>
          <p className="text-gray-400 mb-4">No BioLink exists for <span className="font-semibold">@{username}</span>.</p>
          <a href="/" className="inline-block bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-4 py-2.5 rounded-xl font-medium transition-all">
            Create Yours
          </a>
        </div>
      </div>
    );
  }

  if (userData.isBanned) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-red-500/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                opacity: Math.random(),
                animation: `floatAsh ${15 + Math.random() * 20}s linear infinite`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes floatAsh {
            0% { transform: translateY(0) rotate(0deg); opacity: 0; }
            10% { opacity: ${0.3 + Math.random() * 0.4}; }
            90% { opacity: ${0.2 + Math.random() * 0.3}; }
            100% { transform: translateY(100vh) rotate(${360 * Math.random()}deg); opacity: 0; }
          }
        ` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/3 to-black pointer-events-none z-0" />
        <div className="max-w-md w-full bg-gray-900/85 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 text-center border border-red-800/50 relative z-10">
          <div className="mb-6 relative">
            <svg width="80" height="100" viewBox="0 0 80 100" className="text-red-900/20 mx-auto">
              <rect x="30" y="15" width="20" height="60" rx="3" />
              <rect x="15" y="65" width="50" height="10" rx="2" />
              <path d="M25 25 L55 25 L52 40 L28 40 Z" fill="currentColor" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center mt-8">
              <span className="text-red-500/70 text-xs font-mono tracking-wider">@{username}</span>
            </div>
          </div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-800 mb-2 tracking-tighter">
            BANNED
          </h1>
          <p className="text-gray-400 text-sm mb-6">
            This account violated our community standards.<br />
            <span className="text-red-400/80">No appeals accepted.</span>
          </p>
          <div className="bg-black/30 rounded-xl p-4 mb-6 border border-red-900/30">
            <WhackTheBanHammerGame />
          </div>
          <a
            href="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-red-700/30 to-red-900/30 hover:from-red-700/40 hover:to-red-900/40 backdrop-blur-sm border border-red-800/50 text-red-300 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 hover:scale-[1.02]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Return to Safety
          </a>
        </div>
      </div>
    );
  }

  const {
    name = '',
    avatar = '',
    profileBanner = '',
    pageBackground = '',
    bio = '',
    location = '',
    badges = [] as (LegacyBadge | Badge)[],
    links = [],
    widgets = [],
    layoutStructure = [
      { id: 'bio', type: 'bio' },
      { id: 'spacer-1', type: 'spacer', height: 24 },
      { id: 'links', type: 'links' },
    ],
    profileViews = 0,
    theme = 'indigo',
  } = userData;

  const visibleBadges = badges.filter(badge => !('hidden' in badge ? badge.hidden : false));

  const hasBanner = !!profileBanner;
  const hasPageBackground = pageBackground && /\.(png|jpg|jpeg|webp)$/i.test(pageBackground);
  const hasVideoBackground = pageBackground && /\.(mp4|webm|ogg)$/i.test(pageBackground);

  const sortedLinks = [...links].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const sortedWidgets = [...widgets].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

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
      widgets={sortedWidgets}
      layoutStructure={layoutStructure}
      theme={theme}
      glow={glow}
      hasBanner={hasBanner}
      hasPageBackground={hasPageBackground}
      hasVideoBackground={hasVideoBackground}
      profileUrl={profileUrl}
      specialTag={getSpecialProfileTag(username)}
      getYouTubeId={getYouTubeId}
      getSpotifyId={getSpotifyId}
    />
  );
}

// For generateMetadata only
async function getUserByUsernameForMetadata(username: string) {
  try {
    const user = await getUserByUsername(username, '0.0.0.0');
    if (!user) return null;
    return {
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      isBanned: user.isBanned,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = await params;
  const { username } = resolvedParams;
  try {
    const userData = await getUserByUsernameForMetadata(username);
    if (!userData || userData.isBanned) {
      return { title: 'Banned | The BioLink' };
    }
    return {
      title: `${userData.name || username} | The BioLink`,
      description: userData.bio?.substring(0, 160) || `Check out ${userData.name || username}'s BioLink`,
      openGraph: {
        title: `${userData.name || username} | The BioLink`,
        description: userData.bio?.substring(0, 160) || `Check out ${userData.name || username}'s BioLink`,
        images: userData.avatar ? [userData.avatar] : [],
        url: `https://thebiolink.lol/${username}`,
        siteName: 'The BioLink',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${userData.name || username} | The BioLink`,
        description: userData.bio?.substring(0, 160) || `Check out ${userData.name || username}'s BioLink`,
        images: userData.avatar ? [userData.avatar] : [],
      },
    };
  } catch (error: any) {
    console.error('Metadata error:', { username, error: error.message });
    return { title: 'Not Found | The BioLink' };
  }
}
