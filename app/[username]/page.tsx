// app/[username]/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { headers } from 'next/headers';
import { getUserByUsername } from '@/lib/storage';
import Avatar from '@/components/Avatar';
import Badges from '@/components/Badges';

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

export default async function UserPage({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = await params;
  const { username } = resolvedParams;
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0';

  try {
    const userData = await getUserByUsername(username, ip);
    if (!userData) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black p-4">
          <div className="max-w-md w-full bg-gray-800/70 backdrop-blur-lg rounded-3xl shadow-xl p-8 text-center border border-gray-700">
            <div className="w-20 h-20 mx-auto mb-5 flex items-center justify-center bg-indigo-700/20 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m2 0a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2h2m2-4v4m0 0v4m0-4h4m-4 0H7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">BioLink Not Found</h1>
            <p className="text-gray-300 mb-6">
              We couldn’t find a profile for <span className="font-medium">{username}</span>.
            </p>
            <a href="/" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-semibold transition-colors shadow-md">
              Create Yours
            </a>
          </div>
        </div>
      );
    }

    if (userData.isBanned) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black p-4">
          <div className="max-w-md w-full bg-gray-800/70 backdrop-blur-lg rounded-3xl shadow-xl p-8 text-center border border-gray-700">
            <div className="w-20 h-20 mx-auto mb-5 flex items-center justify-center bg-red-700/20 rounded-full animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 6L6 18M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Account Suspended</h1>
            <p className="text-gray-300 mb-6">This BioLink has been suspended.</p>
            <a href="/" className="inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl font-semibold transition-colors shadow-md">
              Explore Other BioLinks
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
      badges = [],
      links = [],
      widgets = [],
      layoutStructure = [
        { id: 'bio', type: 'bio' },
        { id: 'spacer-1', type: 'spacer', height: 20 },
        { id: 'links', type: 'links' },
      ],
      profileViews = 0,
      theme = 'indigo',
    } = userData;

    const isValidBackground = background && /\.(gif|png|jpg|jpeg|webp)$/i.test(background);
    const isValidBackgroundVideo = backgroundVideo && /\.(mp4|webm|ogg)$/i.test(backgroundVideo);
    const sortedLinks = [...links].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    const sortedWidgets = [...widgets].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    const themeHoverMap: Record<string, string> = {
      indigo: 'hover:bg-indigo-900/30',
      purple: 'hover:bg-purple-900/30',
      green: 'hover:bg-emerald-900/30',
      red: 'hover:bg-rose-900/30',
      halloween: 'hover:bg-orange-900/30',
    };
    const hoverClass = themeHoverMap[theme] || 'hover:bg-indigo-900/30';

    const wrapperClass = theme === 'halloween' 
      ? "relative z-20 flex justify-center p-4 min-h-screen"
      : "relative z-20 flex items-center justify-center p-4 min-h-screen";

    return (
      <div className="min-h-screen relative">
        {!isValidBackground && !isValidBackgroundVideo && (
          <div className="absolute inset-0 z-0" style={{ background: getThemeBackground(theme), backgroundAttachment: 'fixed' }} />
        )}
        {isValidBackgroundVideo && (
          <video className="absolute inset-0 z-0 object-cover w-full h-full" src={backgroundVideo} autoPlay loop muted playsInline />
        )}
        {isValidBackground && !isValidBackgroundVideo && (
          <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${background})` }} />
        )}
        {backgroundAudio && <audio autoPlay loop><source src={backgroundAudio} type="audio/mpeg" /></audio>}
        <div className="absolute inset-0 bg-black/30 z-10" />
        <div className={wrapperClass}>
          <div className="w-full max-w-md">
            {layoutStructure.map((section) => {
              if (section.type === 'bio') {
                if (theme === 'halloween') {
                  return (
                    <div key={section.id} className="flex items-center bg-white/5 backdrop-blur-lg border border-orange-500/20 rounded-full p-4 mb-6 shadow-[0_0_15px_rgba(234,88,12,0.6)]">
                      <div className="relative mr-3">
                        <Avatar name={name} avatar={avatar} className="w-12 h-12 rounded-full" />
                        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-orange-500 to-purple-500 opacity-50 blur"></div>
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-white">{name}</h1>
                        <div className="flex items-center text-orange-200 text-sm">
                          @{username}
                          {location && (
                            <>
                              <span className="mx-2">•</span>
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>{location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div key={section.id} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center mb-6">
                      <Avatar name={name} avatar={avatar} />
                      <h1 className="text-3xl font-bold text-white mt-3 mb-1">{name}</h1>
                      {location && (
                        <div className="flex items-center justify-center text-gray-200 mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{location}</span>
                        </div>
                      )}
                      {bio && <p className="text-gray-100 text-base mb-4 px-2">{bio}</p>}
                      <div className="text-gray-300 text-sm mb-4 flex justify-center gap-4">
                        <span>👁️ {profileViews.toLocaleString()}</span>
                        {links.length > 0 && <span>🔗 {links.length}</span>}
                      </div>
                      {badges.length > 0 && <Badges badges={badges} />}
                      {getSpecialProfileTag(username) && (
                        <div className="mt-4 pt-4 border-t border-white/20 animate-pulse">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg">
                            🏆 {getSpecialProfileTag(username)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                }
              }

              if (section.type === 'links' && sortedLinks.length > 0) {
                const linkClass = theme === 'halloween'
                  ? `block w-full py-3 px-5 rounded-full text-base font-medium text-white backdrop-blur-md border border-orange-500/20 ${hoverClass} transition-all hover:shadow-[0_0_10px_rgba(234,88,12,0.6)] hover:scale-105`
                  : `block w-full py-4 px-5 rounded-2xl text-base font-medium text-white backdrop-blur-md border border-white/20 ${hoverClass} transition-all hover:shadow-lg hover:scale-105`;

                return (
                  <div key={section.id} className="space-y-3 mb-6">
                    {sortedLinks.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkClass}
                      >
                        <div className="flex items-center justify-center">
                          {link.icon && <img src={link.icon} alt="" className="w-6 h-6 mr-3" />}
                          {link.title}
                        </div>
                      </a>
                    ))}
                  </div>
                );
              }

              if (section.type === 'widget' && section.widgetId) {
                const widget = sortedWidgets.find(w => w.id === section.widgetId);
                if (!widget) return null;
                const widgetClass = theme === 'halloween'
                  ? "bg-white/5 backdrop-blur-lg border border-orange-500/20 rounded-2xl p-4 mb-6 shadow-[0_0_10px_rgba(234,88,12,0.3)]"
                  : "bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 mb-6";
                return (
                  <div key={section.id} className={widgetClass}>
                    {widget.title && <h3 className="text-lg font-semibold text-white mb-3">{widget.title}</h3>}
                    {widget.type === 'youtube' && widget.url && (
                      <div className="aspect-video">
                        <iframe
                          src={`https://www.youtube.com/embed/${getYouTubeId(widget.url)}`}
                          title={widget.title || 'YouTube video'}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full rounded-xl"
                        ></iframe>
                      </div>
                    )}
                    {widget.type === 'spotify' && widget.url && (
                      <div className="aspect-video">
                        <iframe
                          src={`https://open.spotify.com/embed/${getSpotifyId(widget.url)}`}
                          title={widget.title || 'Spotify embed'}
                          frameBorder="0"
                          allowTransparency={true}
                          allow="encrypted-media"
                          className="w-full h-full rounded-xl"
                        ></iframe>
                      </div>
                    )}
                    {widget.type === 'twitter' && widget.url && (
                      <a href={widget.url} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:underline">
                        View Twitter Feed
                      </a>
                    )}
                    {widget.type === 'custom' && widget.content && (
                      <div dangerouslySetInnerHTML={{ __html: widget.content }} />
                    )}
                  </div>
                );
              }

              if (section.type === 'spacer') {
                return <div key={section.id} style={{ height: `${section.height}px` }} />;
              }

              if (section.type === 'custom' && section.content) {
                return (
                  <div 
                    key={section.id} 
                    className="my-4"
                    dangerouslySetInnerHTML={{ __html: section.content }} 
                  />
                );
              }

              return null;
            })}

            <div className="text-center text-gray-400 text-xs mt-8 pt-6 border-t border-white/10">
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
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-xl p-8 text-center border border-gray-700">
          <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
          <p className="text-gray-400 mb-6">Failed to load this profile.</p>
          <a href="/" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors">
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
      return { title: 'User Not Found | The BioLink' };
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
    return { title: 'User Not Found | The BioLink' };
  }
}
