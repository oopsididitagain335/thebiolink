// components/BlockRenderer.tsx
import React from 'react';

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

interface Styling {
  backgroundColor?: string;
  color?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  border?: string;
  fontSize?: string;
  textAlign?: React.CSSProperties['textAlign'];
}

interface LayoutSection {
  id: string;
  type: string;
  widgetId?: string;
  content?: string;
  styling?: Styling;
  visibleLinks?: string[];
}

interface UserData {
  name: string;
  username: string;
  bio: string;
  badges: Badge[];
}

interface Props {
  section: LayoutSection;
  user: UserData;
  links: LinkItem[];
  widgets: WidgetItem[];
}

export default function BlockRenderer({ section, user, links, widgets }: Props) {
  const style = section.styling || {};

  const baseStyle: React.CSSProperties = {
    backgroundColor: style.backgroundColor || 'rgba(31, 41, 55, 0.6)',
    color: style.color || '#f9fafb',
    padding: style.padding || '16px',
    margin: style.margin || '12px 0',
    borderRadius: style.borderRadius || '12px',
    border: style.border || '1px solid rgba(255,255,255,0.1)',
    fontSize: style.fontSize || '1rem',
    textAlign: style.textAlign || 'center',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    width: '100%',
    boxSizing: 'border-box',
  };

  switch (section.type) {
    case 'name':
      return (
        <div style={baseStyle} className="block">
          <h1 className="font-extrabold text-3xl md:text-4xl">
            {user.name || user.username || (
              <span className="text-gray-400 font-normal italic">Your Name</span>
            )}
          </h1>
        </div>
      );

    case 'bio':
      return (
        <div style={baseStyle} className="block">
          <p className={`leading-relaxed ${user.bio ? '' : 'text-gray-400 italic'}`}>
            {user.bio || 'Add a short bio to tell the world who you are.'}
          </p>
        </div>
      );

    case 'badges':
      const visibleBadges = (user.badges || []).filter(b => !b.hidden);
      if (visibleBadges.length === 0) {
        return (
          <div style={baseStyle} className="block text-gray-400 italic">
            No badges to display
          </div>
        );
      }
      return (
        <div style={baseStyle} className="block flex flex-wrap justify-center gap-2">
          {visibleBadges.map((badge) => (
            <span
              key={badge.id}
              className="inline-flex items-center gap-1.5 bg-gray-800/70 px-3 py-1.5 rounded-lg text-sm font-medium"
            >
              <img
                src={badge.icon}
                alt={badge.name}
                className="w-5 h-5 rounded-full"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
              {badge.name}
            </span>
          ))}
        </div>
      );

    case 'links': {
      const visibleLinks = section.visibleLinks?.length
        ? links
            .filter((l) => section.visibleLinks!.includes(l.id))
            .sort((a, b) => a.position - b.position)
        : links.sort((a, b) => a.position - b.position);

      if (visibleLinks.length === 0) {
        return (
          <div style={baseStyle} className="block text-center text-gray-400 italic">
            No links configured
          </div>
        );
      }

      return (
        <div style={baseStyle} className="block">
          {visibleLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full my-2 py-3.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 font-medium"
            >
              {link.title || 'Untitled Link'}
            </a>
          ))}
        </div>
      );
    }

    case 'widget': {
      const widget = widgets.find((w) => w.id === section.widgetId);
      if (!widget) {
        return (
          <div style={baseStyle} className="block text-center text-gray-400 italic">
            Widget not configured
          </div>
        );
      }

      if (widget.type === 'youtube' && widget.url) {
        const match = widget.url.match(
          /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
        );
        const id = match ? match[1] : null;
        if (id) {
          return (
            <div style={baseStyle} className="block">
              <iframe
                src={`https://www.youtube.com/embed/${id}`}
                className="w-full h-60 md:h-72 rounded-xl"
                allowFullScreen
                title="YouTube"
                loading="lazy"
              />
            </div>
          );
        }
      }

      if (widget.type === 'spotify' && widget.url) {
        const embedUrl = widget.url.includes('embed')
          ? widget.url
          : widget.url.replace('open.spotify.com', 'open.spotify.com/embed');
        return (
          <div style={baseStyle} className="block">
            <iframe
              src={embedUrl}
              height="352"
              className="w-full rounded-xl"
              title="Spotify"
              loading="lazy"
            />
          </div>
        );
      }

      return (
        <div style={baseStyle} className="block p-4">
          <h3 className="font-bold text-lg mb-1">
            {widget.title || `Widget: ${widget.type}`}
          </h3>
          {widget.content && <p className="opacity-90">{widget.content}</p>}
        </div>
      );
    }

    case 'text':
      return (
        <div
          style={baseStyle}
          className="block prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{
            __html:
              section.content ||
              '<p class="text-gray-400 italic">Add your custom message, announcement, or HTML content here.</p>',
          }}
        />
      );

    case 'spacer':
      return <div style={{ height: section.height || 24 }} />;

    default:
      return null;
  }
}
