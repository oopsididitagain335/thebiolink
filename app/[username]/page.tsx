'use client';

import { useEffect, useState } from 'react';
import WhackTheBanHammerGame from './WhackTheBanHammerGame';
import { useParams } from 'next/navigation';

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
  children?: LayoutSection[];
}

interface UserData {
  username: string;
  name: string;
  avatar: string;
  pageBackground: string;
  bio: string;
  location: string;
  badges: Badge[];
  isBanned: boolean;
  profileViews: number;
  links: LinkItem[];
  widgets: WidgetItem[];
  layoutStructure: LayoutSection[];
  theme: string;
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
  const [backgroundError, setBackgroundError] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/links/${username}`);
        if (!res.ok) {
          setNotFound(res.status === 404);
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

  // Set isClient flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Inject custom CSS
  useEffect(() => {
    if (userData?.customCSS) {
      const style = document.createElement('style');
      style.textContent = userData.customCSS;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [userData?.customCSS]);

  // Inject custom JS
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

  // Inject analytics
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

  // Validate background media
  useEffect(() => {
    if (!userData?.pageBackground) return;
    const pageBg = userData.pageBackground;
    const isImage = /\.(png|jpe?g|webp|gif)$/i.test(pageBg);
    const isVideo = /\.(mp4|webm)$/i.test(pageBg);
    if (!isImage && !isVideo) {
      const img = new Image();
      img.src = pageBg;
      img.onerror = () => setBackgroundError(true);
    }
  }, [userData?.pageBackground]);

  // Early returns
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

  // Safe data processing
  const layoutStructure = userData.layoutStructure || [];
  const currentPageStructure = subPathString
    ? layoutStructure.filter((s) => s.pagePath === subPathString)
    : layoutStructure.filter((s) => !s.pagePath || s.pagePath === 'home');

  const visibleBadges = (userData.badges || []).filter((b) => !b.hidden);
  const sortedLinks = [...(userData.links || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const widgetMap = new Map((userData.widgets || []).map((w) => [w.id, w]));

  const pageBg = userData.pageBackground || '';
  const hasPageBackground = !!pageBg;
  const isImageBg = /\.(png|jpe?g|webp)$/i.test(pageBg);
  const isGifBg = /\.gif$/i.test(pageBg);
  const isVideoBg = /\.(mp4|webm)$/i.test(pageBg);

  const specialTag =
    username.toLowerCase() === 'xsetnews'
      ? 'Biggest Sponsored Member'
      : username.toLowerCase() === 'ceosolace'
        ? 'Founder of BioLinkHQ'
        : null;

  const renderWidget = (widget: WidgetItem) => {
    const { type, url, content, title } = widget;
    if (type === 'youtube' && url) {
      const cleanUrl = url.trim();
      const videoId = cleanUrl.split('v=')[1]?.split('&')[0] || cleanUrl.split('/').pop();
      return videoId ? (
        <iframe
          key={videoId}
          width="100%"
          height="315"
          src={`https://www.youtube.com/embed/${videoId}`}
          title={title || 'YouTube video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="rounded-lg w-full"
        />
      ) : null;
    }
    if (type === 'spotify' && url) {
      const embedUrl = url.includes('embed')
        ? url
        : url.replace('open.spotify.com', 'open.spotify.com/embed');
      return (
        <iframe
          key={embedUrl}
          src={embedUrl}
          width="100%"
          height="380"
          allow="encrypted-media"
          className="rounded-lg w-full"
        />
      );
    }
    if (type === 'custom' && content) {
      return (
        <div
          key="custom"
          dangerouslySetInnerHTML={{ __html: content }}
          className="prose prose-invert max-w-none"
        />
      );
    }
    if (type === 'twitter' && url) {
      return (
        <blockquote key="twitter" className="twitter-tweet">
          <a href={url.trim()}></a>
        </blockquote>
      );
    }
    return <div key="unsupported" className="text-gray-400 italic">Unsupported widget: {type}</div>;
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background */}
      {hasPageBackground && (
        <>
          {isVideoBg ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              className="fixed top-0 left-0 w-full h-full object-cover z-[-1] opacity-80"
              onError={() => setBackgroundError(true)}
            >
              <source src={pageBg} type="video/mp4" />
              <source src={pageBg} type="video/webm" />
            </video>
          ) : isGifBg ? (
            <img
              src={pageBg}
              alt="Background"
              className="fixed top-0 left-0 w-full h-full object-cover z-[-1] opacity-80"
              onError={() => setBackgroundError(true)}
            />
          ) : isImageBg ? (
            <div
              className="fixed top-0 left-0 w-full h-full bg-cover bg-center z-[-1] opacity-80"
              style={{ backgroundImage: `url(${pageBg})` }}
            />
          ) : (
            <div className="fixed top-0 left-0 w-full h-full bg-gray-900 z-[-1]" />
          )}
        </>
      )}

      {backgroundError && (
        <div className="fixed top-4 right-4 bg-red-500/80 text-white text-xs px-2 py-1 rounded">
          Background failed to load
        </div>
      )}

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          {/* Avatar */}
          {userData.avatar ? (
            <img
              src={userData.avatar}
              alt={userData.name}
              loading="lazy"
              className="w-28 h-28 rounded-full mx-auto mb-4 border-4 border-white/20 shadow-md"
            />
          ) : (
            <div className="w-28 h-28 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
              <span className="text-4xl text-white font-bold">
                {userData.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Name */}
          <h1 className="text-3xl font-bold text-white">{userData.name || username}</h1>

          {/* Location */}
          {userData.location && <p className="text-gray-300 text-sm mt-2">{userData.location}</p>}

          {/* Special Tag */}
          {specialTag && (
            <span className="inline-block mt-3 px-4 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-full border border-amber-500/30">
              {specialTag}
            </span>
          )}

          {/* Badges */}
          {visibleBadges.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {visibleBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-2 bg-gray-800/50 px-3 py-1 rounded-full border border-white/10"
                  title={badge.name}
                >
                  <img src={badge.icon} alt={badge.name} className="w-6 h-6 rounded-full" />
                  <span className="text-sm text-gray-200">{badge.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bio */}
        {userData.bio && (
          <p className="text-center text-gray-200 text-base max-w-xl mx-auto mb-8">{userData.bio}</p>
        )}

        {/* Stats */}
        <div className="flex justify-center gap-6 text-sm text-gray-300 mb-10">
          <span>Level {userData.level}</span>
          <span>•</span>
          <span>{userData.profileViews} views</span>
          <span>•</span>
          <span>{userData.loginStreak} day streak</span>
        </div>

        {/* Render layout structure */}
        <div className="space-y-8">
          {currentPageStructure.map((section) => {
            if (section.type === 'bio') return null;

            if (section.type === 'links' && sortedLinks.length > 0) {
              return (
                <div key={section.id} className="space-y-4">
                  {sortedLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center py-3 rounded-xl font-medium transition-all bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center gap-3 shadow-sm"
                    >
                      {link.icon && (
                        <img
                          src={link.icon}
                          alt=""
                          className="w-6 h-6 rounded"
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
                  <div key={section.id} className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 shadow-md">
                    {widget.title && <h3 className="text-xl font-semibold text-white mb-3">{widget.title}</h3>}
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
