'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Head from 'next/head'; // <-- Required for dynamic OG tags
import Avatar from '@/components/Avatar';
import TypingBio from '@/components/TypingBio';
import WhackTheBanHammerGame from './WhackTheBanHammerGame';

// --- Keep all your helper functions exactly as before ---
function getYouTubeId(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.*?v=))([^&?# ]{11})/);
  return match ? match[1] : '';
}

function getSpotifyId(url: string): string {
  const match = url.match(/spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/);
  return match ? `${match[1]}/${match[2]}` : '';
}

function isMediaEmbedUrl(url: string): boolean {
  return /youtube\.com|youtu\.be|spotify\.com/.test(url);
}

function getSpecialProfileTag(username: string): string | null {
  switch (username.toLowerCase()) {
    case 'xsetnews': return 'Biggest Sponsored Member';
    case 'ceosolace': return 'Founder of BioLinkHQ';
    default: return null;
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

const renderBlock = (section: any, links: any[], widgets: any[], theme: string) => {
  const style: React.CSSProperties = section.styling || {};
  const baseClasses = 'mb-3 transition-all';

  switch (section.type) {
    case 'bio': return null;
    case 'links':
      if (links.length === 0) return null;
      return (
        <div key={section.id} className={baseClasses} style={style}>
          {links.map((link: any) => (
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
              ) : link.title}
            </a>
          ))}
        </div>
      );
    case 'widget':
      const widget = widgets.find((w: any) => w.id === section.widgetId);
      if (!widget) return <div key={section.id} className={baseClasses} style={style}>Widget not found</div>;
      return (
        <div key={section.id} className={`bg-white/10 backdrop-blur-md rounded-xl p-4 shadow-lg border border-white/20 ${baseClasses}`} style={style}>
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
            <a href={widget.url} target="_blank" rel="noopener noreferrer" className="block text-blue-300 hover:underline text-center mt-2">View on Twitter</a>
          )}
          {widget.type === 'form' && (
            <form className="space-y-3">
              <input type="text" placeholder="Your Name" className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded text-white" />
              <input type="email" placeholder="Email" className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded text-white" />
              <textarea placeholder="Message" rows={3} className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded text-white"></textarea>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded font-medium">Send Message</button>
            </form>
          )}
          {widget.type === 'ecommerce' && (
            <button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-white py-3 rounded font-medium">💰 Buy Now</button>
          )}
          {widget.type === 'calendar' && (
            <div className="bg-gray-800/50 p-3 rounded text-center text-gray-300">📅 Calendar integration coming soon</div>
          )}
          {widget.type === 'api' && (
            <div className="text-gray-300 text-sm">🔌 Dynamic content loaded from API</div>
          )}
          {widget.type === 'custom' && widget.content && <div dangerouslySetInnerHTML={{ __html: widget.content }} />}
        </div>
      );
    case 'spacer': return <div key={section.id} style={{ height: `${section.height}px`, ...style }}></div>;
    case 'form': return (
      <div key={section.id} className={`bg-white/10 backdrop-blur-md rounded-xl p-4 ${baseClasses}`} style={style}>
        <h3 className="text-lg font-semibold text-white mb-2">Contact Form</h3>
        <form className="space-y-3">
          <input type="text" placeholder="Name" className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded text-white" />
          <input type="email" placeholder="Email" className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded text-white" />
          <textarea placeholder="Message" rows={3} className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded text-white"></textarea>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded font-medium">Send</button>
        </form>
      </div>
    );
    case 'ecommerce': return (
      <div key={section.id} className={`bg-white/10 backdrop-blur-md rounded-xl p-4 text-center ${baseClasses}`} style={style}>
        <h3 className="text-lg font-semibold text-white mb-2">Support Me</h3>
        <button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-white py-3 rounded font-medium">💰 Buy Now</button>
      </div>
    );
    case 'calendar': return (
      <div key={section.id} className={`bg-white/10 backdrop-blur-md rounded-xl p-4 text-center ${baseClasses}`} style={style}>
        <h3 className="text-lg font-semibold text-white mb-2">My Calendar</h3>
        <div className="bg-gray-800/50 p-3 rounded text-gray-300">📅 Calendar view</div>
      </div>
    );
    case 'api': return (
      <div key={section.id} className={`bg-white/10 backdrop-blur-md rounded-xl p-4 ${baseClasses}`} style={style}>
        <h3 className="text-lg font-semibold text-white mb-2">Live Data</h3>
        <div className="text-gray-300 text-sm">🔌 Loading dynamic content...</div>
      </div>
    );
    case 'custom': return (
      <div key={section.id} className={`bg-white/10 backdrop-blur-md rounded-xl p-4 ${baseClasses}`} style={style}>
        {section.content && <div dangerouslySetInnerHTML={{ __html: section.content }} />}
      </div>
    );
    default: return <div key={section.id} className={baseClasses} style={style}>{section.type}</div>;
  }
};

