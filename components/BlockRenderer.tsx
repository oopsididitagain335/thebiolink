// components/BlockRenderer.tsx
import React from 'react';

interface Badge {
  id: string;
  name: string;
  icon: string;
  hidden?: boolean;
}

interface Link {
  id: string;
  title: string;
  url: string;
}

interface Widget {
  id: string;
  type: 'spotify' | 'youtube' | 'twitter' | 'custom' | 'form' | 'ecommerce' | 'api' | 'calendar';
  url?: string;
  title?: string;
  content?: string;
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

interface Section {
  id: string;
  type: 'name' | 'bio' | 'badges' | 'links' | 'widget' | 'text' | 'spacer';
  styling?: Styling;
  content?: string;
  height?: number;
  visibleLinks?: string[];
  widgetId?: string;
}

interface User {
  name?: string;
  username?: string;
  bio?: string;
  badges?: Badge[];
}

interface Props {
  section: Section;
  user: User;
  links: Link[];
  widgets: Widget[];
}

export default function BlockRenderer({ section, user, links, widgets }: Props) {
  const style = section.styling || {};

  const baseStyle: React.CSSProperties = {
    backgroundColor: style.backgroundColor || 'transparent',
    color: style.color || 'inherit',
    padding: style.padding || '12px',
    margin: style.margin || '8px 0',
    borderRadius: style.borderRadius || '8px',
    border: style.border || 'none',
    fontSize: style.fontSize || '1rem',
    textAlign: style.textAlign || 'left',
    width: '100%',
    boxSizing: 'border-box',
  };

  switch (section.type) {
    case 'name':
      return (
        <div style={baseStyle} className="block">
          <h1 className="font-bold text-2xl">
            {user.name || user.username || (
              <span className="text-gray-400 italic">Your Name</span>
            )}
          </h1>
        </div>
      );

    case 'bio':
      return (
        <div style={baseStyle} className="block">
          <p className={user.bio ? '' : 'text-gray-400 italic'}>
            {user.bio || 'Add a short bio...'}
          </p>
        </div>
      );

    case 'badges':
      const visibleBadges = (user.badges || []).filter(b => !b.hidden);
      if (visibleBadges.length === 0) {
        return (
          <div style={baseStyle} className="block text-gray-400 italic">
            No visible badges
          </div>
        );
      }
      return (
        <div style={baseStyle} className="block flex flex-wrap gap-2">
          {visibleBadges.map((badge) => (
            <span key={badge.id} className="inline-flex items-center gap-1 bg-gray-800 px-2 py-1 rounded">
              <img src={badge.icon} alt={badge.name} className="w-4 h-4 rounded-full" />
              <span>{badge.name}</span>
            </span>
          ))}
        </div>
      );

    case 'links': {
      const visibleLinks = section.visibleLinks?.length
        ? links.filter(l => section.visibleLinks!.includes(l.id))
        : links;

      if (visibleLinks.length === 0) {
        return (
          <div style={baseStyle} className="block text-center text-gray-400 italic">
            No links added
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
              className="block w-full my-2 py-3 px-4 rounded bg-gray-800 hover:bg-gray-700 transition text-center"
            >
              {link.title || 'Untitled Link'}
            </a>
          ))}
        </div>
      );
    }

    case 'widget': {
      const widget = widgets.find(w => w.id === section.widgetId);
      if (!widget) {
        return (
          <div style={baseStyle} className="block text-gray-400 italic">
            Widget not found
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
                className="w-full h-64 rounded-lg"
                allowFullScreen
                title="YouTube video"
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
              height="380"
              className="w-full rounded-lg"
              title="Spotify"
            />
          </div>
        );
      }

      return (
        <div style={baseStyle} className="block p-4 bg-gray-800 rounded">
          <h3 className="font-semibold">{widget.title || `Widget: ${widget.type}`}</h3>
          {widget.content && <p className="mt-2">{widget.content}</p>}
        </div>
      );
    }

    case 'text':
      return (
        <div
          style={baseStyle}
          className="block prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{
            __html: section.content || '<p class="text-gray-400 italic">Add your custom text...</p>',
          }}
        />
      );

    case 'spacer':
      return <div style={{ height: section.height || 20 }} />;

    default:
      return null;
  }
}
