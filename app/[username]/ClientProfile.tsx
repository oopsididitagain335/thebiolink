// app/[username]/clientprofile.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import Avatar from '@/components/Avatar';
import TypingBio from '@/components/TypingBio';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

const getYouTubeId = (url: string): string => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.*?v=))([^&?# ]{11})/);
  return match ? match[1] : '';
};

const getSpotifyId = (url: string): string => {
  const match = url.match(/spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/);
  return match ? `${match[1]}/${match[2]}` : '';
};

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
  type: 'bio' | 'links' | 'widget' | 'spacer' | 'custom' | 'form' | 'ecommerce' | 'tab' | 'column' | 'api' | 'calendar' | 'page';
  widgetId?: string;
  height?: number;
  content?: string;
  children?: LayoutSection[];
  pagePath?: string;
  styling?: { [key: string]: string };
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
  xp: number;
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
  xp,
  level,
  loginStreak,
}: ClientProfileProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const router = useRouter();
  const scriptRefs = useRef<{ [id: string]: HTMLScriptElement }>({});

  useEffect(() => {
    if (showQR && !qrCode) {
      generateQRWithLogo(profileUrl).then(setQrCode);
    }
  }, [showQR, qrCode, profileUrl]);

  useEffect(() => {
    // Sandbox custom JS
    layoutStructure.forEach((section) => {
      if (section.type === 'custom' && section.content?.includes('<script')) {
        const id = section.id;
        const script = document.createElement('script');
        script.text = section.content.match(/<script>([\s\S]*?)<\/script>/)?.[1] || '';
        scriptRefs.current[id] = script;
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        (iframe.contentWindow as any).document.open();
        (iframe.contentWindow as any).document.write('<script>' + script.text + '</script>');
        (iframe.contentWindow as any).document.close();
      }
    });

    return () => {
      Object.values(scriptRefs.current).forEach(script => script.remove());
      scriptRefs.current = {};
    };
  }, [layoutStructure]);

  const renderSection = (section: LayoutSection) => {
    switch (section.type) {
      case 'bio':
        return (
          <div key={section.id} className="text-center">
            {avatar ? (
              <LazyLoadImage src={avatar} alt={name} className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-white/30" />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl text-white font-bold">
                  {name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <h3 className="text-xl font-bold text-white mb-2">{name}</h3>
            {location && (
              <div className="flex items-center justify-center text-gray-300 mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{location}</span>
              </div>
            )}
            {bio && <TypingBio bio={bio} />}
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-yellow-400">Level {level}</span>
              <span className="text-blue-400">Streak: {loginStreak} days</span>
              <div className="w-32 h-2 bg-gray-700 rounded">
                <div style={{ width: `${(xp % 1000) / 10}%` }} className="h-full bg-green-500 rounded"></div>
              </div>
            </div>
          </div>
        );
      case 'links':
        return (
          <div key={section.id} className="space-y-3">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 px-4 rounded-lg text-sm text-white backdrop-blur-sm border border-white/10 hover:bg-white/20"
              >
                {link.icon && <img src={link.icon} alt="" className="w-4 h-4 inline mr-2" />}
                {link.title}
              </a>
            ))}
          </div>
        );
      case 'widget':
        const widget = widgets.find(w => w.id === section.widgetId);
        if (!widget) return null;
        return (
          <div key={section.id} className="bg-white/10 rounded-lg p-4 text-left">
            {widget.title && <h4 className="text-white font-medium mb-2">{widget.title}</h4>}
            {widget.type === 'youtube' && widget.url ? (
              <iframe
                src={`https://www.youtube.com/embed/${getYouTubeId(widget.url)}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full aspect-video"
              ></iframe>
            ) : widget.type === 'spotify' && widget.url ? (
              <iframe
                src={`https://open.spotify.com/embed/${getSpotifyId(widget.url)}`}
                frameBorder="0"
                allowTransparency={true}
                allow="encrypted-media"
                className="w-full h-80"
              ></iframe>
            ) : widget.type === 'twitter' && widget.url ? (
              <a href={widget.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                View Twitter Feed
              </a>
            ) : widget.type === 'custom' && widget.content ? (
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(widget.content) }} />
            ) : null}
          </div>
        );
      case 'spacer':
        return <div key={section.id} style={{ height: `${section.height}px` }} />;
      case 'custom':
        return <div key={section.id} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(section.content || '') }} style={section.styling} />;
      case 'form':
        return (
          <form key={section.id} onSubmit={(e) => {
            e.preventDefault();
            // Handle form submission, e.g., to Formspree
          }} style={section.styling}>
            {/* Render form fields from content JSON */}
            {JSON.parse(section.content || '[]').map((field: any) => (
              <input key={field.id} type={field.type} placeholder={field.placeholder} className="block w-full mb-2" />
            ))}
            <button type="submit">Submit</button>
          </form>
        );
      case 'ecommerce':
        return (
          <button key={section.id} onClick={async () => {
            const stripe = await stripePromise;
            // Handle Stripe checkout
          }} style={section.styling}>
            Buy Now
          </button>
        );
      case 'tab':
        return (
          <div key={section.id} className="tabs" style={section.styling}>
            {/* Render tabs from children */}
            {section.children?.map(child => renderSection(child))}
          </div>
        );
      case 'column':
        return (
          <div key={section.id} className="grid grid-cols-2" style={section.styling}>
            {section.children?.map(child => renderSection(child))}
          </div>
        );
      case 'api':
        const [data, setData] = useState(null);
        useEffect(() => {
          fetch(section.content || '')
            .then(res => res.json())
            .then(setData);
        }, []);
        return <div key={section.id} style={section.styling}>{JSON.stringify(data)}</div>;
      case 'calendar':
        return <div key={section.id} style={section.styling}>Calendar Widget</div>;
      case 'page':
        return (
          <a key={section.id} href={`/${username}/${section.pagePath}`} onClick={(e) => {
            e.preventDefault();
            router.push(`/${username}/${section.pagePath}`);
          }} style={section.styling}>
            Go to {section.pagePath}
          </a>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {hasBanner ? (
        <div className="absolute inset-0 z-0 flex justify-center">
          <div className="w-full max-w-4xl">
            <LazyLoadImage src={profileBanner} alt="" className="w-full h-48 object-cover" />
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
        <LazyLoadImage
          className="absolute inset-0 z-0 object-cover w-full h-full"
          src={pageBackground}
        />
      ) : (
        <div className="absolute inset-0 z-0" style={{ background: getThemeBackground(theme) }} />
      )}

      <div className="absolute inset-0 bg-black/40 z-10"></div>

      <div className="relative z-20 flex justify-center p-4 pt-16 min-h-screen">
        <div className="w-full max-w-md space-y-4">
          {layoutStructure.map(renderSection)}

          <div className="text-center text-gray-500 text-xs pt-4 border-t border-white/10 mt-4">
            <p className="mb-1">Powered by The BioLink</p>
            <a href="/" className="text-indigo-300 hover:text-indigo-200 hover:underline">Create your own</a>
          </div>
        </div>
      </div>
    </div>
  );
}
