// app/dashboard/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
interface Link {
  id: string;
  url: string;
  title: string;
  icon: string;
  position: number;
}
interface Widget {
  id: string;
  type: 'spotify' | 'youtube' | 'twitter' | 'custom';
  title?: string;
  content?: string;
  url?: string;
  position: number;
}
interface User {
  _id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  background: string;
  isEmailVerified: boolean;
  plan?: string;
}
interface LayoutSection {
  id: string;
  type: 'bio' | 'links' | 'widget' | 'spacer' | 'custom';
  widgetId?: string;
  height?: number;
  content?: string;
}
const FAMOUS_LINKS = [
  { title: 'Instagram', icon: 'https://cdn-icons-png.flaticon.com/512/174/174855.png' },
  { title: 'YouTube', icon: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png' },
  { title: 'Twitch', icon: 'https://cdn-icons-png.flaticon.com/512/657/657252.png' },
  { title: 'Twitter / X', icon: 'https://cdn-icons-png.flaticon.com/512/733/733579.png' },
  { title: 'Discord', icon: 'https://cdn-icons-png.flaticon.com/512/946/946822.png' },
  { title: 'Spotify', icon: 'https://cdn-icons-png.flaticon.com/512/2111/2111624.png' },
  { title: 'SoundCloud', icon: 'https://cdn-icons-png.flaticon.com/512/1384/1384045.png' },
  { title: 'Portfolio', icon: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png' },
  { title: 'Merch', icon: 'https://cdn-icons-png.flaticon.com/512/3003/3003947.png' },
  { title: 'Contact', icon: 'https://cdn-icons-png.flaticon.com/512/724/724933.png' },
];
const WIDGET_TYPES = [
  { id: 'youtube', name: 'YouTube Video', icon: '📺' },
  { id: 'spotify', name: 'Spotify Embed', icon: '🎵' },
  { id: 'twitter', name: 'Twitter Feed', icon: '🐦' },
  { id: 'custom', name: 'Custom HTML', icon: '</>' },
];
const isValidUsername = (username: string): boolean => {
  return /^[a-zA-Z0-9_-]{3,30}$/.test(username);
};
const getBioLinkUrl = (username: string): string => {
  if (!isValidUsername(username)) return 'https://thebiolink.lol/';
  return `https://thebiolink.lol/${encodeURIComponent(username)}`;
};
const DraggableItem = ({ 
  children,
  index,
  onMove,
  itemType = 'item'
}: { 
  children: React.ReactNode;
  index: number;
  onMove: (from: number, to: number) => void;
  itemType?: string;
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', `${itemType}:${index}`);
    e.currentTarget.classList.add('opacity-60');
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    const [type, fromIndexStr] = data.split(':');
    const fromIndex = parseInt(fromIndexStr, 10);
    if (type === itemType && !isNaN(fromIndex) && fromIndex !== index) {
      onMove(fromIndex, index);
    }
  };
  return (
    <div 
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="mb-3"
    >
      {children}
    </div>
  );
};
const OverviewTab = ({ user, links }: { user: User; links: Link[] }) => {
  const bioLinkUrl = getBioLinkUrl(user.username);
  const completion = Math.round(
    ([user.name, user.username, user.avatar || user.bio, user.background].filter(Boolean).length / 4) * 100
  );
  const planDisplay = user.plan 
    ? user.plan.charAt(0).toUpperCase() + user.plan.slice(1)
    : 'Free';
  return (
    <div className="space-y-6">
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Profile Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-gray-300 text-sm font-medium mb-1">Your BioLink</h3>
            <a
              href={bioLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-indigo-400 hover:underline break-all"
            >
              {bioLinkUrl}
            </a>
          </div>
          <div>
            <h3 className="text-gray-300 text-sm font-medium mb-1">Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Total Links</span><span className="text-white font-medium">{links.length}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Profile Completion</span><span className="text-white font-medium">{completion}%</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Plan</span><span className="text-purple-400 font-medium">{planDisplay}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
const CustomizeTab = ({ user, setUser }: { user: User; setUser: (user: User) => void }) => {
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'username') {
      const safeValue = value.replace(/[^a-zA-Z0-9_-]/g, '');
      setUser({ ...user, [name]: safeValue });
    } else {
      setUser({ ...user, [name]: value });
    }
  };
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
      <h2 className="text-xl font-semibold mb-6 text-white">Profile Settings</h2>
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
          <input
            type="text"
            name="name"
            value={user.name}
            onChange={handleProfileChange}
            maxLength={100}
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
          <div className="flex">
            <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-600 bg-gray-700/50 text-gray-400">
              thebiolink.lol/
            </span>
            <input
              type="text"
              name="username"
              value={user.username}
              onChange={handleProfileChange}
              maxLength={30}
              className="flex-1 min-w-0 px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-r-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="yourname"
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Letters, numbers, underscores, hyphens only (3–30 chars)
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Avatar URL</label>
          <input
            type="url"
            name="avatar"
            value={user.avatar}
            onChange={handleProfileChange}
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="https://example.com/avatar.jpg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Background GIF/Video URL</label>
          <input
            type="url"
            name="background"
            value={user.background}
            onChange={handleProfileChange}
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="https://example.com/background.gif"
          />
          <p className="mt-2 text-xs text-gray-500">
            Supports .gif, .mp4, .webm
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
          <textarea
            name="bio"
            value={user.bio}
            onChange={handleProfileChange}
            maxLength={500}
            rows={3}
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Tell people about yourself"
          />
        </div>
      </div>
    </div>
  );
};
const LinksTab = ({ links, setLinks }: { links: Link[]; setLinks: (links: Link[]) => void }) => {
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const moveLink = (fromIndex: number, toIndex: number) => {
    const newLinks = [...links];
    const [movedItem] = newLinks.splice(fromIndex, 1);
    newLinks.splice(toIndex, 0, movedItem);
    setLinks(newLinks.map((link, i) => ({ ...link, position: i })));
  };
  const handleLinkChange = (index: number, field: keyof Link, value: string) => {
    setLinks(links.map((link, i) => 
      i === index 
        ? { ...link, [field]: field === 'url' && value && !/^https?:\/\//i.test(value) ? 'https://' + value : value } 
        : link
    ));
  };
  const addLink = () => {
    const preset = FAMOUS_LINKS.find(l => l.title === newLinkTitle);
    setLinks([
      ...links,
      {
        id: Date.now().toString(),
        url: '',
        title: newLinkTitle || 'New Link',
        icon: preset?.icon || '',
        position: links.length,
      }
    ]);
    setNewLinkTitle('');
  };
  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index).map((link, i) => ({ ...link, position: i })));
  };
  return (
    <div className="space-y-6">
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h2 className="text-xl font-semibold text-white">Link Manager</h2>
          <div className="flex flex-wrap gap-2">
            <select
              value={newLinkTitle}
              onChange={(e) => setNewLinkTitle(e.target.value)}
              className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">Custom Link</option>
              {FAMOUS_LINKS.map((link, i) => (
                <option key={i} value={link.title}>{link.title}</option>
              ))}
            </select>
            <button
              onClick={addLink}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              + Add Link
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {links.map((link, index) => (
            <DraggableItem key={link.id} index={index} onMove={moveLink} itemType="link">
              <div className="border border-gray-700 rounded-xl p-4 bg-gray-700/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                    <input
                      type="text"
                      value={link.title}
                      onChange={(e) => handleLinkChange(index, 'title', e.target.value)}
                      maxLength={100}
                      className="w-full px-3 py-2 bg-gray-600/50 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">URL</label>
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600/50 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <input
                    type="text"
                    value={link.icon}
                    onChange={(e) => handleLinkChange(index, 'icon', e.target.value)}
                    className="px-3 py-2 bg-gray-600/50 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 flex-1 mr-3"
                    placeholder="Icon URL (optional)"
                  />
                  <button
                    onClick={() => removeLink(index)}
                    className="text-red-400 hover:text-red-300 font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </DraggableItem>
          ))}
          {links.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No links added yet</p>
            </div>
          )}
        </div>
      </div>
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4 text-white">Connect Services</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600">
            <div className="flex items-center">
              <img 
                src="https://cdn-icons-png.flaticon.com/512/946/946822.png" 
                alt="Discord" 
                className="w-8 h-8 mr-3"
              />
              <span className="text-white font-medium">Discord</span>
            </div>
            <p className="text-gray-400 text-sm mt-2">Coming Soon</p>
          </div>
        </div>
      </div>
    </div>
  );
};
const WidgetsTab = ({ widgets, setWidgets }: { widgets: Widget[]; setWidgets: (widgets: Widget[]) => void }) => {
  const addWidget = (type: Widget['type']) => {
    setWidgets([
      ...widgets,
      {
        id: Date.now().toString(),
        type,
        title: type === 'spotify' ? 'My Playlist' : type === 'youtube' ? 'Featured Video' : '',
        content: '',
        url: '',
        position: widgets.length,
      }
    ]);
  };
  const updateWidget = (index: number, field: keyof Widget, value: string) => {
    setWidgets(widgets.map((w, i) => i === index ? { ...w, [field]: value } : w));
  };
  const removeWidget = (index: number) => {
    setWidgets(widgets.filter((_, i) => i !== index).map((w, i) => ({ ...w, position: i })));
  };
  const moveWidget = (from: number, to: number) => {
    const newWidgets = [...widgets];
    const [item] = newWidgets.splice(from, 1);
    newWidgets.splice(to, 0, item);
    setWidgets(newWidgets.map((w, i) => ({ ...w, position: i })));
  };
  return (
    <div className="space-y-6">
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Custom Widgets</h2>
        <p className="text-gray-400 mb-4">Add embeds, media, or custom HTML to your BioLink.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {WIDGET_TYPES.map((w) => (
            <button
              key={w.id}
              onClick={() => addWidget(w.id as Widget['type'])}
              className="bg-gray-700/50 hover:bg-gray-700 p-3 rounded-lg text-center text-white"
            >
              <div className="text-2xl mb-1">{w.icon}</div>
              <div className="text-xs">{w.name}</div>
            </button>
          ))}
        </div>
        <div className="space-y-4">
          {widgets.map((widget, index) => (
            <DraggableItem key={widget.id} index={index} onMove={moveWidget} itemType="widget">
              <div className="border border-gray-700 rounded-xl p-4 bg-gray-700/30">
                <div className="font-medium text-white mb-2 capitalize">{widget.type} Widget</div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Widget Title"
                    value={widget.title || ''}
                    onChange={(e) => updateWidget(index, 'title', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-600/50 border border-gray-600 rounded-lg text-white text-sm"
                  />
                  <input
                    type="url"
                    placeholder="Embed URL (YouTube, Spotify, etc.)"
                    value={widget.url || ''}
                    onChange={(e) => updateWidget(index, 'url', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-600/50 border border-gray-600 rounded-lg text-white text-sm"
                  />
                  {widget.type === 'custom' && (
                    <textarea
                      placeholder="Paste HTML or embed code"
                      value={widget.content || ''}
                      onChange={(e) => updateWidget(index, 'content', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-600/50 border border-gray-600 rounded-lg text-white text-sm font-mono"
                    />
                  )}
                </div>
                <button
                  onClick={() => removeWidget(index)}
                  className="mt-3 text-red-400 text-sm"
                >
                  Remove Widget
                </button>
              </div>
            </DraggableItem>
          ))}
          {widgets.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              No widgets added. Choose one above to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
const ProfileBuilderTab = ({ 
  user, 
  setUser, 
  links, 
  setLinks, 
  widgets, 
  setWidgets,
  layoutStructure,
  setLayoutStructure
}: { 
  user: User; 
  setUser: (user: User) => void;
  links: Link[];
  setLinks: (links: Link[]) => void;
  widgets: Widget[];
  setWidgets: (widgets: Widget[]) => void;
  layoutStructure: LayoutSection[];
  setLayoutStructure: (sections: LayoutSection[]) => void;
}) => {
  const addSection = (type: LayoutSection['type'], options: Partial<LayoutSection> = {}) => {
    const newSection: LayoutSection = {
      id: `${type}-${Date.now()}`,
      type,
      ...options
    };
    setLayoutStructure([...layoutStructure, newSection]);
  };
  const updateSection = (id: string, updates: Partial<LayoutSection>) => {
    setLayoutStructure(layoutStructure.map(s => 
      s.id === id ? { ...s, ...updates } : s
    ));
  };
  const removeSection = (id: string) => {
    setLayoutStructure(layoutStructure.filter(s => s.id !== id));
  };
  const moveSection = (fromIndex: number, toIndex: number) => {
    const newSections = [...layoutStructure];
    const [movedItem] = newSections.splice(fromIndex, 1);
    newSections.splice(toIndex, 0, movedItem);
    setLayoutStructure(newSections);
  };
  const renderSectionEditor = (section: LayoutSection, index: number) => {
    if (section.type === 'spacer') {
      return (
        <div className="p-3 bg-gray-700/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white text-sm">Spacer</span>
            <button 
              onClick={() => removeSection(section.id)}
              className="text-red-400 hover:text-red-300 text-xs"
            >
              Remove
            </button>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={section.height || 20}
            onChange={(e) => updateSection(section.id, { height: parseInt(e.target.value) })}
            className="w-full"
          />
          <div className="text-xs text-gray-400 mt-1">{section.height || 20}px</div>
        </div>
      );
    }
    if (section.type === 'custom') {
      return (
        <div className="p-3 bg-gray-700/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white text-sm">Custom HTML</span>
            <button 
              onClick={() => removeSection(section.id)}
              className="text-red-400 hover:text-red-300 text-xs"
            >
              Remove
            </button>
          </div>
          <textarea
            value={section.content || ''}
            onChange={(e) => updateSection(section.id, { content: e.target.value })}
            placeholder="Enter custom HTML"
            className="w-full px-2 py-1 bg-gray-600/50 border border-gray-600 rounded text-white text-sm"
            rows={3}
          />
        </div>
      );
    }
    if (section.type === 'widget') {
      const widget = widgets.find(w => w.id === section.widgetId);
      return (
        <div className="p-3 bg-gray-700/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white text-sm">
              Widget: {widget?.title || 'Unknown'}
            </span>
            <button 
              onClick={() => removeSection(section.id)}
              className="text-red-400 hover:text-red-300 text-xs"
            >
              Remove
            </button>
          </div>
          <select
            value={section.widgetId || ''}
            onChange={(e) => updateSection(section.id, { widgetId: e.target.value })}
            className="w-full bg-gray-600/50 border border-gray-600 rounded text-white text-sm p-1"
          >
            <option value="">Select Widget</option>
            {widgets.map(w => (
              <option key={w.id} value={w.id}>
                {w.title || w.type}
              </option>
            ))}
          </select>
        </div>
      );
    }
    return (
      <div className="p-3 bg-gray-700/50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-white capitalize text-sm">{section.type}</span>
          <button 
            onClick={() => removeSection(section.id)}
            className="text-red-400 hover:text-red-300 text-xs"
          >
            Remove
          </button>
        </div>
      </div>
    );
  };
  return (
    <div className="space-y-6">
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Profile Builder</h2>
        <p className="text-gray-400 mb-4">Drag to reorder. Click + to add sections.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          <button
            onClick={() => addSection('bio')}
            className="p-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white text-sm"
          >
            📝 Bio
          </button>
          <button
            onClick={() => addSection('links')}
            className="p-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white text-sm"
          >
            🔗 Links
          </button>
          <button
            onClick={() => addSection('spacer', { height: 20 })}
            className="p-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm"
          >
            ⬇️ Spacer
          </button>
          <button
            onClick={() => addSection('custom', { content: '' })}
            className="p-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm"
          >
            ✏️ Custom
          </button>
        </div>
        {widgets.length > 0 && (
          <div className="mb-6">
            <h3 className="text-gray-300 text-sm font-medium mb-2">Add Widgets</h3>
            <div className="flex flex-wrap gap-2">
              {widgets.map(widget => (
                <button
                  key={widget.id}
                  onClick={() => addSection('widget', { widgetId: widget.id })}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg"
                >
                  + {widget.title || widget.type}
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <h3 className="text-gray-300 text-sm font-medium mb-3">Your Layout</h3>
          <div className="space-y-3">
            {layoutStructure.map((section, index) => (
              <DraggableItem 
                key={section.id} 
                index={index} 
                onMove={moveSection} 
                itemType="section"
              >
                {renderSectionEditor(section, index)}
              </DraggableItem>
            ))}
            {layoutStructure.length === 0 && (
              <div className="text-gray-500 text-sm py-4 text-center border-2 border-dashed border-gray-700 rounded-lg">
                Click + buttons above to add sections
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4 text-white">Live Preview</h3>
        <div className="bg-gray-900/50 rounded-xl p-6 text-center relative overflow-hidden min-h-[500px]">
          {user.background && (
            <div
              className="absolute inset-0 z-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${user.background})` }}
            />
          )}
          <div className="absolute inset-0 bg-black/70 z-10"></div>
          <div className="relative z-20 space-y-4">
            {layoutStructure.map((section) => {
              if (section.type === 'bio') {
                return (
                  <div key={section.id} className="text-center">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-white/30"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl text-white font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-white mb-2">{user.name}</h3>
                    {user.bio && <p className="text-gray-300 max-w-xs mx-auto">{user.bio}</p>}
                  </div>
                );
              }
              if (section.type === 'links' && links.length > 0) {
                return (
                  <div key={section.id} className="space-y-3">
                    {links
                      .filter(link => link.url && link.title)
                      .map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg text-sm transition-colors"
                        >
                          {link.title}
                        </a>
                      ))}
                  </div>
                );
              }
              if (section.type === 'widget') {
                const widget = widgets.find(w => w.id === section.widgetId);
                if (!widget) return null;
                return (
                  <div key={section.id} className="bg-white/10 rounded-lg p-4 text-left">
                    {widget.title && <h4 className="text-white font-medium mb-2">{widget.title}</h4>}
                    {widget.type === 'youtube' && widget.url ? (
                      <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                        <iframe
                          src={`https://www.youtube.com/embed/${getYouTubeId(widget.url)}`}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        ></iframe>
                      </div>
                    ) : widget.type === 'spotify' && widget.url ? (
                      <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                        <iframe
                          src={`https://open.spotify.com/embed/${getSpotifyId(widget.url)}`}
                          frameBorder="0"
                          allowTransparency={true}
                          allow="encrypted-media"
                          className="w-full h-full"
                        ></iframe>
                      </div>
                    ) : widget.type === 'twitter' && widget.url ? (
                      <div className="bg-gray-800 rounded-lg p-4">
                        <a href={widget.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                          🐦 View Twitter Feed
                        </a>
                      </div>
                    ) : widget.type === 'custom' && widget.content ? (
                      <div
                        className="text-gray-300 text-sm"
                        dangerouslySetInnerHTML={{ __html: widget.content }}
                      />
                    ) : (
                      <div className="text-gray-400 text-sm italic">
                        {widget.type === 'spotify' && '🎵 Spotify embed'}
                        {widget.type === 'youtube' && '📺 YouTube video'}
                        {widget.type === 'twitter' && '🐦 Twitter feed'}
                        {!widget.type && 'Widget content'}
                      </div>
                    )}
                  </div>
                );
              }
              if (section.type === 'spacer') {
                return <div key={section.id} style={{ height: `${section.height}px` }}></div>;
              }
              if (section.type === 'custom' && section.content) {
                return (
                  <div 
                    key={section.id} 
                    className="bg-white/5 p-4 rounded-lg"
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
const ComingSoonTab = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-96">
    <div className="text-center">
      <div className="text-6xl mb-4">🚧</div>
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-gray-400">This feature is under development.</p>
    </div>
  </div>
);
const getYouTubeId = (url: string): string => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.*?v=))([^&?# ]{11})/);
  return match ? match[1] : '';
};
const getSpotifyId = (url: string): string => {
  const match = url.match(/spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/);
  return match ? `${match[1]}/${match[2]}` : '';
};
export default function Dashboard() {
  const [user, setUser] = useState<User>({
    _id: '',
    name: '',
    username: '',
    avatar: '',
    bio: '',
    background: '',
    isEmailVerified: true,
    plan: 'free',
  });
  const [links, setLinks] = useState<Link[]>([]);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [layoutStructure, setLayoutStructure] = useState<LayoutSection[]>([
    { id: 'bio', type: 'bio' },
    { id: 'spacer-1', type: 'spacer', height: 20 },
    { id: 'links', type: 'links' }
  ]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/dashboard/data');
        if (!res.ok) {
          router.push('/auth/login');
          return;
        }
        const data = await res.json();
        const rawUsername = data.user.username || '';
        const safeUsername = isValidUsername(rawUsername) ? rawUsername : '';
        setUser({
          _id: data.user._id || '',
          name: (data.user.name || '').substring(0, 100),
          username: safeUsername,
          avatar: (data.user.avatar || '').trim(),
          bio: (data.user.bio || '').substring(0, 500),
          background: (data.user.background || '').trim(),
          isEmailVerified: data.user.isEmailVerified ?? true,
          plan: data.user.plan || 'free', // ✅ FIXED: use real plan from API
        });
        const fetchedLinks = Array.isArray(data.links) ? data.links : [];
        const sortedLinks = [...fetchedLinks].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        setLinks(
          sortedLinks.length > 0
            ? sortedLinks.map((link: any) => ({
                id: link.id || Date.now().toString(),
                url: (link.url || '').trim(),
                title: (link.title || '').substring(0, 100),
                icon: (link.icon || '').trim(),
                position: link.position ?? 0,
              }))
            : []
        );
        const fetchedWidgets = Array.isArray(data.widgets) ? data.widgets : [];
        const sortedWidgets = [...fetchedWidgets].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        setWidgets(
          sortedWidgets.map((w: any) => ({
            id: w.id || Date.now().toString(),
            type: w.type || 'custom',
            title: w.title || '',
            content: w.content || '',
            url: w.url || '',
            position: w.position ?? 0,
          }))
        );
        setLayoutStructure(data.layoutStructure || [
          { id: 'bio', type: 'bio' },
          { id: 'spacer-1', type: 'spacer', height: 20 },
          { id: 'links', type: 'links' }
        ]);
      } catch (error) {
        console.error('Fetch error:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [router]);
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      router.push('/auth/login');
    }
  };
  const handleSave = () => {
    setShowGuidelinesModal(true);
  };
  const confirmSave = async () => {
    setShowGuidelinesModal(false);
    setIsSaving(true);
    setMessage(null);
    if (!isValidUsername(user.username)) {
      setMessage({ type: 'error', text: 'Username must be 3–30 characters (letters, numbers, _, -).' });
      setIsSaving(false);
      return;
    }
    try {
      const linksToSend = links
        .filter((link) => link.url.trim() && link.title.trim())
        .map((link, index) => ({
          id: link.id,
          url: link.url.trim(),
          title: link.title.trim().substring(0, 100),
          icon: link.icon?.trim() || '',
          position: index,
        }));
      const widgetsToSend = widgets.map((w, i) => ({
        id: w.id,
        type: w.type,
        title: w.title?.trim() || '',
        content: w.content?.trim() || '',
        url: w.url?.trim() || '',
        position: i,
      }));
      const response = await fetch('/api/dashboard/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: {
            name: user.name.trim().substring(0, 100),
            username: user.username.trim().toLowerCase(),
            avatar: user.avatar?.trim() || '',
            bio: user.bio?.trim().substring(0, 500) || '',
            background: user.background?.trim() || '',
            layoutStructure,
          },
          links: linksToSend,
          widgets: widgetsToSend,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: 'Changes saved successfully!' });
      } else {
        const errorMessage = data.error || 'Failed to save changes.';
        setMessage({ type: 'error', text: errorMessage });
      }
    } catch (error: any) {
      console.error('Save error:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };
  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'customize', name: 'Customize' },
    { id: 'builder', name: 'Profile Builder' },
    { id: 'links', name: 'Links' },
    { id: 'widgets', name: 'Widgets' },
    { id: 'badges', name: 'Badges' },
    { id: 'manage', name: 'Manage' },
    { id: 'settings', name: 'Settings' },
  ];
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Your BioLink Dashboard</h1>
              <p className="text-gray-400 mt-2">
                Customize your bio link page at{' '}
                <a
                  href={getBioLinkUrl(user.username)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-indigo-400 hover:text-indigo-300 hover:underline"
                >
                  thebiolink.lol/{user.username}
                </a>
              </p>
            </div>
            <div className="flex gap-3 mt-4 sm:mt-0">
              <button
                onClick={handleLogout}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-xl font-medium transition-colors border border-gray-700"
              >
                Logout
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-70"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
        <div className="border-b border-gray-700 mb-8 overflow-x-auto">
          <nav className="flex space-x-6 pb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {activeTab === 'overview' && <OverviewTab user={user} links={links} />}
            {activeTab === 'customize' && <CustomizeTab user={user} setUser={setUser} />}
            {activeTab === 'builder' && (
              <ProfileBuilderTab 
                user={user} 
                setUser={setUser} 
                links={links} 
                setLinks={setLinks} 
                widgets={widgets} 
                setWidgets={setWidgets}
                layoutStructure={layoutStructure}
                setLayoutStructure={setLayoutStructure}
              />
            )}
            {activeTab === 'links' && <LinksTab links={links} setLinks={setLinks} />}
            {activeTab === 'widgets' && <WidgetsTab widgets={widgets} setWidgets={setWidgets} />}
            {['badges', 'manage', 'settings'].includes(activeTab) && (
              <ComingSoonTab title={`${tabs.find(t => t.id === activeTab)?.name} Tab`} />
            )}
          </div>
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-4 text-white">Live Preview</h2>
              <div className="bg-gray-900/50 rounded-xl p-6 text-center relative overflow-hidden min-h-[500px]">
                {user.background && (
                  <div
                    className="absolute inset-0 z-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${user.background})`,
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-black/70 z-10"></div>
                <div className="relative z-20">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-white/30"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl text-white font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-white mb-2">{user.name}</h3>
                  {user.bio && <p className="text-gray-300 mb-4 max-w-xs mx-auto">{user.bio}</p>}
                  <div className="space-y-6">
                    {layoutStructure.map((section) => {
                      if (section.type === 'bio') return null;
                      if (section.type === 'links' && links.length > 0) {
                        return (
                          <div key={section.id} className="space-y-3">
                            {links
                              .filter(link => link.url && link.title)
                              .map((link, idx) => (
                                <a
                                  key={idx}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg text-sm transition-colors"
                                >
                                  {link.title}
                                </a>
                              ))}
                          </div>
                        );
                      }
                      if (section.type === 'widget') {
                        const widget = widgets.find(w => w.id === section.widgetId);
                        if (!widget) return null;
                        return (
                          <div key={section.id} className="bg-white/10 rounded-lg p-4 text-left">
                            {widget.title && <h4 className="text-white font-medium mb-2">{widget.title}</h4>}
                            <div className="text-gray-400 text-sm italic">
                              {widget.type === 'spotify' && '🎵 Spotify embed'}
                              {widget.type === 'youtube' && '📺 YouTube video'}
                              {widget.type === 'twitter' && '🐦 Twitter feed'}
                              {widget.type === 'custom' && 'Custom content'}
                            </div>
                          </div>
                        );
                      }
                      if (section.type === 'spacer') {
                        return <div key={section.id} style={{ height: `${section.height}px` }}></div>;
                      }
                      if (section.type === 'custom' && section.content) {
                        return (
                          <div 
                            key={section.id} 
                            className="bg-white/5 p-4 rounded-lg"
                            dangerouslySetInnerHTML={{ __html: section.content }}
                          />
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {message && (
          <div
            className={`fixed bottom-6 right-6 p-4 rounded-xl ${
              message.type === 'success'
                ? 'bg-green-900/80 text-green-200 border border-green-800'
                : 'bg-red-900/80 text-red-200 border border-red-800'
            } max-w-sm`}
          >
            {message.text}
          </div>
        )}
        {showGuidelinesModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-white mb-3">Profile Compliance Check</h3>
              <p className="text-gray-300 mb-4">
                Please confirm your profile complies with our{' '}
                <a
                  href="https://www.thebiolink.lol/community-guidelines"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:underline"
                >
                  Community Guidelines
                </a>
                .
              </p>
              <p className="text-yellow-400 text-sm mb-4">
                ⚠️ Violations may result in account suspension.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowGuidelinesModal(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSave}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-70"
                >
                  {isSaving ? 'Saving...' : 'I Comply – Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
