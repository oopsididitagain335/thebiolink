'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Head from 'next/head';
import Avatar from '@/components/Avatar';
import TypingBio from '@/components/TypingBio';
import WhackTheBanHammerGame from './WhackTheBanHammerGame';

// -------------------
// Type Definitions
// -------------------
interface LayoutSection {
  id: string;
  type: string;
  height?: number;
  widgetId?: string;
  content?: string;
  styling?: React.CSSProperties;
}

interface LinkData {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

interface WidgetData {
  id: string;
  title?: string;
  type: string;
  url?: string;
  content?: string;
}

interface BadgeData {
  id: string;
  name: string;
  icon?: string;
  hidden?: boolean;
  awardedAt?: string;
  earnedAt?: string;
}

interface UserData {
  name?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  pageBackground?: string;
  badges?: BadgeData[];
  links?: LinkData[];
  widgets?: WidgetData[];
  layoutStructure?: LayoutSection[];
  profileViews?: number;
  theme?: string;
  isBanned?: boolean;
}

// -------------------
// Utility Functions
// -------------------
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

// -------------------
// Render Block Function
// -------------------
const renderBlock = (
  section: LayoutSection,
  links: LinkData[],
  widgets: WidgetData[],
  theme: string
) => {
  const style: React.CSSProperties = section.styling || {};
  const baseClasses = 'mb-3 transition-all';

  switch (section.type) {
    case 'bio':
      return null;

    case 'links':
      if (links.length === 0) return null;
      return (
        <div key={section.id} className={baseClasses} style={style}>
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
              ) : link.title}
            </a>
          ))}
        </div>
      );

    case 'widget': {
      const widget = widgets.find((w) => w.id === section.widgetId);
      if (!widget)
        return <div key={section.id} className={baseClasses} style={style}>Widget not found</div>;

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
            <a href={widget.url} target="_blank" rel="noopener noreferrer" className="block text-blue-300 hover:underline text-center mt-2">
              View on Twitter
            </a>
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
            <button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-white py-3 rounded font-medium">
              💰 Buy Now
            </button>
          )}

          {widget.type === 'calendar' && (
            <div className="bg-gray-800/50 p-3 rounded text-center text-gray-300">📅 Calendar integration coming soon</div>
          )}

          {widget.type === 'api' && (
            <div className="text-gray-300 text-sm">🔌 Dynamic content loaded from API</div>
          )}

          {widget.type === 'custom' && widget.content && (
            <div dangerouslySetInnerHTML={{ __html: widget.content }} />
          )}
        </div>
      );
    }

    case 'spacer':
      return <div key={section.id} style={{ height: `${section.height}px`, ...style }}></div>;

    case 'form':
      return (
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

    case 'ecommerce':
      return (
        <div key={section.id} className={`bg-white/10 backdrop-blur-md rounded-xl p-4 text-center ${baseClasses}`} style={style}>
          <h3 className="text-lg font-semibold text-white mb-2">Support Me</h3>
          <button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-white py-3 rounded font-medium">
            💰 Buy Now
          </button>
        </div>
      );

    case 'calendar':
      return (
        <div key={section.id} className={`bg-white/10 backdrop-blur-md rounded-xl p-4 text-center ${baseClasses}`} style={style}>
          <h3 className="text-lg font-semibold text-white mb-2">My Calendar</h3>
          <div className="bg-gray-800/50 p-3 rounded text-gray-300">📅 Calendar view</div>
        </div>
      );

    case 'api':
      return (
        <div key={section.id} className={`bg-white/10 backdrop-blur-md rounded-xl p-4 ${baseClasses}`} style={style}>
          <h3 className="text-lg font-semibold text-white mb-2">Live Data</h3>
          <div className="text-gray-300 text-sm">🔌 Loading dynamic content...</div>
        </div>
      );

    case 'custom':
      return (
        <div key={section.id} className={`bg-white/10 backdrop-blur-md rounded-xl p-4 ${baseClasses}`} style={style}>
          {section.content && <div dangerouslySetInnerHTML={{ __html: section.content }} />}
        </div>
      );

    default:
      return <div key={section.id} className={baseClasses} style={style}>{section.type}</div>;
  }
};

// -------------------
// User Page Component
// -------------------
export default function UserPage() {
  const pathname = usePathname();
  const username = pathname.split('/').filter(Boolean)[0];
  const [hasClicked, setHasClicked] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // --- Loading / Error / Banned handlers omitted for brevity ---
  // Keep your existing ones unchanged; they don't affect typing.

  // ...

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
  } = userData || {};

  // --- Rest of your code stays the same ---
  // Replace only the map section like this:

  return (
    <>
      {/* ... Head + other markup above ... */}

      <div className="relative z-20 flex justify-center p-4 min-h-screen">
        <div className="w-full max-w-md space-y-4">
          {/* ... Profile header content ... */}
          {layoutStructure.map((section: LayoutSection) =>
            renderBlock(section, links, widgets, theme)
          )}
        </div>
      </div>
    </>
  );
}
