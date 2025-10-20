// app/dashboard/page.tsx
'use client';

import { useState, useEffect, useReducer } from 'react';
import { useRouter } from 'next/navigation';

// --- Interfaces ---
interface Link {
  id: string;
  url: string;
  title: string;
  icon: string;
  position: number;
}

interface Widget {
  id: string;
  type: 'spotify' | 'youtube' | 'twitter' | 'custom' | 'form' | 'ecommerce' | 'api' | 'calendar';
  title?: string;
  content?: string;
  url?: string;
  position: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
  hidden?: boolean;
}

interface User {
  _id: string;
  name: string;
  username: string;
  avatar: string;
  profileBanner: string;
  pageBackground: string;
  bio: string;
  location?: string;
  isEmailVerified: boolean;
  plan?: string;
  profileViews?: number;
  theme?: 'indigo' | 'purple' | 'green' | 'red' | 'halloween';
  badges?: Badge[];
  email?: string;
  discordId?: string;
  xp?: number;
  level?: number;
  loginStreak?: number;
  lastLogin?: string;
  loginHistory?: string[];
  lastMonthlyBadge?: string;
  customCSS?: string;
  customJS?: string;
  seoMeta: { title?: string; description?: string; keywords?: string };
  analyticsCode?: string;
  widgets?: Widget[];
}

interface LayoutSection {
  id: string;
  type: 'name' | 'bio' | 'badges' | 'links' | 'widget' | 'spacer' | 'text';
  widgetId?: string;
  content?: string;
  styling?: { [key: string]: string };
  visibleLinks?: string[];
}

// --- Constants ---
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
  { id: 'youtube', name: 'YouTube Video' },
  { id: 'spotify', name: 'Spotify Embed' },
  { id: 'twitter', name: 'Twitter Feed' },
  { id: 'custom', name: 'Custom HTML' },
  { id: 'form', name: 'Contact Form' },
  { id: 'ecommerce', name: 'Buy Button' },
  { id: 'api', name: 'Dynamic API' },
  { id: 'calendar', name: 'Calendar' },
];

const isValidUsername = (username: string): boolean => /^[a-zA-Z0-9_-]{3,30}$/.test(username);

const getBioLinkUrl = (username: string): string => {
  if (!isValidUsername(username)) return 'https://thebiolink.lol/';
  return `https://thebiolink.lol/${encodeURIComponent(username)}`;
};

const uploadToCloudinary = async (file: File, folder = 'biolink') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Upload failed');
  return await res.json();
};

// --- Reducer for layout history ---
type HistoryAction = { type: 'SAVE'; payload: LayoutSection[] } | { type: 'UNDO' };
const historyReducer = (state: LayoutSection[][], action: HistoryAction): LayoutSection[][] => {
  switch (action.type) {
    case 'SAVE': return [...state, action.payload];
    case 'UNDO': return state.length > 1 ? state.slice(0, -1) : state;
    default: return state;
  }
};

