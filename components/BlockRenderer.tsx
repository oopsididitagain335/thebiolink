import React from 'react';

// Define interfaces for the data structures
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
  url?: string; // Made optional to match WidgetItem
  title?: string; // Added to align with WidgetItem
  content?: string; // Added to align with WidgetItem
  position?: number; // Added to align with WidgetItem
}

interface Styling {
  backgroundColor?: string;
  color?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  border?: string;
  fontSize?: string;
  textAlign?: string;
}

interface Section {
  type: string;
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
    padding: style.padding || '0',
    margin: style.margin || '0',
    borderRadius: style.borderRadius || '0',
    border: style.border || 'none',
    fontSize: style.fontSize || 'inherit',
    textAlign: style.textAlign || 'left',
  };

  switch (section.type) {
    case 'name':
      return (
        <div style={baseStyle} className="block">
          <h1 className="font-bold text-2xl">{user.name || user.username}</h1>
        </div>
      );
    case 'bio':
      return (
        <div style={baseStyle} className="block">
          <p>{user.bio}</p>
        </div>
      );
    case 'badges':
      return (
        <div style={baseStyle} className="block">
          {(user.badges || []).filter((badge: Badge) => !badge.hidden).map((badge: Badge) => (
            <span key={badge.id} className="inline-block mr-2">
              <img src={badge.icon} alt={badge.name} className="inline w-5 h-5 rounded-full" />
              {badge.name}
            </span>
          ))}
        </div>
      );
    case 'links':
      const visibleLinks = section.visibleLinks
        ? links.filter((l) => section.visibleLinks.includes(l.id))
        : links;
      return (
        <div style={baseStyle} className="block">
          {visibleLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block my-2 py-2 rounded bg-white/5 hover:bg-white/10 text-center"
            >
              {link.title}
            </a>
          ))}
        </div>
      );
    case 'widget':
      const widget = widgets.find((w) => w.id === section.widgetId);
      if (!widget) return null;
      if (widget.type === 'youtube' && widget.url) {
        const id = widget.url.split('v=')[1]?.split('&')[0] || widget.url.split('/').pop();
        return id ? (
          <div style={baseStyle} className="block">
            <iframe
              src={`https://www.youtube.com/embed/${id}`}
              className="w-full h-64 rounded-lg"
              allowFullScreen
            />
          </div>
        ) : null;
      }
      if (widget.type === 'spotify' && widget.url) {
        const url = widget.url.includes('embed')
          ? widget.url
          : widget.url.replace('open.spotify.com', 'open.spotify.com/embed');
        return (
          <div style={baseStyle} className="block">
            <iframe src={url} className="w-full h-96 rounded-lg" />
          </div>
        );
      }
      // Handle other widget types using title or content if available
      return (
        <div style={baseStyle} className="block">
          {widget.title || widget.content || `Widget: ${widget.type}`}
        </div>
      );
    case 'text':
      return (
        <div style={baseStyle} className="block" dangerouslySetInnerHTML={{ __html: section.content || '' }} />
      );
    case 'spacer':
      return <div style={{ height: section.height || 20 }} />;
    default:
      return null;
  }
}
