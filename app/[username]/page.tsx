export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { headers } from 'next/headers';
import { getUserByUsername } from '@/lib/storage';
import Avatar from '@/components/Avatar';
import TypingBio from '@/components/TypingBio';

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

const getThemeBackground = (theme: string) => {
  const base = 'radial-gradient(circle at 50% 0%, ';
  switch (theme) {
    case 'purple': return `${base}#581c87, #000000)`;
    case 'green': return `${base}#065f46, #000000)`;
    case 'red': return `${base}#991b1b, #000000)`;
    case 'halloween':
      return `
        radial-gradient(circle at 30% 30%, #ea580c, #000000),
        repeating-conic-gradient(transparent 0deg 10deg, rgba(255,165,0,0.03) 10deg 20deg)
      `;
    default: return `${base}#312e81, #000000)`;
  }
};

function getYouTubeId(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.*?v=))([^&?# ]{11})/);
  return match ? match[1] : '';
}

function getSpotifyId(url: string): string {
  const match = url.match(/spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/);
  return match ? `${match[1]}/${match[2]}` : '';
}

function getSpecialProfileTag(username: string): string | null {
  switch (username.toLowerCase()) {
    case 'xsetnews': return 'Biggest Sponsored Member';
    case 'ceosolace': return 'Founder of BioLinkHQ';
    default: return null;
  }
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

  try {
    const userData = await getUserByUsername(username, ip);
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
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-900/60 backdrop-blur-xl rounded-2xl shadow-xl p-6 text-center border border-red-800/50">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-red-600/20 rounded-full animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 6L6 18M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Suspended</h1>
            <p className="text-gray-400 mb-4">This profile has been restricted.</p>
            <a href="/" className="inline-block bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-4 py-2.5 rounded-xl font-medium transition-all">
              Explore Others
            </a>
          </div>
        </div>
      );
    }

    const {
      name = '',
      avatar = '',
      bio = '',
      location = '',
      background = '',
      backgroundVideo = '',
      backgroundAudio = '',
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

    // ✅ FILTER OUT HIDDEN BADGES
    const visibleBadges = badges.filter(badge => !('hidden' in badge ? badge.hidden : false));

    const isValidGif = background && /\.gif$/i.test(background);
    const isValidBackgroundVideo = backgroundVideo && /\.(mp4|webm|ogg)$/i.test(backgroundVideo);
    const isValidImage = background && /\.(png|jpg|jpeg|webp)$/i.test(background);
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

    return (
      <div className="min-h-screen relative overflow-hidden bg-black">
        {/* Background */}
        {!isValidGif && !isValidBackgroundVideo && !isValidImage && (
          <div className="absolute inset-0 z-0" style={{ background: getThemeBackground(theme), backgroundAttachment: 'fixed' }} />
        )}
        {isValidBackgroundVideo && (
          <video
            className="absolute inset-0 z-0 object-cover w-full h-full"
            src={backgroundVideo}
            autoPlay
            loop
            muted
            playsInline
          />
        )}
        {isValidImage && !isValidBackgroundVideo && (
          <div
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${background})` }}
          />
        )}
        {isValidGif && (
          <img
            className="absolute inset-0 z-0 object-cover w-full h-full"
            src={background}
            alt="Animated background"
          />
        )}
        {backgroundAudio && <audio autoPlay loop><source src={backgroundAudio} type="audio/mpeg" /></audio>}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60 z-10" />

        {/* Main Content */}
        <div className="relative z-20 flex justify-center p-4 min-h-screen">
          <div className="w-full max-w-md space-y-4">
            {/* Profile Card */}
            <div className={`bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center shadow-xl border border-white/20 ${glow}`}>
              <div className="relative inline-block mb-4">
                <Avatar name={name} avatar={avatar} />
              </div>

              <h1 className="text-3xl font-extrabold text-white tracking-tight">{name || username}</h1>

              {/* ✅ ONLY VISIBLE BADGES RENDERED */}
              {visibleBadges.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-2 mb-3">
                  {visibleBadges.map((badge) => (
                    <span
                      key={badge.id}
                      className="inline-flex items-center text-xs font-medium text-gray-200 bg-white/10 px-2.5 py-1 rounded-full border border-white/10"
                      title={`Awarded: ${new Date(badge.awardedAt ?? (('earnedAt' in badge) ? badge.earnedAt : undefined) ?? Date.now()).toLocaleDateString()}`}
                    >
                      {badge.icon && (
                        <img src={badge.icon} alt="" className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      {badge.name}
                    </span>
                  ))}
                </div>
              )}

              {bio && <TypingBio bio={bio} />}

              {/* Location & Stats */}
              <div className="flex justify-center gap-4 text-xs text-gray-300 mt-4">
                {location && (
                  <div className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{location}</span>
                  </div>
                )}
                <span>👁️ {profileViews.toLocaleString()}</span>
                {links.length > 0 && <span>🔗 {links.length}</span>}
              </div>

              {/* Special Profile Tag (e.g., "Founder") */}
              {getSpecialProfileTag(username) && (
                <div className="mt-3 pt-3 border-t border-white/20">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-sm">
                    🏆 {getSpecialProfileTag(username)}
                  </span>
                </div>
              )}
            </div>

            {/* Links - Transparent Glass Buttons */}
            {sortedLinks.length > 0 && (
              <div className="space-y-2">
                {sortedLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-3.5 px-4 rounded-xl font-medium text-white text-center transition-all duration-200 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:shadow-lg hover:-translate-y-0.5"
                  >
                    {link.icon ? (
                      <div className="flex items-center justify-center gap-2">
                        <img src={link.icon} alt="" className="w-5 h-5" />
                        <span>{link.title}</span>
                      </div>
                    ) : (
                      link.title
                    )}
                  </a>
                ))}
              </div>
            )}

            {/* Widgets */}
            {sortedWidgets.length > 0 && (
              <div className="space-y-4">
                {sortedWidgets.map((widget) => (
                  <div key={widget.id} className="bg-white/10 backdrop-blur-md rounded-xl p-4 shadow-lg border border-white/20">
                    {widget.title && <h3 className="text-lg font-semibold text-white mb-2">{widget.title}</h3>}
                    {widget.type === 'youtube' && widget.url && (
                      <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
                        <iframe
                          src={`https://www.youtube.com/embed/${getYouTubeId(widget.url)}`}
                          title={widget.title || 'YouTube video'}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        ></iframe>
                      </div>
                    )}
                    {widget.type === 'spotify' && widget.url && (
                      <div className="aspect-square w-full max-w-xs mx-auto overflow-hidden rounded-lg">
                        <iframe
                          src={`https://open.spotify.com/embed/${getSpotifyId(widget.url)}`}
                          title={widget.title || 'Spotify embed'}
                          frameBorder="0"
                          allowTransparency
                          allow="encrypted-media"
                          className="w-full h-full"
                        ></iframe>
                      </div>
                    )}
                    {widget.type === 'twitter' && widget.url && (
                      <a
                        href={widget.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-blue-300 hover:underline text-center mt-2"
                      >
                        View on Twitter
                      </a>
                    )}
                    {widget.type === 'custom' && widget.content && (
                      <div dangerouslySetInnerHTML={{ __html: widget.content }} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-gray-500 text-xs pt-4 border-t border-white/10 mt-4">
              <p className="mb-1">Powered by The BioLink</p>
              <a href="/" className="text-indigo-300 hover:text-indigo-200 hover:underline">Create your own</a>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error: any) {
    console.error('UserPage error:', { username, error: error.message });
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900/60 backdrop-blur-xl rounded-2xl shadow-xl p-6 text-center border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-2">Oops!</h2>
          <p className="text-gray-400 mb-4">Something went wrong loading this profile.</p>
          <a href="/" className="inline-block bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-4 py-2.5 rounded-xl font-medium transition-all">
            Go Home
          </a>
        </div>
      </div>
    );
  }
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = await params;
  const { username } = resolvedParams;
  try {
    const userData = await getUserByUsernameForMetadata(username);
    if (!userData || userData.isBanned) {
      return { title: 'Not Found | The BioLink' };
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