// --- Tab Components ---
const OverviewTab = ({ user, links }: { user: User; links: Link[] }) => {
  const bioLinkUrl = getBioLinkUrl(user.username);
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
              <div className="flex justify-between">
                <span className="text-gray-400">Total Links</span>
                <span className="text-white font-medium">{links.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Profile Views</span>
                <span className="text-white font-medium">{user.profileViews || 0}</span>
              </div>
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof User) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      let folder = 'biolink';
      if (field === 'avatar') folder = 'avatars';
      if (field === 'profileBanner') folder = 'banners';
      if (field === 'pageBackground') folder = 'backgrounds';
      const { url } = await uploadToCloudinary(file, folder);
      setUser({ ...user, [field]: url });
    } catch (err) {
      alert(`Failed to upload ${field}`);
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
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Avatar</label>
          <div className="flex items-center gap-3">
            {user.avatar && <img src={user.avatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover" />}
            <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm">
              Upload Avatar
              <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'avatar')} className="hidden" />
            </label>
          </div>
          <input
            type="url"
            name="avatar"
            value={user.avatar}
            onChange={handleProfileChange}
            className="w-full mt-2 px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Or paste URL"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Page Background</label>
          <div className="flex items-center gap-3">
            {user.pageBackground && (
              <div className="w-16 h-16 bg-cover bg-center rounded border border-gray-600" style={{ backgroundImage: `url(${user.pageBackground})` }} />
            )}
            <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm">
              Upload Background
              <input type="file" accept="image/*,video/*" onChange={(e) => handleFileUpload(e, 'pageBackground')} className="hidden" />
            </label>
          </div>
          <input
            type="url"
            name="pageBackground"
            value={user.pageBackground}
            onChange={handleProfileChange}
            className="w-full mt-2 px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Supports .jpg, .png, .gif, .mp4"
          />
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
  const handleLinkChange = (index: number, field: keyof Link, value: string) => {
    setLinks(
      links.map((link, i) =>
        i === index
          ? {
              ...link,
              [field]: field === 'url' && value && !/^https?:\/\//i.test(value) ? 'https://' + value : value,
            }
          : link
      )
    );
  };

  const addLink = () => {
    const preset = FAMOUS_LINKS.find((l) => l.title === newLinkTitle);
    setLinks([
      ...links,
      {
        id: Date.now().toString(),
        url: '',
        title: newLinkTitle || 'New Link',
        icon: preset?.icon || '',
        position: links.length,
      },
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
                <option key={i} value={link.title}>
                  {link.title}
                </option>
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
            <div key={link.id} className="border border-gray-700 rounded-xl p-4 bg-gray-700/30">
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
                <button onClick={() => removeLink(index)} className="text-red-400 hover:text-red-300 font-medium">
                  Remove
                </button>
              </div>
            </div>
          ))}
          {links.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No links added yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const WidgetsTab = ({ widgets, setWidgets, user }: { widgets: Widget[]; setWidgets: (widgets: Widget[]) => void; user: User }) => {
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
      },
    ]);
  };

  const updateWidget = (index: number, field: keyof Widget, value: string) => {
    setWidgets(widgets.map((w, i) => (i === index ? { ...w, [field]: value } : w)));
  };

  const removeWidget = (index: number) => {
    setWidgets(widgets.filter((_, i) => i !== index).map((w, i) => ({ ...w, position: i })));
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
              disabled={w.id === 'custom' && user.plan !== 'premium'}
              className={`bg-gray-700/50 hover:bg-gray-700 p-3 rounded-lg text-center text-white ${
                w.id === 'custom' && user.plan !== 'premium' ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {w.name}
            </button>
          ))}
        </div>
        <div className="space-y-4">
          {widgets.map((widget, index) => (
            <div key={widget.id} className="border border-gray-700 rounded-xl p-4 bg-gray-700/30">
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
              <button onClick={() => removeWidget(index)} className="mt-3 text-red-400 text-sm">
                Remove Widget
              </button>
            </div>
          ))}
          {widgets.length === 0 && (
            <div className="text-center py-6 text-gray-500">No widgets added. Choose one above to get started.</div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProfileBuilderTab = ({
  layoutStructure,
  setLayoutStructure,
  user,
  links,
}: {
  layoutStructure: LayoutSection[];
  setLayoutStructure: (sections: LayoutSection[]) => void;
  user: User;
  links: Link[];
}) => {
  const addBlock = (type: LayoutSection['type']) => {
    const newBlock: LayoutSection = {
      id: `${type}-${Date.now()}`,
      type,
      ...(type === 'widget' && { widgetId: `widget-${Date.now()}` }),
      ...(type === 'links' && { visibleLinks: links.map((l) => l.id) }),
    };
    setLayoutStructure([...layoutStructure, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<LayoutSection>) => {
    setLayoutStructure(layoutStructure.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const removeBlock = (id: string) => {
    setLayoutStructure(layoutStructure.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Profile Builder</h2>
        <p className="text-gray-400 mb-4">Add and arrange blocks to build your layout.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {(['name', 'bio', 'badges', 'links', 'widget', 'text', 'spacer'] as const).map((type) => (
            <button
              key={type}
              onClick={() => addBlock(type)}
              className="bg-gray-700/50 hover:bg-gray-700 p-3 rounded-lg text-center text-white"
            >
              Add {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
        <div className="space-y-4">
          {layoutStructure.map((section) => (
            <div key={section.id} className="border border-gray-700 rounded-xl p-4 bg-gray-700/30">
              <div className="flex justify-between items-start mb-3">
                <span className="text-white font-medium capitalize">{section.type}</span>
                <button onClick={() => removeBlock(section.id)} className="text-red-400 hover:text-red-300">
                  ✕
                </button>
              </div>
              {section.type === 'links' && (
                <div className="mt-3">
                  <label className="block text-sm text-gray-300 mb-2">Visible Links</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {links.map((link) => (
                      <label key={link.id} className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={section.visibleLinks?.includes(link.id) ?? true}
                          onChange={(e) => {
                            const current = section.visibleLinks || links.map((l) => l.id);
                            const updated = e.target.checked
                              ? [...current, link.id]
                              : current.filter((id) => id !== link.id);
                            updateBlock(section.id, { visibleLinks: updated });
                          }}
                          className="mr-2"
                        />
                        <span>{link.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {section.type === 'text' && (
                <textarea
                  value={section.content || ''}
                  onChange={(e) => updateBlock(section.id, { content: e.target.value })}
                  placeholder="HTML content"
                  rows={2}
                  className="w-full mt-2 px-2 py-1 bg-gray-600/50 border border-gray-600 rounded text-white text-sm font-mono"
                />
              )}
              {section.type === 'spacer' && (
                <input
                  type="number"
                  value={section.styling?.height || 20}
                  onChange={(e) =>
                    updateBlock(section.id, {
                      styling: { ...section.styling, height: e.target.value },
                    })
                  }
                  className="w-20 mt-2 px-2 py-1 bg-gray-600/50 border border-gray-600 rounded text-white text-sm"
                  placeholder="px"
                />
              )}
            </div>
          ))}
          {layoutStructure.length === 0 && (
            <p className="text-gray-500 text-sm italic">No blocks added. Your profile will be empty.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const SEOTab = ({ user, setUser }: { user: User; setUser: (user: User) => void }) => {
  const handleMetaChange = (field: keyof User['seoMeta'], value: string) => {
    setUser({ ...user, seoMeta: { ...user.seoMeta, [field]: value } });
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
      <h2 className="text-xl font-semibold mb-4 text-white">SEO & Meta Tags</h2>
      <div className="space-y-4">
        <input
          type="text"
          value={user.seoMeta?.title || ''}
          onChange={(e) => handleMetaChange('title', e.target.value)}
          placeholder="Custom Title"
          className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white"
        />
        <textarea
          value={user.seoMeta?.description || ''}
          onChange={(e) => handleMetaChange('description', e.target.value)}
          placeholder="Meta Description"
          rows={3}
          className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white"
        />
        <input
          type="text"
          value={user.seoMeta?.keywords || ''}
          onChange={(e) => handleMetaChange('keywords', e.target.value)}
          placeholder="Keywords (comma-separated)"
          className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white"
        />
      </div>
    </div>
  );
};

const AnalyticsIntegrationTab = ({ user, setUser }: { user: User; setUser: (user: User) => void }) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
      <h2 className="text-xl font-semibold mb-4 text-white">Analytics Integration</h2>
      <textarea
        value={user.analyticsCode || ''}
        onChange={(e) => setUser({ ...user, analyticsCode: e.target.value })}
        placeholder="Paste Google Analytics script or similar"
        rows={5}
        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white font-mono"
      />
    </div>
  );
};

const CustomCodeTab = ({ user, setUser }: { user: User; setUser: (user: User) => void }) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
      <h2 className="text-xl font-semibold mb-4 text-white">Custom Code</h2>
      {user.plan !== 'premium' ? (
        <div className="text-gray-400">
          <p>Custom CSS and JavaScript are available for premium users only.</p>
          <a href="/upgrade" className="text-indigo-400 hover:underline">Upgrade to Premium</a>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Custom CSS</label>
            <textarea
              value={user.customCSS || ''}
              onChange={(e) => setUser({ ...user, customCSS: e.target.value })}
              placeholder="Enter custom CSS"
              rows={5}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Custom JavaScript</label>
            <textarea
              value={user.customJS || ''}
              onChange={(e) => setUser({ ...user, customJS: e.target.value })}
              placeholder="Enter custom JavaScript (executed in a sandbox)"
              rows={5}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white font-mono"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main Dashboard ---
export default function Dashboard() {
  const [user, setUser] = useState<User>({
    _id: '',
    name: '',
    username: '',
    avatar: '',
    profileBanner: '',
    pageBackground: '',
    bio: '',
    location: '',
    isEmailVerified: true,
    plan: 'free',
    profileViews: 0,
    theme: 'indigo',
    badges: [],
    email: '',
    discordId: undefined,
    xp: 0,
    level: 1,
    loginStreak: 0,
    lastLogin: '',
    loginHistory: [],
    lastMonthlyBadge: '',
    customCSS: '',
    customJS: '',
    seoMeta: { title: '', description: '', keywords: '' },
    analyticsCode: '',
    widgets: [],
  });

  const [links, setLinks] = useState<Link[]>([]);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [layoutStructure, setLayoutStructure] = useState<LayoutSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [layoutHistory, dispatch] = useReducer(historyReducer, [[]]);
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
        if (!data.success || !data.user) {
          throw new Error('Invalid response data');
        }

        const rawUsername = data.user.username || '';
        const safeUsername = isValidUsername(rawUsername) ? rawUsername : '';

        setUser({
          _id: data.user._id || '',
          name: (data.user.name || '').substring(0, 100),
          username: safeUsername,
          avatar: (data.user.avatar || '').trim(),
          profileBanner: (data.user.profileBanner || '').trim(),
          pageBackground: (data.user.pageBackground || '').trim(),
          bio: (data.user.bio || '').substring(0, 500),
          location: (data.user.location || '').substring(0, 100),
          isEmailVerified: data.user.isEmailVerified ?? true,
          plan: data.user.plan || 'free',
          profileViews: data.user.profileViews || 0,
          theme: (['indigo', 'purple', 'green', 'red', 'halloween'].includes(data.user.theme)
            ? data.user.theme
            : 'indigo') as User['theme'],
          badges: Array.isArray(data.user.badges) ? data.user.badges : [],
          email: data.user.email || '',
          discordId: data.user.discordId,
          xp: data.user.xp || 0,
          level: data.user.level || 1,
          loginStreak: data.user.loginStreak || 0,
          lastLogin: data.user.lastLogin || '',
          loginHistory: Array.isArray(data.user.loginHistory) ? data.user.loginHistory : [],
          lastMonthlyBadge: data.user.lastMonthlyBadge || '',
          customCSS: data.user.customCSS || '',
          customJS: data.user.customJS || '',
          seoMeta: data.user.seoMeta || { title: '', description: '', keywords: '' },
          analyticsCode: data.user.analyticsCode || '',
          widgets: Array.isArray(data.widgets) ? data.widgets : [],
        });

        const fetchedLinks = Array.isArray(data.links) ? data.links : [];
        const sortedLinks = [...fetchedLinks].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        setLinks(
          sortedLinks.map((link: any) => ({
            id: link.id || Date.now().toString(),
            url: (link.url || '').trim(),
            title: (link.title || '').substring(0, 100),
            icon: (link.icon || '').trim(),
            position: link.position ?? 0,
          }))
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

        setLayoutStructure(Array.isArray(data.layoutStructure) ? data.layoutStructure : []);
        dispatch({ type: 'SAVE', payload: data.layoutStructure || [] });
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
            profileBanner: user.profileBanner?.trim() || '',
            pageBackground: user.pageBackground?.trim() || '',
            bio: user.bio?.trim().substring(0, 500) || '',
            location: user.location?.trim().substring(0, 100) || '',
            plan: user.plan || 'free',
            theme: user.theme || 'indigo',
            layoutStructure,
            customCSS: user.customCSS || '',
            customJS: user.customJS || '',
            seoMeta: user.seoMeta || { title: '', description: '', keywords: '' },
            analyticsCode: user.analyticsCode || '',
            email: user.email,
            discordId: user.discordId,
          },
          links: linksToSend,
          widgets: widgetsToSend,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: 'Changes saved successfully!' });
        dispatch({ type: 'SAVE', payload: layoutStructure });
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

  const handleSave = () => {
    setShowGuidelinesModal(true);
  };

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'customize', name: 'Customize' },
    { id: 'builder', name: 'Profile Builder' },
    { id: 'links', name: 'Links' },
    { id: 'widgets', name: 'Widgets' },
    { id: 'seo', name: 'SEO & Meta' },
    { id: 'analytics_integration', name: 'Analytics' },
    { id: 'custom_code', name: 'Custom Code' },
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
        {/* Header */}
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

        {/* Tabs */}
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

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'overview' && <OverviewTab user={user} links={links} />}
            {activeTab === 'customize' && <CustomizeTab user={user} setUser={setUser} />}
            {activeTab === 'builder' && <ProfileBuilderTab layoutStructure={layoutStructure} setLayoutStructure={setLayoutStructure} user={user} links={links} />}
            {activeTab === 'links' && <LinksTab links={links} setLinks={setLinks} />}
            {activeTab === 'widgets' && <WidgetsTab widgets={widgets} setWidgets={setWidgets} user={user} />}
            {activeTab === 'seo' && <SEOTab user={user} setUser={setUser} />}
            {activeTab === 'analytics_integration' && <AnalyticsIntegrationTab user={user} setUser={setUser} />}
            {activeTab === 'custom_code' && <CustomCodeTab user={user} setUser={setUser} />}
          </div>

          {/* Live Preview */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-4 text-white">Live Preview</h2>
              <div className="bg-gray-900/50 rounded-xl p-6 text-center relative overflow-hidden min-h-[500px]">
                {user.pageBackground && (
                  /\.(mp4|webm)$/i.test(user.pageBackground) ? (
                    <video
                      className="absolute inset-0 z-0 object-cover w-full h-full"
                      src={user.pageBackground}
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <div
                      className="absolute inset-0 z-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${user.pageBackground})` }}
                    />
                  )
                )}
                <div className="absolute inset-0 bg-black/70 z-10"></div>
                <div className="relative z-20 space-y-4">
                  {user.profileBanner && (
                    <div className="relative rounded-xl overflow-hidden mb-4">
                      <img src={user.profileBanner} alt="Profile banner" className="w-full h-32 object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    </div>
                  )}
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-20 h-20 rounded-full mx-auto mb-3 border-2 border-white/20"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-white">{user.name || user.username}</h3>
                  {user.bio && <p className="text-gray-300 max-w-xs mx-auto">{user.bio}</p>}
                  <div className="space-y-3 mt-4">
                    {layoutStructure
                      .filter((s) => s.type !== 'name' && s.type !== 'bio')
                      .map((section) => {
                        if (section.type === 'links') {
                          const visibleLinks = section.visibleLinks
                            ? links.filter((l) => section.visibleLinks!.includes(l.id))
                            : links;
                          return (
                            <div key={section.id} className="space-y-2">
                              {visibleLinks.map((link) => (
                                <div key={link.id} className="text-sm bg-white/10 py-2 rounded">
                                  {link.title}
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return (
                          <div key={section.id} className="text-sm bg-white/10 py-2 rounded">
                            {section.type}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
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

        {/* Compliance Modal */}
        {showGuidelinesModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-white mb-3">Profile Compliance</h3>
              <p className="text-gray-300 mb-4">
                By saving, you agree your content complies with our{' '}
                <a href="/guidelines" className="text-indigo-400 hover:underline">
                  Community Guidelines
                </a>
                .
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowGuidelinesModal(false)} className="px-4 py-2 text-gray-300">
                  Cancel
                </button>
                <button
                  onClick={confirmSave}
                  disabled={isSaving}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700"
                >
                  {isSaving ? 'Saving...' : 'I Agree'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