export default function UserPage() {
  const pathname = usePathname();
  const username = pathname.split('/').filter(Boolean)[0];
  const [hasClicked, setHasClicked] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (hasClicked) {
      const fetchUser = async () => {
        try {
          const res = await fetch(`/api/user/${encodeURIComponent(username)}`);
          if (!res.ok) {
            if (res.status === 404) setError('not-found');
            else setError('generic');
            return;
          }
          const data = await res.json();
          setUserData(data);
        } catch {
          setError('generic');
        } finally {
          setLoading(false);
        }
      };
      fetchUser();
    }
  }, [hasClicked, username]);

  // --- Halloween Click Screen ---
  if (!hasClicked) {
    return (
      <div
        className="min-h-screen w-full bg-black flex flex-col items-center justify-center cursor-pointer relative overflow-hidden"
        onClick={() => setHasClicked(true)}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-red-900/10 animate-bounce"
            style={{
              left: `${10 + i * 12}%`,
              top: `${20 + (i % 3) * 20}%`,
              animationDuration: `${3 + i}s`,
              animationDelay: `${i * 0.5}s`,
              fontSize: `${20 + i * 2}px`,
            }}
          >
            🦇
          </div>
        ))}
        <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-black/90 to-transparent z-0 pointer-events-none"></div>
        <div className="absolute bottom-10 w-16 h-16 rounded-full bg-orange-600/20 blur-xl animate-pulse"></div>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes pulseGlow {
            0%, 100% { text-shadow: 0 0 10px #ea580c, 0 0 20px #ea580c; }
            50% { text-shadow: 0 0 20px #f97316, 0 0 30px #f97316; }
          }
          .haunted-text {
            animation: pulseGlow 2s infinite alternate;
          }
        ` }} />

        <div className="text-center z-10">
          <p className="text-3xl font-bold text-orange-500 haunted-text">Click to Enter</p>
          <p className="text-gray-500 text-sm mt-6">
            Powered by{' '}
            <a
              href={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/signup`}
              className="text-orange-400 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              BioLink
            </a>
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error === 'not-found') {
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

  if (error === 'generic') {
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
    bio = '',
    location = '',
    pageBackground = '',
    badges = [],
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

  const visibleBadges = badges.filter((badge: any) => !('hidden' in badge ? badge.hidden : false));
  const isInvalidBackground = pageBackground && isMediaEmbedUrl(pageBackground);
  const isValidGif = pageBackground && /\.gif$/i.test(pageBackground) && !isInvalidBackground;
  const isValidImage = pageBackground && /\.(png|jpg|jpeg|webp)$/i.test(pageBackground) && !isInvalidBackground;

  const themeGlowMap: Record<string, string> = {
    indigo: 'shadow-[0_0_20px_rgba(99,102,241,0.6)]',
    purple: 'shadow-[0_0_20px_rgba(168,85,247,0.6)]',
    green: 'shadow-[0_0_20px_rgba(34,197,94,0.6)]',
    red: 'shadow-[0_0_20px_rgba(239,68,68,0.6)]',
    halloween: 'shadow-[0_0_20px_rgba(234,88,12,0.6)]',
  };
  const glow = themeGlowMap[theme] || themeGlowMap.indigo;

  // --- OG Meta Tags for Discord/Twitter Embeds ---
  const displayName = name || username;
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=312e81&color=fff`;
  const ogImage = avatar || fallbackAvatar;
  const ogTitle = `${displayName} on BioLink`;
  const ogDescription = bio || `Check out ${displayName}'s BioLink profile`;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'; // Replace with your real domain in production
  const ogUrl = `${origin}/${username}`;

  return (
    <>
      {/* Inject dynamic OG tags */}
      <Head>
        <title>{displayName}</title>
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={ogUrl} />
        <meta property="og:type" content="profile" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImage} />
      </Head>

      <div className="min-h-screen relative overflow-hidden bg-black">
        {!isValidGif && !isValidImage && !isInvalidBackground && (
          <div className="absolute inset-0 z-0" style={{ background: getThemeBackground(theme), backgroundAttachment: 'fixed' }} />
        )}
        {isInvalidBackground && (
          <div className="absolute inset-0 z-0 bg-black flex items-center justify-center">
            <div className="text-center p-6 bg-gray-900/80 rounded-xl max-w-xs">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 17h.01M12 12h.01M12 15h.01M12 18h.01M12 21h.01M12 3h.01M12 6h.01" />
              </svg>
              <p className="text-white font-medium">Invalid Background</p>
              <p className="text-gray-300 text-sm mt-1">Media URLs cannot be used as page backgrounds.</p>
            </div>
          </div>
        )}
        {isValidImage && (
          <div
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${pageBackground})` }}
          />
        )}
        {isValidGif && (
          <img
            className="absolute inset-0 z-0 object-cover w-full h-full"
            src={pageBackground}
            alt="Animated background"
          />
        )}

        <div className="absolute inset-0 bg-black/60 z-10" />

        <div className="relative z-20 flex justify-center p-4 min-h-screen">
          <div className="w-full max-w-md space-y-4">
            <div className={`bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center shadow-xl border border-white/20 ${glow}`}>
              <div className="relative inline-block mb-4">
                <Avatar name={name} avatar={avatar} />
              </div>

              <h1 className="text-3xl font-extrabold text-white tracking-tight">{displayName}</h1>

              {visibleBadges.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-2 mb-3">
                  {visibleBadges.map((badge: any) => (
                    <span
                      key={badge.id}
                      className="inline-flex items-center text-xs font-medium text-gray-200 bg-white/10 px-2.5 py-1 rounded-full border border-white/10"
                      title={`Awarded: ${new Date(badge.awardedAt ?? badge.earnedAt ?? Date.now()).toLocaleDateString()}`}
                    >
                      {badge.icon && <img src={badge.icon} alt="" className="w-3.5 h-3.5 mr-1.5" />}
                      {badge.name}
                    </span>
                  ))}
                </div>
              )}

              {bio && <TypingBio bio={bio} />}

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

              {getSpecialProfileTag(username) && (
                <div className="mt-3 pt-3 border-t border-white/20">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-sm">
                    🏆 {getSpecialProfileTag(username)}
                  </span>
                </div>
              )}
            </div>

            {layoutStructure.map((section) => renderBlock(section, links, widgets, theme))}
          </div>
        </div>
      </div>
    </>
  );
}
