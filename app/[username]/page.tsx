// app/[username]/page.tsx
import { headers } from 'next/headers';
import { getUserByUsername } from '@/lib/storage';
import WhackTheBanHammerGame from './WhackTheBanHammerGame';
import { NextPage } from 'next';

// --- Types (shared) ---
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

// --- Client Component ---
'use client';

import { useEffect, useState } from 'react';

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
  specialTag: string | null;
  xp: number;
  level: number;
  loginStreak: number;
  customCSS?: string;
  customJS?: string;
  analyticsCode?: string;
}

const ClientProfile = ({
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
  specialTag,
  xp,
  level,
  loginStreak,
  customCSS,
  customJS,
  analyticsCode,
}: ClientProfileProps) => {
  const [isClient, setIsClient] = useState(false);
  const [backgroundError, setBackgroundError] = useState(false);

  const isGifBackground = hasPageBackground && pageBackground.toLowerCase().endsWith('.gif');
  const widgetMap = new Map(widgets.map((w) => [w.id, w]));

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

  useEffect(() => {
    setIsClient(true);
    if (customCSS) {
      const style = document.createElement('style');
      style.textContent = customCSS;
      document.head.appendChild(style);
      return () => document.head.removeChild(style);
    }
  }, [customCSS]);

  useEffect(() => {
    if (customJS && isClient) {
      const script = document.createElement('script');
      script.textContent = customJS;
      document.body.appendChild(script);
      return () => document.body.removeChild(script);
    }
  }, [customJS, isClient]);

  useEffect(() => {
    if (analyticsCode && isClient) {
      const script = document.createElement('script');
      script.textContent = analyticsCode;
      document.head.appendChild(script);
      return () => document.head.removeChild(script);
    }
  }, [analyticsCode, isClient]);

  useEffect(() => {
    if (hasPageBackground && !isGifBackground && !hasVideoBackground) {
      const img = new Image();
      img.src = pageBackground;
      img.onerror = () => setBackgroundError(true);
    }
  }, [hasPageBackground, isGifBackground, hasVideoBackground, pageBackground]);

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
              backgroundImage: `url(${profileBanner})`,
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
              <span className="text-3xl text-white font-bold">{name.charAt(0).toUpperCase()}</span>
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
                  <img src={badge.icon} alt={badge.name} className="w-5 h-5 rounded-full" />
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
                          onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
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
};

// --- Server Page ---
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

  const hasPageBackground = !!userData.pageBackground;
  const pageBg = userData.pageBackground || '';
  const isImageBg = /\.(png|jpe?g|webp|gif)$/i.test(pageBg);
  const isVideoBg = /\.(mp4|webm)$/i.test(pageBg);

  const specialTag =
    username.toLowerCase() === 'xsetnews'
      ? 'Biggest Sponsored Member'
      : username.toLowerCase() === 'ceosolace'
        ? 'Founder of BioLinkHQ'
        : null;

  return (
    <ClientProfile
      username={username}
      name={userData.name || ''}
      avatar={userData.avatar || ''}
      profileBanner={userData.profileBanner || ''}
      pageBackground={pageBg}
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
      hasPageBackground={hasPageBackground && isImageBg}
      hasVideoBackground={hasPageBackground && isVideoBg}
      specialTag={specialTag}
      xp={userData.xp || 0}
      level={userData.level || 1}
      loginStreak={userData.loginStreak || 0}
      customCSS={userData.customCSS || ''}
      customJS={userData.customJS || ''}
      analyticsCode={userData.analyticsCode || ''}
    />
  );
};

export default UserPage;

// --- Metadata ---
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
