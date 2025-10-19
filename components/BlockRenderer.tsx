// components/BlockRenderer.tsx
import React from 'react';

interface Props {
  section: any;
  user: any;
  links: any[];
  widgets: any[];
}

export default function BlockRenderer({ section, user, links, widgets }: Props) {
  const style = section.styling || {};

  const baseStyle = {
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
          {(user.badges || []).filter(b => !b.hidden).map(badge => (
            <span key={badge.id} className="inline-block mr-2">
              <img src={badge.icon} alt={badge.name} className="inline w-5 h-5 rounded-full" />
              {badge.name}
            </span>
          ))}
        </div>
      );
    case 'links':
      const visibleLinks = section.visibleLinks
        ? links.filter(l => section.visibleLinks.includes(l.id))
        : links;
      return (
        <div style={baseStyle} className="block">
          {visibleLinks.map(link => (
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
      const widget = widgets.find(w => w.id === section.widgetId);
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
      return <div style={baseStyle} className="block">Widget: {widget.type}</div>;
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
