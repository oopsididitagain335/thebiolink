'use client';

import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import Avatar from '@/components/Avatar';
import TypingBio from '@/components/TypingBio';

interface Badge {
  id: string;
  name: string;
  icon?: string;
  awardedAt?: string;
  earnedAt?: string;
}

interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon?: string;
  position?: number;
}

interface Widget {
  id: string;
  type: string;
  title?: string;
  url?: string;
  content?: string;
  position?: number;
}

interface LayoutSection {
  id: string;
  type: 'bio' | 'links' | 'widget' | 'spacer' | 'custom';
  widgetId?: string;
  height?: number;
  content?: string;
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
  widgets: Widget[];
  layoutStructure: LayoutSection[];
  theme: string;
  glow: string;
  hasBanner: boolean;
  hasPageBackground: boolean;
  hasVideoBackground: boolean;
  profileUrl: string;
  specialTag: string | null;
  getYouTubeId: (url: string) => string;
  getSpotifyId: (url: string) => string;
  level: number;
  loginStreak: number;
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

const generateQRWithLogo = async (url: string): Promise<string> => {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}`;
  const logoUrl = '/favicon.ico';

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve(qrCodeUrl);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      logo.onload = () => {
        const logoSize = 60;
        const x = (canvas.width - logoSize) / 2;
        const y = (canvas.height - logoSize) / 2;
        ctx.drawImage(logo, x, y, logoSize, logoSize);
        resolve(canvas.toDataURL('image/png'));
      };
      logo.onerror = () => resolve(qrCodeUrl);
      logo.src = logoUrl;
    };
    img.onerror = () => resolve(qrCodeUrl);
    img.src = qrCodeUrl;
  });
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
  getYouTubeId,
  getSpotifyId,
  level,
  loginStreak,
}: ClientProfileProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (showQR && !qrCode) {
      generateQRWithLogo(profileUrl).then(setQrCode);
    }
  }, [showQR, qrCode, profileUrl]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* Background Layer */}
      {hasVideoBackground ? (
        <video
          className="absolute inset-0 z-0 object-cover w-full h-full"
          src={pageBackground}
          autoPlay
          loop
          muted
          playsInline
        />
      ) : hasPageBackground ? (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${pageBackground})` }}
        />
      ) : (
        <div className="absolute inset-0 z-0" style={{ background: getThemeBackground(theme) }} />
      )}

      <div className="absolute inset-0 bg-black/40 z-10"></div>

      <div className="relative z-20 flex justify-center p-4 pt-16 min-h-screen">
        <div className="w-full max-w-md space-y-6">
          {/* Profile Card */}
          <div className={`bg-black/80 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10 ${glow}`}>
            
            {/* Banner */}
            {hasBanner && (
              <div className="w-full h-32 md:h-40 rounded-xl mb-4 overflow-hidden relative">
                <img 
                  src={profileBanner} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>
              </div>
            )}

            {/* Avatar & Identity */}
            <div className="flex flex-col items-center mb-4">
              <div className="-mt-16 mb-4">
                <Avatar name={name} avatar={avatar} />
              </div>
              <h1 className="text-2xl font-bold text-white">{name || username}</h1>
              {location && <p className="text-gray-400 text-sm mt-1">{location}</p>}
              
              {specialTag && (
                <span className="inline-block mt-2 px-3 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full border border-amber-500/30">
                  🏆 {specialTag}
                </span>
              )}
            </div>

            {/* Badges */}
            {visibleBadges.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-4">
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

            {/* Bio */}
            {bio && <TypingBio bio={bio} />}

            {/* Stats */}
            <div className="flex justify-center gap-4 text-sm text-gray-400 mt-4 mb-6">
              <span>Level {level}</span>
              <span>•</span>
              <span>{profileViews.toLocaleString()} views</span>
              <span>•</span>
              <span>{loginStreak} day streak</span>
            </div>

            {/* Links */}
            {links.length > 0 && (
              <div className="space-y-2 mb-6">
                {links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-3 px-4 rounded-xl font-medium text-white text-center transition-all duration-200 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:shadow-lg"
                  >
                    {link.icon ? (
                      <div className="flex items-center justify-center gap-2">
                        <img src={link.icon} alt="" className="w-5 h-5 rounded" />
                        <span>{link.title}</span>
                      </div>
                    ) : (
                      link.title
                    )}
                  </a>
                ))}
              </div>
            )}

            {/* QR Toggle */}
            <div className="text-center">
              <button
                onClick={() => setShowQR(!showQR)}
                className="text-indigo-300 hover:text-indigo-200 text-sm font-medium flex items-center justify-center gap-1 mx-auto"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V9a1 1 0 011-1z" />
                </svg>
                {showQR ? 'Hide QR Code' : 'Share via QR Code'}
              </button>
            </div>
          </div>

          {/* QR Code Modal */}
          {showQR && qrCode && (
            <div className="bg-black/80 backdrop-blur-md rounded-xl p-5 text-center shadow-lg border border-white/20">
              <h3 className="text-white font-medium mb-3">Scan to Visit</h3>
              <img
                src={qrCode}
                alt="QR Code"
                className="w-48 h-48 mx-auto rounded-lg border border-white/20"
              />
              <p className="text-gray-400 text-xs mt-2">Opens {profileUrl}</p>
            </div>
          )}

          {/* Widgets */}
          {layoutStructure.map((section) => {
            if (section.type === 'bio' || section.type === 'links') return null;

            if (section.type === 'widget') {
              const widget = widgets.find(w => w.id === section.widgetId);
              if (!widget) return null;
              return (
                <div key={section.id} className="bg-black/80 backdrop-blur-md rounded-xl p-4 shadow-lg border border-white/20">
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
                    <div
                      className="prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(widget.content) }}
                    />
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
                  className="bg-black/80 backdrop-blur-md rounded-xl p-4 shadow-lg border border-white/20 prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(section.content) }}
                />
              );
            }

            return null;
          })}

          <div className="text-center text-gray-500 text-xs pt-4 border-t border-white/10">
            <p className="mb-1">Powered by The BioLink</p>
            <a href="/" className="text-indigo-300 hover:text-indigo-200 hover:underline">Create your own</a>
          </div>
        </div>
      </div>
    </div>
  );
}
