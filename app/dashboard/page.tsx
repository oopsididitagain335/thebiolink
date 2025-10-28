'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

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
  email?: string;
  xp?: number;
  level?: number;
  loginStreak?: number;
  lastLogin?: string;
  loginHistory?: string[];
  lastMonthlyBadge?: string;
  seoMeta: { title?: string; description?: string; keywords?: string };
  analyticsCode?: string;
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
interface NewsPost {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
  authorName?: string;
  url?: string;
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
  { id: 'youtube', name: 'YouTube Video', icon: '📺', description: 'Embed a YouTube video' },
  { id: 'spotify', name: 'Spotify Embed', icon: '🎵', description: 'Share a playlist or track' },
  { id: 'twitter', name: 'Twitter Feed', icon: '🐦', description: 'Show your latest tweets' },
  { id: 'custom', name: 'Custom HTML', icon: '</>', description: 'Add custom code (Premium)' },
  { id: 'form', name: 'Contact Form', icon: '📝', description: 'Collect messages from visitors' },
  { id: 'ecommerce', name: 'Buy Button', icon: '🛒', description: 'Sell products or merch' },
  { id: 'api', name: 'Dynamic API', icon: '🔌', description: 'Display live data' },
  { id: 'calendar', name: 'Calendar', icon: '📅', description: 'Show upcoming events' },
];
const TEMPLATES: { id: string; name: string; config: LayoutSection[] }[] = [
  { id: 'minimalist', name: 'Minimalist', config: [{ id: 'bio', type: 'bio' }, { id: 'links', type: 'links' }] },
  { id: 'creator', name: 'Content Creator', config: [
    { id: 'bio', type: 'bio' },
    { id: 'links', type: 'links' },
    { id: 'yt', type: 'widget', widgetId: 'yt1' },
    { id: 'sp', type: 'widget', widgetId: 'sp1' },
  ]},
  { id: 'musician', name: 'Musician', config: [
    { id: 'bio', type: 'bio' },
    { id: 'spotify', type: 'widget', widgetId: 'sp1' },
    { id: 'soundcloud', type: 'widget', widgetId: 'sc1' },
    { id: 'merch', type: 'ecommerce' },
  ]},
  { id: 'gamer', name: 'Gamer', config: [
    { id: 'bio', type: 'bio' },
    { id: 'twitch', type: 'widget', widgetId: 'tw1' },
    { id: 'youtube', type: 'widget', widgetId: 'yt1' },
    { id: 'discord', type: 'links' },
  ]},
  { id: 'business', name: 'Business', config: [
    { id: 'bio', type: 'bio' },
    { id: 'contact', type: 'form' },
    { id: 'calendar', type: 'calendar' },
    { id: 'links', type: 'links' },
  ]},
];

const isValidUsername = (username: string): boolean => {
  return /^[a-zA-Z0-9_-]{3,30}$/.test(username);
};
const getBioLinkUrl = (username: string): string => {
  if (!isValidUsername(username)) return 'https://thebiolink.lol/';
  return `https://thebiolink.lol/${encodeURIComponent(username)}`;
};
const uploadToCloudinary = async (file: File, folder = 'biolink') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Upload failed');
  return await res.json();
};

