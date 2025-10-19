'use client';

import { useEffect, useState } from 'react';

interface Badge {
  id: string;
  name: string;
  icon: string;
  awardedAt?: string;
  earnedAt?: string;
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
  children?: LayoutSection[];
  pagePath?: string;
  styling?: React.CSSProperties;
}

interface ClientProfileProps {
  username: string;
  name: string;
  avatar: string;
  profileBanner: string;
  pageBackground: string;
  bio: string;
  location: string;
  visibleBadges: Badge[];
  profileViews: number;
  links: LinkItem[];
  widgets: WidgetItem[];
  layoutStructure: LayoutSection[];
  theme: string;
  glow: string;
  hasBanner: boolean;
  hasPageBackground: boolean;
  hasVideoBackground: boolean;
  profileUrl: string;
  specialTag: string | null;
  xp: number;
  level: number;
  loginStreak: number;
  customCSS?: string;
  customJS?: string;
  seoMeta: { title: string; description: string; keywords: string };
  analyticsCode?: string;
}

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
    const cleanUrl = url.trim();
    const embedUrl = cleanUrl.includes('embed')
      ? cleanUrl
      : cleanUrl.replace('open.spotify.com', 'open.spotify.com/embed');
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

export default function ClientProfile({
  username,
  name,
  avatar,
  profileBanner,
  pageBackground,
  bio,
  location,
  visibleBadges,
  profileViews,
  links,
  widgets,
  layoutStructure,
  theme,
  glow,
  hasBanner,
  hasPageBackground,
  hasVideoBackground,
  profileUrl,
  specialTag,
  xp,
  level,
  loginStreak,
  customCSS,
  customJS,
  seoMeta,
  analyticsCode,
}: ClientProfileProps) {
  const [isClient, setIsClient] = useState(false);
  const [backgroundError, setBackgroundError] = useState(false);

  const isGifBackground = hasPageBackground && pageBackground.toLowerCase().endsWith('.gif');

  useEffect(() => {
    setIsClient(true);
    if (customCSS) {
      const style = document.createElement('style');
      style.textContent = customCSS;
      document.head.appendChild(style);
      return () => {
        if (document.head.contains(style)) document.head.removeChild(style);
      };
    }
  }, [customCSS]);

  useEffect(() => {
    if (customJS && isClient) {
      const script = document.createElement('script');
      script.textContent = customJS;
      document.body.appendChild(script);
      return () => {
        if (document.body.contains(script)) document.body.removeChild(script);
      };
    }
  }, [customJS, isClient]);

  useEffect(() => {
    if (analyticsCode && isClient) {
      const script = document.createElement('script');
      script.textContent = analyticsCode;
      document.head.appendChild(script);
      return () => {
        if (document.head.contains(script)) document.head.removeChild(script);
      };
    }
  }, [analyticsCode, isClient]);

  useEffect(() => {
    if (hasPageBackground && !isGifBackground && !hasVideoBackground) {
      const img = new Image();
      img.src = pageBackground;
      img.onerror = () => setBackgroundError(true);
    }
  }, [hasPageBackground, isGifBackground, hasVideoBackground, pageBackground]);

  const widgetMap = new Map(widgets.map((w) => [w.id, w]));

  return (
    <div className="min-h-screen bg-black text-white">
      {hasVideoBackground ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="fixed top-0 left-0 w-full h-full object-cover z-[-1]"
          onError={() => setBackgroundError(true)}
        >
          <source src={pageBackground} type="video/mp4" />
          <source src={pageBackground} type="video/webm" />
        </video>
      ) : isGifBackground ? (
        <div className="fixed top-0 left-0 w-full h-full z-[-1] overflow-hidden">
          <img
            src={pageBackground}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setBackgroundError(true)}
          />
        </div>
      ) : hasPageBackground ? (
        <div
          className="fixed top-0 left-0 w-full h-full bg-cover bg-center z-[-1]"
          style={{ backgroundImage: `url(${pageBackground})` }}
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
        {hasBanner && (
          <div
            className="w-full h-32 md:h-48 rounded-xl mb-6 overflow-hidden"
            style={{
              backgroundImage: `url(${profileBanner?.trim()})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}

        <div className="text-center mb-6">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              loading="lazy"
              className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-white/30"
            />
          ) : (
            <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl text-white font-bold">
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <h1 className="text-2xl font-bold">{name || username}</h1>
          {location && <p className="text-gray-400 text-sm mt-1">{location}</p>}
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
                  <img
                    src={badge.icon}
                    alt={badge.name}
                    className="w-5 h-5 rounded-full"
                  />
                  <span className="text-xs text-gray-300">{badge.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {bio && <p className="text-center text-gray-300 mb-6">{bio}</p>}

        <div className="flex justify-center gap-4 text-sm text-gray-400 mb-8">
          <span>Level {level}</span>
          <span>•</span>
          <span>{profileViews} views</span>
          <span>•</span>
          <span>{loginStreak} day streak</span>
        </div>

        <div className="space-y-6">
          {layoutStructure.map((section) => {
            if (section.type === 'bio') return null;
            if (section.type === 'links' && links.length > 0) {
              return (
                <div key={section.id} className="space-y-3">
                  {links.map((link) => (
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
