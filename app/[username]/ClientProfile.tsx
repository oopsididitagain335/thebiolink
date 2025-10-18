// app/[username]/ClientProfile.tsx
'use client';

import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import Avatar from '@/components/Avatar';
import TypingBio from '@/components/TypingBio';

// ✅ Define helpers HERE — no need to pass as props
const getYouTubeId = (url: string): string => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.*?v=))([^&?# ]{11})/);
  return match ? match[1] : '';
};

const getSpotifyId = (url: string): string => {
  const match = url.match(/spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/);
  return match ? `${match[1]}/${match[2]}` : '';
};

// ✅ Props interface — NO function props
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
}

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
      {/* Background */}
      {hasBanner ? (
        <div className="absolute inset-0 z-0 flex justify-center">
          <div className="w-full max-w-4xl">
            <img src={profileBanner} alt="" className="w-full h-48 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>
          </div>
        </div>
      ) : hasVideoBackground ? (
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
        <div className="w-full max-w-md space-y-4">
          {/* Profile Card */}
          <div className={`bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center shadow-xl border border-white/20 ${glow}`}>
            <div className="-mt-16 mb-4">
              <Avatar name={name} avatar={avatar} />
            </div>

            <h1 className="text-3xl font-extrabold text-white tracking-tight">{name || username}</h1>

            {visibleBadges.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mt-2 mb-3">
                {visibleBadges.map((badge) => (
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

            {specialTag && (
              <div className="mt-3 pt-3 border-t border-white/20">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-sm">
                  🏆 {specialTag}
                </span>
              </div>
            )}

            <div className="mt-4">
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

          {showQR && qrCode && (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center shadow-lg border border-white/20">
              <h3 className="text-white font-medium mb-2">Scan to Visit</h3>
              <img
                src={qrCode}
                alt="QR Code"
                className="w-48 h-48 mx-auto rounded-lg border border-white/20"
              />
              <p className="text-gray-400 text-xs mt-2">Opens {profileUrl}</p>
            </div>
          )}

          {/* Layout Sections */}
          {layoutStructure.map((section) => {
            if (section.type === 'bio') return null;

            if (section.type === 'links' && links.length > 0) {
              return (
                <div key={section.id} className="space-y-2">
                  {links.map((link) => (
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
              );
            }

            if (section.type === 'widget') {
              const widget = widgets.find(w => w.id === section.widgetId);
              if (!widget) return null;
              return (
                <div key={section.id} className="bg-white/10 backdrop-blur-md rounded-xl p-4 shadow-lg border border-white/20">
                  {widget.title && <h3 className="text-lg font-semibold text-white mb-2">{widget.title}</h3>}
                  {widget.type === 'youtube' && widget.url && (
                    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
                      {/* ✅ Fixed: removed extra spaces in URL */}
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
                      {/* ✅ Fixed: removed extra spaces in URL */}
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
                  className="bg-white/10 backdrop-blur-md rounded-xl p-4 shadow-lg border border-white/20 prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(section.content) }}
                />
              );
            }

            return null;
          })}

          <div className="text-center text-gray-500 text-xs pt-4 border-t border-white/10 mt-4">
            <p className="mb-1">Powered by The BioLink</p>
            <a href="/" className="text-indigo-300 hover:text-indigo-200 hover:underline">Create your own</a>
          </div>
        </div>
      </div>
    </div>
  );
}