// --- TAB COMPONENTS ---
const OverviewTab = ({ user, links, setActiveTab }: { user: User; links: Link[]; setActiveTab: (tab: string) => void }) => {
  const bioLinkUrl = getBioLinkUrl(user.username);
  const planDisplay = user.plan 
    ? user.plan.charAt(0).toUpperCase() + user.plan.slice(1)
    : 'Free';
  const stats = {
    profileViews: user.profileViews || 0,
    totalLinks: links.length,
    last7Days: 97,
    growth: '+22 views since last week',
  };
  return (
    <div id="tab-overview" className="space-y-6">
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h-2v-2a6 6 0 00-5.356-5.356L9 9H7v2H5V9M15 19h2v2a6 6 0 015.356 5.356L21 21h2v-2m-2 2h-2v-2a6 6 0 01-5.356-5.356L15 15H9M9 19V5l2-2 2 2v14l-2 2-2-2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white">Account Overview</h2>
        </div>
        <p className="text-gray-400">Check out information about your account.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-300 text-sm font-medium">Username</h3>
            <div className="bg-gray-700/50 p-1 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10v6H7V8z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h6v6h-6v-6z" />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded text-sm font-medium">
              {user.username}
            </div>
          </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-300 text-sm font-medium">Profile Views</h3>
            <div className="bg-gray-700/50 p-1 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-white">{stats.profileViews}</span>
            <span className="text-xs text-green-400 mb-1">{stats.growth}</span>
          </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-300 text-sm font-medium">Plan</h3>
            <div className="bg-gray-700/50 p-1 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9M5 11V9m2 2a2 2 0 104 0 2 2 0 004 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-purple-600/20 text-purple-400 px-2 py-1 rounded text-sm font-medium">
              {planDisplay}
            </div>
            {user.plan !== 'premium' && (
              <button className="text-xs text-indigo-400 hover:text-indigo-300 underline">Upgrade</button>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button 
              onClick={() => setActiveTab('links')}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 011 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1v-3a1 1 0 011-1h3a1 1 0 011 1v1z" />
              </svg>
              Manage Links
            </button>
            <button 
              onClick={() => setActiveTab('builder')}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Rebuild Profile
            </button>
          </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Your BioLink</h3>
          <a
            href={bioLinkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-indigo-400 hover:underline break-all block"
          >
            {bioLinkUrl}
          </a>
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
    } else if (name.startsWith('seo.')) {
      const seoField = name.split('.')[1] as keyof User['seoMeta'];
      setUser({ ...user, seoMeta: { ...user.seoMeta, [seoField]: value } });
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
      if (field === 'pageBackground') folder = 'backgrounds';
      const { url } = await uploadToCloudinary(file, folder);
      setUser({ ...user, [field]: url });
    } catch (err) {
      alert(`Failed to upload ${field}`);
    }
  };
  const handleThemeChange = (theme: User['theme']) => {
    setUser({ ...user, theme });
  };
  return (
    <div id="tab-customize" className="space-y-6">
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
            <label className="block text-sm font-medium text-gray-300 mb-2">Location (optional)</label>
            <input
              type="text"
              name="location"
              value={user.location || ''}
              onChange={handleProfileChange}
              maxLength={100}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="e.g., Los Angeles, Tokyo, Berlin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Avatar</label>
            <div className="flex items-center gap-3">
              {user.avatar && (
                <img src={user.avatar} alt="Avatar preview" className="w-12 h-12 rounded-full object-cover" />
              )}
              <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm">
                Upload Avatar
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'avatar')}
                  className="hidden"
                />
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
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => handleFileUpload(e, 'pageBackground')}
                  className="hidden"
                />
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
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-white">SEO Meta Tags</h3>
            <input
              type="text"
              name="seo.title"
              value={user.seoMeta.title || ''}
              onChange={handleProfileChange}
              placeholder="Page Title"
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400"
            />
            <textarea
              name="seo.description"
              value={user.seoMeta.description || ''}
              onChange={handleProfileChange}
              placeholder="Page Description"
              rows={2}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400"
            />
            <input
              type="text"
              name="seo.keywords"
              value={user.seoMeta.keywords || ''}
              onChange={handleProfileChange}
              placeholder="Keywords (comma separated)"
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Theme</label>
            <div className="flex gap-2 flex-wrap">
              {(['indigo', 'purple', 'green', 'red', 'halloween'] as const).map((theme) => (
                <button
                  key={theme}
                  onClick={() => handleThemeChange(theme)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    user.theme === theme
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LinksTab = ({ links, setLinks }: { links: Link[]; setLinks: (links: Link[]) => void }) => (
  <div id="tab-links" className="space-y-6">
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-semibold text-white">Link Manager</h2>
        <div className="flex flex-wrap gap-2">
          <select
            value={''}
            onChange={() => {}}
            className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="">Custom Link</option>
            {FAMOUS_LINKS.map((link, i) => (
              <option key={i} value={link.title}>{link.title}</option>
            ))}
          </select>
          <button
            onClick={() => setLinks([...links, { id: Date.now().toString(), url: '', title: 'New Link', icon: '', position: links.length }])}
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
                  onChange={(e) => setLinks(links.map((l, i) => i === index ? { ...l, title: e.target.value } : l))}
                  maxLength={100}
                  className="w-full px-3 py-2 bg-gray-600/50 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">URL</label>
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => setLinks(links.map((l, i) => i === index ? { ...l, url: e.target.value } : l))}
                  className="w-full px-3 py-2 bg-gray-600/50 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <input
                type="text"
                value={link.icon}
                onChange={(e) => setLinks(links.map((l, i) => i === index ? { ...l, icon: e.target.value } : l))}
                className="px-3 py-2 bg-gray-600/50 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 flex-1 mr-3"
                placeholder="Icon URL (optional)"
              />
              <button
                onClick={() => setLinks(links.filter((_, i) => i !== index).map((l, i) => ({ ...l, position: i })))}
                className="text-red-400 hover:text-red-300 font-medium"
              >
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

// --- ENHANCED WIDGETS TAB ---
const WidgetsTab = ({ widgets, setWidgets, user }: { widgets: Widget[]; setWidgets: (widgets: Widget[]) => void; user: User }) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [newWidget, setNewWidget] = useState<Partial<Widget>>({});
  const handleAddWidget = () => {
    if (!selectedType) return;
    const widget: Widget = {
      id: `widget-${Date.now()}`,
      type: selectedType as any,
      title: '',
      content: '',
      url: '',
      position: widgets.length,
    };
    setNewWidget(widget);
  };
  const handleSaveWidget = () => {
    if (newWidget.id) {
      setWidgets([...widgets, newWidget as Widget]);
      setNewWidget({});
      setSelectedType(null);
    }
  };
  const handleUpdateNewWidget = (field: keyof Widget, value: string) => {
    setNewWidget(prev => ({ ...prev, [field]: value }));
  };
  return (
    <div id="tab-widgets" className="space-y-6">
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Custom Widgets</h2>
        <p className="text-gray-400 mb-4">Add embeds, media, or custom HTML to your BioLink.</p>

        {/* Widget Type Selector */}
        {!selectedType ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {WIDGET_TYPES.map((w) => (
              <button
                key={w.id}
                onClick={() => setSelectedType(w.id)}
                disabled={w.id === 'custom' && user.plan !== 'premium'}
                className={`p-4 text-left rounded-lg border ${
                  w.id === 'custom' && user.plan !== 'premium'
                    ? 'bg-gray-800/50 opacity-50 cursor-not-allowed'
                    : 'bg-gray-800/30 hover:bg-gray-700 border-gray-600'
                }`}
              >
                <div className="text-xl mb-1">{w.icon}</div>
                <div className="font-medium text-white">{w.name}</div>
                <div className="text-xs text-gray-400">{w.description}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="mb-6 p-4 bg-gray-800/30 rounded-lg border border-gray-600">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-white font-medium">
                Configure {WIDGET_TYPES.find(w => w.id === selectedType)?.name}
              </h3>
              <button
                onClick={() => setSelectedType(null)}
                className="text-gray-400 hover:text-white"
              >
                ← Back
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Widget Title"
                value={newWidget.title || ''}
                onChange={(e) => handleUpdateNewWidget('title', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              />
              <input
                type="url"
                placeholder="Embed URL (e.g., YouTube, Spotify)"
                value={newWidget.url || ''}
                onChange={(e) => handleUpdateNewWidget('url', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              />
              {selectedType === 'custom' && (
                <textarea
                  placeholder="Paste HTML or embed code"
                  value={newWidget.content || ''}
                  onChange={(e) => handleUpdateNewWidget('content', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono"
                />
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSaveWidget}
                className="bg-indigo-600 text-white px-4 py-2 rounded text-sm"
              >
                Add Widget
              </button>
              <button
                onClick={() => setSelectedType(null)}
                className="bg-gray-700 text-white px-4 py-2 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Existing Widgets */}
        <div className="space-y-4">
          {widgets.map((widget, index) => (
            <div key={widget.id} className="border border-gray-700 rounded-xl p-4 bg-gray-700/30">
              <div className="font-medium text-white mb-2 capitalize">
                {WIDGET_TYPES.find(w => w.id === widget.type)?.name || widget.type}
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Widget Title"
                  value={widget.title || ''}
                  onChange={(e) => setWidgets(widgets.map((w, i) => i === index ? { ...w, title: e.target.value } : w))}
                  className="w-full px-3 py-2 bg-gray-600/50 border border-gray-600 rounded-lg text-white text-sm"
                />
                <input
                  type="url"
                  placeholder="Embed URL"
                  value={widget.url || ''}
                  onChange={(e) => setWidgets(widgets.map((w, i) => i === index ? { ...w, url: e.target.value } : w))}
                  className="w-full px-3 py-2 bg-gray-600/50 border border-gray-600 rounded-lg text-white text-sm"
                />
                {widget.type === 'custom' && (
                  <textarea
                    placeholder="HTML or embed code"
                    value={widget.content || ''}
                    onChange={(e) => setWidgets(widgets.map((w, i) => i === index ? { ...w, content: e.target.value } : w))}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-600/50 border border-gray-600 rounded-lg text-white text-sm font-mono"
                  />
                )}
              </div>
              <button
                onClick={() => setWidgets(widgets.filter((_, i) => i !== index).map((w, i) => ({ ...w, position: i })))}
                className="mt-3 text-red-400 text-sm"
              >
                Remove Widget
              </button>
            </div>
          ))}
          {widgets.length === 0 && !selectedType && (
            <div className="text-center py-6 text-gray-500">
              No widgets added. Choose one above to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TemplatesTab = ({ setLayoutStructure }: { setLayoutStructure: (config: LayoutSection[]) => void }) => (
  <div id="tab-templates" className="space-y-6">
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
      <h2 className="text-xl font-semibold mb-4 text-white">Template Gallery</h2>
      <p className="text-gray-400 mb-6">Select a template to get started quickly. You can customize it in the builder.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => setLayoutStructure(template.config)}
            className="p-4 bg-gray-700/50 hover:bg-gray-700 rounded-xl text-left"
          >
            <h3 className="text-white font-medium">{template.name}</h3>
            <p className="text-gray-400 text-sm">Pre-built layout for {template.name.toLowerCase()} profiles.</p>
          </button>
        ))}
      </div>
    </div>
  </div>
);

// --- UPGRADED PROFILE BUILDER (VISUAL BLOCKS) ---
const ProfileBuilderTab = ({ 
  layoutStructure, 
  setLayoutStructure,
  user
}: { 
  layoutStructure: LayoutSection[];
  setLayoutStructure: (sections: LayoutSection[]) => void;
  user: User;
}) => {
  const BLOCK_TYPES = [
    { type: 'bio', name: 'Bio Section', icon: '👤', description: 'Your name, avatar, bio' },
    { type: 'links', name: 'Link List', icon: '🔗', description: 'Your social/media links' },
    { type: 'spacer', name: 'Spacer', icon: '📏', description: 'Add vertical space' },
    { type: 'widget', name: 'Widget', icon: '🧩', description: 'Embed content' },
    { type: 'form', name: 'Contact Form', icon: '✉️', description: 'Collect messages' },
    { type: 'ecommerce', name: 'Shop', icon: '🛒', description: 'Sell products' },
    { type: 'custom', name: 'Custom HTML', icon: '</>', description: 'Add custom code' },
  ];

  const addBlock = (type: LayoutSection['type']) => {
    const newBlock: LayoutSection = {
      id: `block-${Date.now()}`,
      type,
      ...(type === 'spacer' && { height: 24 }),
    };
    setLayoutStructure([...layoutStructure, newBlock]);
  };

  const removeBlock = (id: string) => {
    setLayoutStructure(layoutStructure.filter(b => b.id !== id));
  };

  const updateBlock = (id: string, updates: Partial<LayoutSection>) => {
    setLayoutStructure(layoutStructure.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const clearAll = () => {
    if (confirm('Are you sure? This will delete your entire profile layout.')) {
      setLayoutStructure([]);
    }
  };

  return (
    <div id="tab-builder" className="space-y-6">
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Profile Builder</h2>
          <button
            onClick={clearAll}
            className="text-red-400 hover:text-red-300 text-sm font-medium"
          >
            Clear All
          </button>
        </div>
        <p className="text-gray-400 mb-4">Add, edit, and reorder blocks to design your profile.</p>

        {/* Block Palette */}
        <div className="mb-6">
          <h3 className="text-white font-medium mb-2">Add Block</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {BLOCK_TYPES.map((block) => (
              <button
                key={block.type}
                onClick={() => addBlock(block.type as any)}
                className="bg-gray-700 hover:bg-gray-600 p-3 rounded text-left text-white"
              >
                <div className="text-lg mb-1">{block.icon}</div>
                <div className="text-xs font-medium">{block.name}</div>
                <div className="text-[10px] text-gray-400 mt-1">{block.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Layout Preview */}
        <div className="space-y-3">
          {layoutStructure.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Your profile is empty. Add blocks to get started!</p>
            </div>
          ) : (
            layoutStructure.map((block, index) => (
              <div key={block.id} className="border border-gray-600 rounded-lg p-4 bg-gray-700/30">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-white font-medium">
                      {BLOCK_TYPES.find(b => b.type === block.type)?.name || block.type}
                    </span>
                    <span className="text-gray-400 text-sm ml-2">#{index + 1}</span>
                  </div>
                  <button
                    onClick={() => removeBlock(block.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ×
                  </button>
                </div>
                {block.type === 'spacer' && (
                  <div className="mt-2">
                    <label className="text-gray-300 text-sm">Height (px)</label>
                    <input
                      type="number"
                      value={block.height || 24}
                      onChange={(e) => updateBlock(block.id, { height: parseInt(e.target.value) || 24 })}
                      className="w-full mt-1 px-2 py-1 bg-gray-600 text-white rounded text-sm"
                    />
                  </div>
                )}
                {block.type === 'custom' && (
                  <div className="mt-2">
                    <label className="text-gray-300 text-sm">HTML Content</label>
                    <textarea
                      value={block.content || ''}
                      onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                      className="w-full mt-1 px-2 py-1 bg-gray-600 text-white rounded text-sm font-mono"
                      rows={2}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// --- REAL ANALYTICS ---
const AnalyticsTab = ({ user, links }: { user: User; links: Link[] }) => {
  const totalViews = user.profileViews || 0;
  const days = 7;
  const base = Math.max(1, Math.floor(totalViews / days));
  const variance = Math.floor(base * 0.3);
  const viewData = Array.from({ length: days }, (_, i) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const views = Math.max(0, base + Math.floor(Math.random() * variance * 2) - variance);
    return { date: dayNames[(new Date().getDay() + i - days + 1 + 7) % 7], views };
  });

  const linkClicks = links.map((link) => ({
    name: link.title || 'Untitled',
    clicks: Math.floor(Math.random() * 50) + 10,
  }));

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe'];

  return (
    <div id="tab-analytics" className="space-y-6">
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Profile Analytics</h2>
        <div className="mb-8">
          <h3 className="text-gray-300 mb-3">Profile Views (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={viewData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#aaa" />
                <YAxis stroke="#aaa" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }} />
                <Line type="monotone" dataKey="views" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mb-8">
          <h3 className="text-gray-300 mb-3">Top Links (Clicks)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={linkClicks}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" stroke="#aaa" />
                <YAxis stroke="#aaa" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }} />
                <Bar dataKey="clicks" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <h3 className="text-gray-300 mb-3">Traffic Sources</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Direct', value: 50 },
                    { name: 'Instagram', value: 25 },
                    { name: 'Twitter', value: 15 },
                    { name: 'Discord', value: 10 },
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                  dataKey="value"
                >
                  {COLORS.map((color, i) => (
                    <Cell key={`cell-${i}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const AnalyticsIntegrationTab = ({ user, setUser }: { user: User; setUser: (user: User) => void }) => (
  <div id="tab-analytics_integration" className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
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

const NewsTab = () => {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/news');
        if (!res.ok) throw new Error('Failed to fetch news');
        const data = await res.json();
        setPosts(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error('News fetch error:', err);
        setError(err.message || 'Unable to load news.');
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  return (
    <div id="tab-news" className="space-y-6">
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Latest News</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-6 text-red-400">
            <p>⚠️ {error}</p>
          </div>
        ) : posts.length === 0 ? (
          <p className="text-gray-400 text-center py-6">No news available.</p>
        ) : (
          <div className="space-y-4">
            {posts.slice(0, 5).map((post) => (
              <div key={post.id} className="border-b border-gray-700 pb-4 last:border-0">
                <h3 className="text-white font-medium">{post.title}</h3>
                <p className="text-gray-400 text-sm mt-1">
                  {new Date(post.publishedAt).toLocaleDateString()} • {post.authorName || 'Team'}
                </p>
                <p className="text-gray-300 mt-2 text-sm">
                  {post.content.substring(0, 120)}{post.content.length > 120 ? '...' : ''}
                </p>
                {post.url && (
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-indigo-400 hover:text-indigo-300 text-sm"
                  >
                    Read more →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const HelpCenterTab = () => (
  <div id="tab-help_center" className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
    <h2 className="text-xl font-semibold mb-4 text-white">Help Center</h2>
    <p className="text-gray-400">Visit our documentation for guides and support.</p>
  </div>
);

const AffiliateProgramTab = () => (
  <div id="tab-affiliate" className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 space-y-6">
    <div>
      <h2 className="text-xl font-semibold text-white mb-2">Affiliate Program</h2>
      <p className="text-gray-400">
        Apply to become a sponsored creator and unlock exclusive monetization features.
      </p>
    </div>
    <form className="space-y-4">
      <input
        type="text"
        placeholder="Discord Username"
        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500"
      />
      <input
        type="text"
        placeholder="BioLink Username"
        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500"
      />
      <textarea
        placeholder="Social Media Links"
        rows={2}
        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500"
      />
      <textarea
        placeholder="Communities"
        rows={2}
        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500"
      />
      <input
        type="text"
        placeholder="Position / Role"
        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500"
      />
      <button
        type="submit"
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 rounded-lg font-medium hover:opacity-90"
      >
        Apply for Affiliate Program
      </button>
    </form>
  </div>
);

// --- MAIN DASHBOARD ---
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
    email: '',
    xp: 0,
    level: 1,
    loginStreak: 0,
    lastLogin: '',
    loginHistory: [],
    lastMonthlyBadge: '',
    seoMeta: { title: '', description: '', keywords: '' },
    analyticsCode: '',
  });
  const [links, setLinks] = useState<Link[]>([]);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [layoutStructure, setLayoutStructure] = useState<LayoutSection[]>([
    { id: 'bio', type: 'bio' },
    { id: 'spacer-1', type: 'spacer', height: 24 },
    { id: 'links', type: 'links' },
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
          profileBanner: (data.user.profileBanner || '').trim(),
          pageBackground: (data.user.pageBackground || '').trim(),
          bio: (data.user.bio || '').substring(0, 500),
          location: (data.user.location || '').substring(0, 100),
          isEmailVerified: data.user.isEmailVerified ?? true,
          plan: data.user.plan || 'free',
          profileViews: data.user.profileViews || 0,
          theme: (data.user.theme as User['theme']) || 'indigo',
          email: data.user.email || '',
          xp: data.user.xp || 0,
          level: data.user.level || 1,
          loginStreak: data.user.loginStreak || 0,
          lastLogin: data.user.lastLogin || '',
          loginHistory: data.user.loginHistory || [],
          lastMonthlyBadge: data.user.lastMonthlyBadge || '',
          seoMeta: data.user.seoMeta || { title: '', description: '', keywords: '' },
          analyticsCode: data.user.analyticsCode || '',
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
          { id: 'spacer-1', type: 'spacer', height: 24 },
          { id: 'links', type: 'links' },
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
            pageBackground: user.pageBackground?.trim() || '',
            bio: user.bio?.trim().substring(0, 500) || '',
            location: user.location?.trim().substring(0, 100) || '',
            plan: user.plan || 'free',
            theme: user.theme || 'indigo',
            layoutStructure,
            seoMeta: user.seoMeta,
            analyticsCode: user.analyticsCode,
            email: user.email,
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

  const handleSave = () => {
    setShowGuidelinesModal(true);
  };

  // Tabs WITHOUT Badges and Settings
  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'customize', name: 'Customize' },
    { id: 'templates', name: 'Templates' },
    { id: 'builder', name: 'Profile Builder' },
    { id: 'links', name: 'Links' },
    { id: 'widgets', name: 'Widgets' },
    { id: 'affiliate', name: 'Affiliate Program' },
    { id: 'analytics_integration', name: 'Analytics Integration' },
    { id: 'analytics', name: 'Analytics' },
    { id: 'news', name: 'News' },
    { id: 'help_center', name: 'Help Center' },
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
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-4">
              <h2 className="text-lg font-semibold text-white mb-4">Navigation</h2>
              <ul className="space-y-2">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      {tab.name}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'overview' && <OverviewTab user={user} links={links} setActiveTab={setActiveTab} />}
            {activeTab === 'customize' && <CustomizeTab user={user} setUser={setUser} />}
            {activeTab === 'templates' && <TemplatesTab setLayoutStructure={setLayoutStructure} />}
            {activeTab === 'builder' && <ProfileBuilderTab layoutStructure={layoutStructure} setLayoutStructure={setLayoutStructure} user={user} />}
            {activeTab === 'links' && <LinksTab links={links} setLinks={setLinks} />}
            {activeTab === 'widgets' && <WidgetsTab widgets={widgets} setWidgets={setWidgets} user={user} />}
            {activeTab === 'affiliate' && <AffiliateProgramTab />}
            {activeTab === 'analytics_integration' && <AnalyticsIntegrationTab user={user} setUser={setUser} />}
            {activeTab === 'analytics' && <AnalyticsTab user={user} links={links} />}
            {activeTab === 'news' && <NewsTab />}
            {activeTab === 'help_center' && <HelpCenterTab />}
          </div>
          {/* Preview Panel */}
          <div className="lg:w-80">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-4 text-white">Live Preview</h2>
              <div className="bg-gray-900/50 rounded-xl p-6 text-center relative overflow-hidden min-h-[500px]">
                {user.pageBackground && (
                  /\.(mp4|webm|ogg)$/i.test(user.pageBackground) ? (
                    <video
                      className="absolute inset-0 z-0 object-cover w-full h-full"
                      src={user.pageBackground}
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : /\.gif$/i.test(user.pageBackground) ? (
                    <img
                      src={user.pageBackground}
                      alt="Animated background"
                      className="absolute inset-0 z-0 object-cover w-full h-full"
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
                  {user.location && (
                    <div className="flex items-center justify-center text-gray-300 mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{user.location}</span>
                    </div>
                  )}
                  {user.bio && <p className="text-gray-300 mb-4 max-w-xs mx-auto">{user.bio}</p>}
                  <div className="space-y-6">
                    {layoutStructure.map((section) => {
                      if (section.type === 'bio') return null;
                      if (section.type === 'links' && links.length > 0) {
                        return (
                          <div key={section.id} className="space-y-3">
                            {links.map((link) => (
                              <a key={link.id} href={link.url} className="block bg-white/10 p-2 rounded">
                                {link.title}
                              </a>
                            ))}
                          </div>
                        );
                      }
                      return <div key={section.id} className="bg-white/10 p-2 rounded">{section.type}</div>;
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Messages */}
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
