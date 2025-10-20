// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// --- Interfaces (same as your file) ---
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
];

const WIDGET_TYPES = [
  { id: 'youtube', name: 'YouTube' },
  { id: 'spotify', name: 'Spotify' },
  { id: 'twitter', name: 'Twitter' },
  { id: 'custom', name: 'Custom HTML' },
  { id: 'form', name: 'Contact Form' },
  { id: 'ecommerce', name: 'Buy Button' },
  { id: 'api', name: 'Dynamic API' },
  { id: 'calendar', name: 'Calendar' },
];

const isValidUsername = (username: string): boolean => /^[a-zA-Z0-9_-]{3,30}$/.test(username);

// --- TAB COMPONENTS (Redesigned) ---
const OverviewTab = ({ user, links }: { user: User; links: Link[] }) => (
  <div className="space-y-5">
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
      <h3 className="font-medium text-gray-300 mb-3">Your BioLink</h3>
      <a
        href={`https://thebiolink.lol/${user.username}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-indigo-400 hover:underline break-all block"
      >
        thebiolink.lol/{user.username}
      </a>
    </div>
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
      <h3 className="font-medium text-gray-300 mb-3">Stats</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-gray-400">Links</div>
          <div className="text-white font-medium">{links.length}</div>
        </div>
        <div>
          <div className="text-gray-400">Views</div>
          <div className="text-white font-medium">{user.profileViews || 0}</div>
        </div>
        <div>
          <div className="text-gray-400">Level</div>
          <div className="text-white font-medium">{user.level}</div>
        </div>
        <div>
          <div className="text-gray-400">Streak</div>
          <div className="text-white font-medium">{user.loginStreak} days</div>
        </div>
      </div>
    </div>
  </div>
);

const CustomizeTab = ({ user, setUser }: { user: User; setUser: (u: User) => void }) => {
  const updateField = (field: keyof User, value: string) => {
    if (field === 'username') {
      value = value.replace(/[^a-zA-Z0-9_-]/g, '');
    }
    setUser({ ...user, [field]: value });
  };

  return (
    <div className="space-y-5">
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
        <h3 className="font-medium text-gray-300 mb-4">Profile Identity</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name</label>
            <input
              value={user.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Username</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-lg bg-black/30 text-gray-500 border border-r-0 border-white/10">
                thebiolink.lol/
              </span>
              <input
                value={user.username}
                onChange={(e) => updateField('username', e.target.value)}
                className="flex-1 bg-black/30 border border-white/10 rounded-r-lg px-3 py-2 text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Bio</label>
            <textarea
              value={user.bio}
              onChange={(e) => updateField('bio', e.target.value)}
              rows={2}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
        <h3 className="font-medium text-gray-300 mb-4">Media</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Avatar URL</label>
            <input
              value={user.avatar}
              onChange={(e) => updateField('avatar', e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Background URL</label>
            <input
              value={user.pageBackground}
              onChange={(e) => updateField('pageBackground', e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              placeholder="Supports .jpg, .png, .mp4"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const LinksTab = ({ links, setLinks }: { links: Link[]; setLinks: (l: Link[]) => void }) => {
  const addLink = () => {
    setLinks([...links, { id: Date.now().toString(), title: 'New Link', url: '', icon: '', position: links.length }]);
  };

  const updateLink = (id: string, field: keyof Link, value: string) => {
    setLinks(links.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const removeLink = (id: string) => {
    setLinks(links.filter(l => l.id !== id).map((l, i) => ({ ...l, position: i })));
  };

  return (
    <div className="space-y-5">
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-gray-300">Your Links</h3>
          <button onClick={addLink} className="text-indigo-400 text-sm">+ Add</button>
        </div>
        <div className="space-y-3">
          {links.map(link => (
            <div key={link.id} className="bg-black/30 rounded-lg p-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                <input
                  value={link.title}
                  onChange={(e) => updateLink(link.id, 'title', e.target.value)}
                  placeholder="Title"
                  className="bg-black/50 border border-white/10 rounded px-2 py-1 text-white text-sm"
                />
                <input
                  value={link.url}
                  onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                  placeholder="https://..."
                  className="bg-black/50 border border-white/10 rounded px-2 py-1 text-white text-sm"
                />
              </div>
              <div className="flex gap-2">
                <input
                  value={link.icon}
                  onChange={(e) => updateLink(link.id, 'icon', e.target.value)}
                  placeholder="Icon URL (optional)"
                  className="flex-1 bg-black/50 border border-white/10 rounded px-2 py-1 text-white text-sm"
                />
                <button onClick={() => removeLink(link.id)} className="text-red-400 text-sm">Remove</button>
              </div>
            </div>
          ))}
          {links.length === 0 && <p className="text-gray-500 text-sm italic">No links added.</p>}
        </div>
      </div>
    </div>
  );
};

const WidgetsTab = ({ widgets, setWidgets, user }: { widgets: Widget[]; setWidgets: (w: Widget[]) => void; user: User }) => {
  const addWidget = (type: Widget['type']) => {
    setWidgets([...widgets, { id: Date.now().toString(), type, title: '', content: '', url: '', position: widgets.length }]);
  };

  const updateWidget = (id: string, field: keyof Widget, value: string) => {
    setWidgets(widgets.map(w => w.id === id ? { ...w, [field]: value } : w));
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id).map((w, i) => ({ ...w, position: i })));
  };

  return (
    <div className="space-y-5">
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
        <h3 className="font-medium text-gray-300 mb-4">Add Widget</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {WIDGET_TYPES.map(w => (
            <button
              key={w.id}
              onClick={() => addWidget(w.id as any)}
              disabled={w.id === 'custom' && user.plan !== 'premium'}
              className={`text-center text-sm p-2 rounded ${w.id === 'custom' && user.plan !== 'premium' ? 'opacity-40' : 'bg-black/30 hover:bg-black/40'}`}
            >
              {w.name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
        <h3 className="font-medium text-gray-300 mb-4">Your Widgets</h3>
        <div className="space-y-3">
          {widgets.map(widget => (
            <div key={widget.id} className="bg-black/30 rounded-lg p-3">
              <div className="font-medium text-white mb-2">{widget.type}</div>
              <input
                value={widget.title}
                onChange={(e) => updateWidget(widget.id, 'title', e.target.value)}
                placeholder="Title"
                className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-white text-sm mb-2"
              />
              <input
                value={widget.url}
                onChange={(e) => updateWidget(widget.id, 'url', e.target.value)}
                placeholder="Embed URL"
                className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-white text-sm mb-2"
              />
              {widget.type === 'custom' && (
                <textarea
                  value={widget.content}
                  onChange={(e) => updateWidget(widget.id, 'content', e.target.value)}
                  placeholder="Custom HTML"
                  rows={2}
                  className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-white text-sm font-mono"
                />
              )}
              <button onClick={() => removeWidget(widget.id)} className="text-red-400 text-sm mt-2">Remove</button>
            </div>
          ))}
          {widgets.length === 0 && <p className="text-gray-500 text-sm italic">No widgets added.</p>}
        </div>
      </div>
    </div>
  );
};

const ProfileBuilderTab = ({ layoutStructure, setLayoutStructure, links }: { layoutStructure: LayoutSection[]; setLayoutStructure: (s: LayoutSection[]) => void; links: Link[] }) => {
  const addBlock = (type: LayoutSection['type']) => {
    setLayoutStructure([...layoutStructure, { id: Date.now().toString(), type }]);
  };

  const updateBlock = (id: string, updates: Partial<LayoutSection>) => {
    setLayoutStructure(layoutStructure.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeBlock = (id: string) => {
    setLayoutStructure(layoutStructure.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-5">
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
        <h3 className="font-medium text-gray-300 mb-4">Add Block</h3>
        <div className="flex flex-wrap gap-2">
          {(['name', 'bio', 'badges', 'links', 'widget', 'text', 'spacer'] as const).map(type => (
            <button
              key={type}
              onClick={() => addBlock(type)}
              className="px-3 py-1.5 bg-black/30 hover:bg-black/40 rounded text-sm"
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
        <h3 className="font-medium text-gray-300 mb-4">Layout ({layoutStructure.length} blocks)</h3>
        <div className="space-y-3">
          {layoutStructure.map((section, idx) => (
            <div key={section.id} className="bg-black/30 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-medium">#{idx + 1} • {section.type}</span>
                <button onClick={() => removeBlock(section.id)} className="text-red-400">✕</button>
              </div>

              {section.type === 'links' && (
                <div className="text-sm">
                  <div className="text-gray-400 mb-1">Visible Links:</div>
                  {links.map(link => (
                    <label key={link.id} className="flex items-center mr-3">
                      <input
                        type="checkbox"
                        checked={section.visibleLinks?.includes(link.id) ?? true}
                        onChange={(e) => {
                          const current = section.visibleLinks || links.map(l => l.id);
                          const updated = e.target.checked
                            ? [...current, link.id]
                            : current.filter(id => id !== link.id);
                          updateBlock(section.id, { visibleLinks: updated });
                        }}
                        className="mr-1"
                      />
                      <span className="text-white">{link.title}</span>
                    </label>
                  ))}
                </div>
              )}

              {section.type === 'text' && (
                <textarea
                  value={section.content || ''}
                  onChange={(e) => updateBlock(section.id, { content: e.target.value })}
                  placeholder="HTML content"
                  rows={2}
                  className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-white text-sm font-mono mt-2"
                />
              )}
            </div>
          ))}
          {layoutStructure.length === 0 && <p className="text-gray-500 text-sm italic">No blocks. Your profile will be empty.</p>}
        </div>
      </div>
    </div>
  );
};

const SEOTab = ({ user, setUser }: { user: User; setUser: (u: User) => void }) => {
  const updateSEO = (field: keyof User['seoMeta'], value: string) => {
    setUser({ ...user, seoMeta: { ...user.seoMeta, [field]: value } });
  };

  return (
    <div className="space-y-5">
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
        <h3 className="font-medium text-gray-300 mb-4">SEO Meta</h3>
        <div className="space-y-3">
          <input
            value={user.seoMeta.title || ''}
            onChange={(e) => updateSEO('title', e.target.value)}
            placeholder="Page title"
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
          />
          <textarea
            value={user.seoMeta.description || ''}
            onChange={(e) => updateSEO('description', e.target.value)}
            placeholder="Meta description"
            rows={2}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
          />
          <input
            value={user.seoMeta.keywords || ''}
            onChange={(e) => updateSEO('keywords', e.target.value)}
            placeholder="Keywords"
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
          />
        </div>
      </div>
    </div>
  );
};

const AnalyticsTab = ({ user, setUser }: { user: User; setUser: (u: User) => void }) => (
  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
    <h3 className="font-medium text-gray-300 mb-4">Analytics Code</h3>
    <textarea
      value={user.analyticsCode || ''}
      onChange={(e) => setUser({ ...user, analyticsCode: e.target.value })}
      placeholder="Paste Google Analytics or similar"
      rows={4}
      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
    />
  </div>
);

const CustomCodeTab = ({ user, setUser }: { user: User; setUser: (u: User) => void }) => (
  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
    <h3 className="font-medium text-gray-300 mb-4">Custom Code</h3>
    {user.plan !== 'premium' ? (
      <p className="text-gray-400">Available on Premium.</p>
    ) : (
      <div className="space-y-3">
        <textarea
          value={user.customCSS || ''}
          onChange={(e) => setUser({ ...user, customCSS: e.target.value })}
          placeholder="Custom CSS"
          rows={4}
          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
        />
        <textarea
          value={user.customJS || ''}
          onChange={(e) => setUser({ ...user, customJS: e.target.value })}
          placeholder="Custom JavaScript"
          rows={4}
          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
        />
      </div>
    )}
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
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load data
  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/dashboard/data');
      if (!res.ok) return router.push('/auth/login');
      const data = await res.json();
      if (!data.success) return router.push('/auth/login');

      setUser({
        _id: data.user._id || '',
        name: data.user.name || '',
        username: data.user.username || '',
        avatar: data.user.avatar || '',
        profileBanner: data.user.profileBanner || '',
        pageBackground: data.user.pageBackground || '',
        bio: data.user.bio || '',
        location: data.user.location || '',
        isEmailVerified: data.user.isEmailVerified ?? true,
        plan: data.user.plan || 'free',
        profileViews: data.user.profileViews || 0,
        theme: data.user.theme || 'indigo',
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

      setLinks(Array.isArray(data.links) ? data.links : []);
      setWidgets(Array.isArray(data.widgets) ? data.widgets : []);
      setLayoutStructure(Array.isArray(data.layoutStructure) ? data.layoutStructure : []);
      setLoading(false);
    };
    load();
  }, [router]);

  const save = async () => {
    if (!isValidUsername(user.username)) {
      alert('Invalid username');
      return;
    }

    const res = await fetch('/api/dashboard/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: {
          name: user.name,
          username: user.username,
          avatar: user.avatar,
          profileBanner: user.profileBanner,
          pageBackground: user.pageBackground,
          bio: user.bio,
          location: user.location,
          plan: user.plan,
          theme: user.theme,
          layoutStructure,
          customCSS: user.customCSS,
          customJS: user.customJS,
          seoMeta: user.seoMeta,
          analyticsCode: user.analyticsCode,
          email: user.email,
          discordId: user.discordId,
        },
        links,
        widgets,
      }),
    });

    if (res.ok) {
      alert('Saved!');
    } else {
      alert('Save failed');
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'customize', name: 'Profile' },
    { id: 'builder', name: 'Layout' },
    { id: 'links', name: 'Links' },
    { id: 'widgets', name: 'Widgets' },
    { id: 'seo', name: 'SEO' },
    { id: 'analytics', name: 'Analytics' },
    { id: 'code', name: 'Code' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">BioLink Dashboard</h1>
            <p className="text-gray-500 text-sm">thebiolink.lol/{user.username}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.push('/auth/logout')} className="px-4 py-2 bg-gray-800 rounded-lg text-sm">Logout</button>
            <button onClick={save} className="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-medium">Save</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/10 mb-8">
          <nav className="flex overflow-x-auto pb-2 gap-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-t text-sm ${
                  activeTab === tab.id ? 'text-white bg-black/30' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'overview' && <OverviewTab user={user} links={links} />}
          {activeTab === 'customize' && <CustomizeTab user={user} setUser={setUser} />}
          {activeTab === 'builder' && <ProfileBuilderTab layoutStructure={layoutStructure} setLayoutStructure={setLayoutStructure} links={links} />}
          {activeTab === 'links' && <LinksTab links={links} setLinks={setLinks} />}
          {activeTab === 'widgets' && <WidgetsTab widgets={widgets} setWidgets={setWidgets} user={user} />}
          {activeTab === 'seo' && <SEOTab user={user} setUser={setUser} />}
          {activeTab === 'analytics' && <AnalyticsTab user={user} setUser={setUser} />}
          {activeTab === 'code' && <CustomCodeTab user={user} setUser={setUser} />}
        </div>
      </div>
    </div>
  );
}
