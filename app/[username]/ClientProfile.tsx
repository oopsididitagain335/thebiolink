// app/[username]/ClientProfile.tsx
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
  type: string;
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

  useEffect(() => {
    setIsClient(true);
    if (customCSS) {
      const style = document.createElement('style');
      style.textContent = customCSS;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [customCSS]);

  useEffect(() => {
    if (customJS && isClient) {
      const script = document.createElement('script');
      script.textContent = customJS;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    }
  }, [customJS, isClient]);

  useEffect(() => {
    if (analyticsCode && isClient) {
      const script = document.createElement('script');
      script.textContent = analyticsCode;
      document.head.appendChild(script);
      return () => {
        document.head.removeChild(script);
      };
    }
  }, [analyticsCode, isClient]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      {hasVideoBackground ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="fixed top-0 left-0 w-full h-full object-cover z-[-1]"
        >
          <source src={pageBackground} type="video/mp4" />
        </video>
      ) : hasPageBackground ? (
        // ✅ Support GIFs (and all images) as background
        <div
          className="fixed top-0 left-0 w-full h-full bg-cover bg-center z-[-1]"
          style={{ backgroundImage: `url(${pageBackground})` }}
        />
      ) : (
        <div className="fixed top-0 left-0 w-full h-full bg-gray-900 z-[-1]" />
      )}

      <div className="relative max-w-2xl mx-auto px-4 py-12">
        {/* Banner */}
        {hasBanner && (
          <div
            className="w-full h-32 md:h-48 rounded-xl mb-6 overflow-hidden"
            style={{ backgroundImage: `url(${profileBanner})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
        )}

        {/* Avatar & Badges */}
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

          {/* ✅ BADGES: Show name next to icon */}
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

        {/* Bio */}
        {bio && <p className="text-center text-gray-300 mb-6">{bio}</p>}

        {/* Stats */}
        <div className="flex justify-center gap-4 text-sm text-gray-400 mb-8">
          <span>Level {level}</span>
          <span>•</span>
          <span>{profileViews} views</span>
          <span>•</span>
          <span>{loginStreak} day streak</span>
        </div>

        {/* Links */}
        <div className="space-y-3">
          {links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`block w-full text-center py-3 rounded-xl font-medium transition-all ${glow} bg-white/5 hover:bg-white/10 border border-white/10`}
            >
              {link.title}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
