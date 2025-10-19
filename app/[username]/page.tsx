'use client';

import { useEffect, useState } from 'react';
import WhackTheBanHammerGame from './WhackTheBanHammerGame';
import { useParams } from 'next/navigation';

// --- Types ---
interface Badge {
  id: string;
  name: string;
  icon: string;
  hidden?: boolean;
}

interface LinkItem {
  id: string;
  url: string;
  title: string;
  icon?: string;
  position: number;
}

interface WidgetItem {
  id: string;
  type: 'spotify' | 'youtube' | 'twitter' | 'custom' | 'form' | 'ecommerce' | 'api' | 'calendar';
  title?: string;
  content?: string;
  url?: string;
  position: number;
}

interface LayoutSection {
  id: string;
  type: string;
  widgetId?: string;
  height?: number;
  content?: string;
  pagePath?: string;
}

interface UserData {
  name: string;
  avatar: string;
  profileBanner: string;
  pageBackground: string;
  bio: string;
  location: string;
  badges: Badge[];
  profileViews: number;
  links: LinkItem[];
  widgets: WidgetItem[];
  layoutStructure: LayoutSection[];
  theme: string;
  isBanned: boolean;
  xp: number;
  level: number;
  loginStreak: number;
  customCSS?: string;
  customJS?: string;
  analyticsCode?: string;
}

export default function UserPage() {
  const params = useParams<{ username: string; subPath?: string[] }>();
  const { username, subPath } = params;
  const subPathString = subPath?.join('/') || '';

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/links/${username}`);
        if (!res.ok) {
          if (res.status === 404) {
            setNotFound(true);
          } else {
            console.error('Fetch error:', res.status);
            setNotFound(true);
          }
          setLoading(false);
          return;
        }
        const data = await res.json();
        setUserData(data);
      } catch (err) {
        console.error('Network error:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchProfile();
    }
  }, [username]);

  // --- Loading / Not Found / Banned ---
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (notFound || !userData) {
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

  // ✅ Safely access nested arrays with fallbacks
  const layoutStructure = userData?.layoutStructure || [];
  const currentPageStructure = subPathString
    ? layoutStructure.filter((s: any) => s.pagePath === subPathString)
    : layoutStructure.filter((s: any) => !s.pagePath || s.pagePath === 'home');

  const visibleBadges = (userData?.badges || []).filter((badge: any) => !badge.hidden);
  const sortedLinks = [...(userData?.links || [])].sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));

  const themeGlowMap: Record<string, string> = {
    indigo: 'shadow-[0_0_20px_rgba(99,102,241,0.6)]',
    purple: 'shadow-[0_0_20px_rgba(168,85,247,0.6)]',
    green: 'shadow-[0_0_20px_rgba(34,197,94,0.6)]',
    red: 'shadow-[0_0_20px_rgba(239,68,68,0.6)]',
    halloween: 'shadow-[0_0_20px_rgba(234,88,12,0.6)]',
  };
  const glow = themeGlowMap[userData.theme || 'indigo'] || themeGlowMap.indigo;

  const pageBg = userData.pageBackground || '';
  const hasPageBackground = !!pageBg;
  const isImageBg = /\.(png|jpe?g|webp|gif)$/i.test(pageBg);
  const isVideoBg = /\.(mp4|webm)$/i.test(pageBg);

  const specialTag =
    username.toLowerCase() === 'xsetnews'
      ? 'Biggest Sponsored Member'
      : username.toLowerCase() === 'ceosolace'
        ? 'Founder of BioLinkHQ'
        : null;

  const [backgroundError, setBackgroundError] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // ✅ Cleanup returns void
  useEffect(() => {
    setIsClient(true);
    if (userData?.customCSS) {
      const style = document.createElement('style');
      style.textContent = userData.customCSS;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [userData?.customCSS]);

  // ✅ Cleanup returns void
  useEffect(() => {
    if (userData?.customJS && isClient) {
      const script = document.createElement('script');
      script.textContent = userData.customJS;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    }
  }, [userData?.customJS, isClient]);

  // ✅ Cleanup returns void
  useEffect(() => {
    if (userData?.analyticsCode && isClient) {
      const script = document.createElement('script');
      script.textContent = userData.analyticsCode;
      document.head.appendChild(script);
      return () => {
        document.head.removeChild(script);
      };
    }
  }, [userData?.analyticsCode, isClient]);

  useEffect(() => {
    if (hasPageBackground && !isImageBg && !isVideoBg) {
      const img = new Image();
      img.src = pageBg;
      img.onerror = () => setBackgroundError(true);
    }
  }, [hasPageBackground, isImageBg, isVideoBg, pageBg]);

  const widgetMap = new Map((userData?.widgets || []).map((w) => [w.id, w]));

  const renderWidget = (widget: WidgetItem) => {
    const { type, url, content, title } = widget;
    if (type === 'youtube' && url) {
      const cleanUrl = url.trim();
      const videoId = cleanUrl.split('v=')[1]?.split('&')[0] || cleanUrl.split('/').pop();
      return videoId ? (
        <iframe
          width="100%"
          height="315"
          src={`https://www.youtube.com/embed/${videoId}`}
          title={title || 'YouTube video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="rounded-lg"
        />
      ) : null;
    }
    if (type === 'spotify' && url) {
      const embedUrl = url.includes('embed')
        ? url
        : url.replace('open.spotify.com', 'open.spotify.com/embed');
      return (
        <iframe
          src={embedUrl}
          width="100%"
          height="380"
          allow="encrypted-media"
          className="rounded-lg"
        />
      );
    }
    if (type === 'custom' && content) {
      return (
        <div
          dangerouslySetInnerHTML={{ __html: content }}
          className="prose prose-invert max-w-none"
        />
      );
    }
    if (type === 'twitter' && url) {
      return (
        <blockquote className="twitter-tweet">
          <a href={url.trim()}></a>
        </blockquote>
      );
    }
    return <div className="text-gray-400 italic">Unsupported widget type: {type}</div>;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      {isVideoBg ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="fixed top-0 left-0 w-full h-full object-cover z-[-1]"
          onError={() => setBackgroundError(true)}
        >
          <source src={pageBg} type="video/mp4" />
          <source src={pageBg} type="video/webm" />
        </video>
      ) : isImageBg && pageBg.toLowerCase().endsWith('.gif') ? (
        <div className="fixed top-0 left-0 w-full h-full z-[-1] overflow-hidden">
          <img
            src={pageBg}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setBackgroundError(true)}
          />
        </div>
      ) : hasPageBackground && isImageBg ? (
        <div
          className="fixed top-0 left-0 w-full h-full bg-cover bg-center z-[-1]"
          style={{ backgroundImage: `url(${pageBg})` }}
        />
      ) : (
        <div className="fixed top-0 left-0 w-full h-full bg-gray-900 z-[-1]" />
      )}

      {backgroundError && (
        <div className="fixed top-4 right-4 bg-red-500/80 text-white text-xs px-2 py-1 rounded">
          Background failed to load
        </div>
      )}

      <div className="relative max-w-2xl mx-auto px-4 py-12">
        {userData.profileBanner && (
          <div
            className="w-full h-32 md:h-48 rounded-xl mb-6 overflow-hidden"
            style={{
              backgroundImage: `url(${userData.profileBanner})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}

        <div className="text-center mb-6">
          {userData.avatar ? (
            <img
              src={userData.avatar}
              alt={userData.name}
              loading="lazy"
              className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-white/30"
            />
          ) : (
            <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl text-white font-bold">
                {userData.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <h1 className="text-2xl font-bold">{userData.name || username}</h1>
          {userData.location && <p className="text-gray-400 text-sm mt-1">{userData.location}</p>}
          {specialTag && (
            <span className="inline-block mt-2 px-3 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full border border-amber-500/30">
              {specialTag}
            </span>
          )}

          {visibleBadges.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {visibleBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-1 bg-gray-800/50 px-2 py-1 rounded-full border border-white/10"
                  title={badge.name}
                >
                  <img src={badge.icon} alt={badge.name} className="w-5 h-5 rounded-full" />
                  <span className="text-xs text-gray-300">{badge.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {userData.bio && <p className="text-center text-gray-300 mb-6">{userData.bio}</p>}

        <div className="flex justify-center gap-4 text-sm text-gray-400 mb-8">
          <span>Level {userData.level}</span>
          <span>•</span>
          <span>{userData.profileViews} views</span>
          <span>•</span>
          <span>{userData.loginStreak} day streak</span>
        </div>

        <div className="space-y-6">
          {currentPageStructure.map((section) => {
            if (section.type === 'bio') return null;
            if (section.type === 'links' && sortedLinks.length > 0) {
              return (
                <div key={section.id} className="space-y-3">
                  {sortedLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block w-full text-center py-3 rounded-xl font-medium transition-all ${glow} bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center gap-2`}
                    >
                      {link.icon && (
                        <img
                          src={link.icon}
                          alt=""
                          className="w-5 h-5 rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <span>{link.title}</span>
                    </a>
                  ))}
                </div>
              );
            }
            if (section.type === 'widget' && section.widgetId) {
              const widget = widgetMap.get(section.widgetId);
              if (widget) {
                return (
                  <div key={section.id} className="bg-gray-800/30 p-4 rounded-xl border border-gray-700">
                    {widget.title && <h3 className="text-white font-medium mb-2">{widget.title}</h3>}
                    {renderWidget(widget)}
                  </div>
                );
              }
            }
            if (section.type === 'spacer') {
              return <div key={section.id} style={{ height: section.height || 24 }} />;
            }
            if (section.type === 'custom' && section.content) {
              return (
                <div
                  key={section.id}
                  dangerouslySetInnerHTML={{ __html: section.content }}
                  className="prose prose-invert max-w-none"
                />
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
}
