'use client';
import { useState, useEffect } from 'react';
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
  type: 'spotify' | 'youtube' | 'twitter' | 'custom';
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
}
interface User {
  _id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  location?: string;
  background: string;
  isEmailVerified: boolean;
  plan?: string;
  profileViews?: number;
  badges?: Badge[];
  email?: string;
}
interface LayoutSection {
  id: string;
  type: 'bio' | 'links' | 'widget' | 'spacer' | 'custom';
  widgetId?: string;
  height?: number;
  content?: string;
}
interface NewsPost {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  authorName: string;
  publishedAt: string;
  likes: number;
  comments: Array<{
    id: string;
    content: string;
    author: string;
    authorName: string;
    createdAt: string;
  }>;
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
// --- Draggable Component ---
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
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
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
// --- Badges Tab ---
const BadgesTab = ({ user }: { user: User }) => {
  if (!user.badges || user.badges.length === 0) {
    return (
      <div className="bg-slate-800/70 backdrop-blur-md border border-slate-700 rounded-3xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-white">Your Badges</h2>
        <p className="text-slate-400 text-lg">You haven't earned any badges yet.</p>
      </div>
    );
  }
  return (
    <div className="bg-slate-800/70 backdrop-blur-md border border-slate-700 rounded-3xl p-8 shadow-2xl">
      <h2 className="text-2xl font-bold mb-6 text-white">Your Badges</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {user.badges.map(badge => (
          <div 
            key={badge.id} 
            className="p-6 rounded-2xl border border-blue-500 bg-blue-900/10 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center space-x-4 mb-4">
              <img src={badge.icon} alt={badge.name} className="w-12 h-12 rounded-full" />
              <span className="text-white text-lg font-semibold">{badge.name}</span>
            </div>
            <p className="text-slate-300 text-base mb-3">{badge.description}</p>
            <p className="text-sm text-slate-500">
              Earned: {new Date(badge.earnedAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
// --- Settings Tab ---
const SettingsTab = ({ user, setUser }: { user: User; setUser: (user: User) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  useEffect(() => {
    if (user.email) setEmail(user.email);
  }, [user.email]);
  const handleAccountSecurity = () => {
    alert('Please set up your email and password for improved security.');
  };
  const handleUpgrade = () => {
    window.location.href = '/pricing';
  };
  return (
    <div className="space-y-8">
      <div className="bg-slate-800/70 backdrop-blur-md border border-slate-700 rounded-3xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-white">Account Security</h2>
        <p className="text-slate-400 mb-6 text-lg">
          {!user.isEmailVerified ? 'Verify your email and set a password to secure your account.' : 'Your account is secured with email verification.'}
        </p>
        <button
          onClick={handleAccountSecurity}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-xl text-base font-semibold transition-colors shadow-lg"
        >
          {!user.isEmailVerified ? 'Set Up Security' : 'Manage Security'}
        </button>
      </div>
      <div className="bg-slate-800/70 backdrop-blur-md border border-violet-700 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-start">
          <div className="bg-violet-500/20 p-4 rounded-2xl mr-6">
            <svg className="w-8 h-8 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 001.028.684l3.292.677c.921.192 1.583 1.086 1.285 1.975l-1.07 3.292a1 1 0 00.684 1.028l3.292.677c.921.192 1.583 1.086 1.285 1.975l-1.07 3.292a1 1 0 00-.684 1.028l-3.292.677c-.921.192-1.583 1.086-1.285 1.975L10 15.5l1.07-3.292c.298-.921 1.603-.921 1.902 0l1.07 3.292c.298.921 1.603.921 1.902 0l3.292-.677a1 1 0 00.684-1.028l1.07-3.292a1 1 0 00-1.285-1.975l-3.292-.677a1 1 0 00-1.028.684L13.257 4.001z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white text-xl font-semibold">Upgrade to Premium</h3>
            <p className="text-slate-400 text-base mt-2">
              Unlock custom domains, advanced analytics, priority support, and more.
            </p>
            <button
              onClick={handleUpgrade}
              className="mt-4 bg-gradient-to-r from-violet-600 to-blue-600 text-white px-6 py-3 rounded-xl text-base font-semibold transition-colors shadow-lg"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
// --- Other Tabs ---
const AnalyticsTab = ({ user, links }: { user: User; links: Link[] }) => (
  <div className="space-y-8">
    <div className="bg-slate-800/70 backdrop-blur-md border border-slate-700 rounded-3xl p-8 shadow-2xl">
      <h2 className="text-2xl font-bold mb-6 text-white">Profile Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900/50 p-6 rounded-2xl shadow-lg">
          <h3 className="text-slate-300 text-base font-semibold mb-2">Profile Views</h3>
          <p className="text-4xl font-bold text-white">
            {user.profileViews != null ? user.profileViews.toLocaleString() : '—'}
          </p>
        </div>
        <div className="bg-slate-900/50 p-6 rounded-2xl shadow-lg">
          <h3 className="text-slate-300 text-base font-semibold mb-2">Total Links</h3>
          <p className="text-4xl font-bold text-white">{links.length}</p>
        </div>
      </div>
    </div>
  </div>
);
const NewsTab = () => {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch('/api/news');
        const data = await res.json();
        setPosts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load news', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);
  const truncate = (str: string, len = 100) =>
    str.length > len ? str.substring(0, len) + '...' : str;
  return (
    <div className="space-y-8">
      <div className="bg-slate-800/70 backdrop-blur-md border border-slate-700 rounded-3xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-white">Latest News</h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : posts.length === 0 ? (
          <p className="text-slate-400 text-center py-8 text-lg">No news available.</p>
        ) : (
          <div className="space-y-6">
            {posts.slice(0, 5).map((post) => (
              <div key={post.id} className="border-b border-slate-700 pb-6 last:border-0 last:pb-0">
                <h3 className="text-white text-xl font-semibold">{post.title}</h3>
                <p className="text-slate-400 text-sm mt-2">
                  {new Date(post.publishedAt).toLocaleDateString()} • {post.authorName}
                </p>
                <p className="text-slate-300 mt-3 text-base">{truncate(post.content)}</p>
              </div>
            ))}
          </div>
        )}
        <a
          href="/news"
          className="mt-6 inline-block text-blue-400 hover:text-blue-300 text-base font-semibold"
        >
          View all news →
        </a>
      </div>
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
    <div className="space-y-8">
      <div className="bg-slate-800/70 backdrop-blur-md border border-slate-700 rounded-3xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-white">Profile Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-slate-300 text-base font-semibold mb-2">Your BioLink</h3>
            <a
              href={bioLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-blue-400 hover:underline break-all text-lg"
            >
              {bioLinkUrl}
            </a>
          </div>
          <div>
            <h3 className="text-slate-300 text-base font-semibold mb-2">Stats</h3>
            <div className="space-y-3 text-base">
              <div className="flex justify-between"><span className="text-slate-400">Total Links</span><span className="text-white font-semibold">{links.length}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Profile Completion</span><span className="text-white font-semibold">{completion}%</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Plan</span><span className="text-violet-400 font-semibold">{planDisplay}</span></div>
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
    <div className="bg-slate-800/70 backdrop-blur-md border border-slate-700 rounded-3xl p-8 shadow-2xl">
      <h2 className="text-2xl font-bold mb-8 text-white">Profile Settings</h2>
      <div className="space-y-6">
        <div>
          <label className="block text-base font-semibold text-slate-300 mb-3">Full Name</label>
          <input
            type="text"
            name="name"
            value={user.name}
            onChange={handleProfileChange}
            maxLength={100}
            className="w-full px-5 py-4 bg-slate-700/50 border border-slate-600 rounded-2xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="block text-base font-semibold text-slate-300 mb-3">Username</label>
          <div className="flex">
            <span className="inline-flex items-center px-5 rounded-l-2xl border border-r-0 border-slate-600 bg-slate-700/50 text-slate-400 text-lg">
              thebiolink.lol/
            </span>
            <input
              type="text"
              name="username"
              value={user.username}
              onChange={handleProfileChange}
              maxLength={30}
              className="flex-1 min-w-0 px-5 py-4 bg-slate-700/50 border border-slate-600 rounded-r-2xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              placeholder="yourname"
            />
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Letters, numbers, underscores, hyphens only (3–30 chars)
          </p>
        </div>
        <div>
          <label className="block text-base font-semibold text-slate-300 mb-3">Location (optional)</label>
          <input
            type="text"
            name="location"
            value={user.location || ''}
            onChange={handleProfileChange}
            maxLength={100}
            className="w-full px-5 py-4 bg-slate-700/50 border border-slate-600 rounded-2xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            placeholder="e.g., Los Angeles, Tokyo, Berlin"
          />
        </div>
        <div>
          <label className="block text-base font-semibold text-slate-300 mb-3">Avatar URL</label>
          <input
            type="url"
            name="avatar"
            value={user.avatar}
            onChange={handleProfileChange}
            className="w-full px-5 py-4 bg-slate-700/50 border border-slate-600 rounded-2xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            placeholder="https://example.com/avatar.jpg"
          />
        </div>
        <div>
          <label className="block text-base font-semibold text-slate-300 mb-3">Background GIF/Video URL</label>
          <input
            type="url"
            name="background"
            value={user.background}
            onChange={handleProfileChange}
            className="w-full px-5 py-4 bg-slate-700/50 border border-slate-600 rounded-2xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            placeholder="https://example.com/background.gif"
          />
          <p className="mt-3 text-sm text-slate-500">
            Supports .gif, .mp4, .webm
          </p>
        </div>
        <div>
          <label className="block text-base font-semibold text-slate-300 mb-3">Bio</label>
          <textarea
            name="bio"
            value={user.bio}
            onChange={handleProfileChange}
            maxLength={500}
            rows={4}
            className="w-full px-5 py-4 bg-slate-700/50 border border-slate-600 rounded-2xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
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
    <div className="space-y-8">
      <div className="bg-slate-800/70 backdrop-blur-md border border-slate-700 rounded-3xl p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-6">
          <h2 className="text-2xl font-bold text-white">Link Manager</h2>
          <div className="flex flex-wrap gap-3">
            <select
              value={newLinkTitle}
              onChange={(e) => setNewLinkTitle(e.target.value)}
              className="bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white text-base"
            >
              <option value="">Custom Link</option>
              {FAMOUS_LINKS.map((link, i) => (
                <option key={i} value={link.title}>{link.title}</option>
              ))}
            </select>
            <button
              onClick={addLink}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors text-base font-semibold shadow-lg"
            >
              + Add Link
            </button>
          </div>
        </div>
        <div className="space-y-6">
          {links.map((link, index) => (
            <DraggableItem key={link.id} index={index} onMove={moveLink} itemType="link">
              <div className="border border-slate-700 rounded-2xl p-6 bg-slate-700/30 shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <label className="block text-base font-semibold text-slate-300 mb-2">Title</label>
                    <input
                      type="text"
                      value={link.title}
                      onChange={(e) => handleLinkChange(index, 'title', e.target.value)}
                      maxLength={100}
                      className="w-full px-4 py-3 bg-slate-600/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-base font-semibold text-slate-300 mb-2">URL</label>
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-600/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 text-lg"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <input
                    type="text"
                    value={link.icon}
                    onChange={(e) => handleLinkChange(index, 'icon', e.target.value)}
                    className="px-4 py-3 bg-slate-600/50 border border-slate-600 rounded-xl text-base text-white placeholder-slate-400 flex-1 mr-4"
                    placeholder="Icon URL (optional)"
                  />
                  <button
                    onClick={() => removeLink(index)}
                    className="text-red-400 hover:text-red-300 font-semibold text-base"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </DraggableItem>
          ))}
          {links.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-lg">
              <p>No links added yet</p>
            </div>
          )}
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
    <div className="space-y-8">
      <div className="bg-slate-800/70 backdrop-blur-md border border-slate-700 rounded-3xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-white">Custom Widgets</h2>
        <p className="text-slate-400 mb-6 text-lg">Add embeds, media, or custom HTML to your BioLink.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {WIDGET_TYPES.map((w) => (
            <button
              key={w.id}
              onClick={() => addWidget(w.id as Widget['type'])}
              className="bg-slate-700/50 hover:bg-slate-700 p-4 rounded-2xl text-center text-white transition-shadow hover:shadow-lg"
            >
              <div className="text-3xl mb-2">{w.icon}</div>
              <div className="text-base font-semibold">{w.name}</div>
            </button>
          ))}
        </div>
        <div className="space-y-6">
          {widgets.map((widget, index) => (
            <DraggableItem key={widget.id} index={index} onMove={moveWidget} itemType="widget">
              <div className="border border-slate-700 rounded-2xl p-6 bg-slate-700/30 shadow-lg">
                <div className="font-semibold text-white text-lg mb-3 capitalize">{widget.type} Widget</div>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Widget Title"
                    value={widget.title || ''}
                    onChange={(e) => updateWidget(index, 'title', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-600/50 border border-slate-600 rounded-xl text-white text-base"
                  />
                  <input
                    type="url"
                    placeholder="Embed URL (YouTube, Spotify, etc.)"
                    value={widget.url || ''}
                    onChange={(e) => updateWidget(index, 'url', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-600/50 border border-slate-600 rounded-xl text-white text-base"
                  />
                  {widget.type === 'custom' && (
                    <textarea
                      placeholder="Paste HTML or embed code"
                      value={widget.content || ''}
                      onChange={(e) => updateWidget(index, 'content', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-600/50 border border-slate-600 rounded-xl text-white text-base font-mono"
                    />
                  )}
                </div>
                <button
                  onClick={() => removeWidget(index)}
                  className="mt-4 text-red-400 text-base"
                >
                  Remove Widget
                </button>
              </div>
            </DraggableItem>
          ))}
          {widgets.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-lg">
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
        <div className="p-4 bg-slate-700/50 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white text-base font-semibold">Spacer</span>
            <button 
              onClick={() => removeSection(section.id)}
              className="text-red-400 hover:text-red-300 text-sm"
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
          <div className="text-sm text-slate-400 mt-2">{section.height || 20}px</div>
        </div>
      );
    }
    if (section.type === 'custom') {
      return (
        <div className="p-4 bg-slate-700/50 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white text-base font-semibold">Custom HTML</span>
            <button 
              onClick={() => removeSection(section.id)}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              Remove
            </button>
          </div>
          <textarea
            value={section.content || ''}
            onChange={(e) => updateSection(section.id, { content: e.target.value })}
            placeholder="Enter custom HTML"
            className="w-full px-3 py-2 bg-slate-600/50 border border-slate-600 rounded-xl text-white text-base"
            rows={4}
          />
        </div>
      );
    }
    if (section.type === 'widget') {
      const widget = widgets.find(w => w.id === section.widgetId);
      return (
        <div className="p-4 bg-slate-700/50 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white text-base font-semibold">
              Widget: {widget?.title || 'Unknown'}
            </span>
            <button 
              onClick={() => removeSection(section.id)}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              Remove
            </button>
          </div>
          <select
            value={section.widgetId || ''}
            onChange={(e) => updateSection(section.id, { widgetId: e.target.value })}
            className="w-full bg-slate-600/50 border border-slate-600 rounded-xl text-white text-base p-3"
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
      <div className="p-4 bg-slate-700/50 rounded-2xl shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-white capitalize text-base font-semibold">{section.type}</span>
          <button 
            onClick={() => removeSection(section.id)}
            className="text-red-400 hover:text-red-300 text-sm"
          >
            Remove
          </button>
        </div>
      </div>
    );
  };
  return (
    <div className="space-y-8">
      <div className="bg-slate-800/70 backdrop-blur-md border border-slate-700 rounded-3xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-white">Profile Builder</h2>
        <p className="text-slate-400 mb-6 text-lg">Drag to reorder. Click + to add sections.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => addSection('bio')}
            className="p-4 bg-blue-600 hover:bg-blue-700 rounded-2xl text-white text-base font-semibold transition-shadow hover:shadow-lg"
          >
            📝 Bio
          </button>
          <button
            onClick={() => addSection('links')}
            className="p-4 bg-blue-600 hover:bg-blue-700 rounded-2xl text-white text-base font-semibold transition-shadow hover:shadow-lg"
          >
            🔗 Links
          </button>
          <button
            onClick={() => addSection('spacer', { height: 20 })}
            className="p-4 bg-violet-600 hover:bg-violet-700 rounded-2xl text-white text-base font-semibold transition-shadow hover:shadow-lg"
          >
            ⬇️ Spacer
          </button>
          <button
            onClick={() => addSection('custom', { content: '' })}
            className="p-4 bg-violet-600 hover:bg-violet-700 rounded-2xl text-white text-base font-semibold transition-shadow hover:shadow-lg"
          >
            ✏️ Custom
          </button>
        </div>
        {widgets.length > 0 && (
          <div className="mb-8">
            <h3 className="text-slate-300 text-base font-bold mb-3">Add Widgets</h3>
            <div className="flex flex-wrap gap-3">
              {widgets.map(widget => (
                <button
                  key={widget.id}
                  onClick={() => addSection('widget', { widgetId: widget.id })}
                  className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-base rounded-xl font-semibold transition-shadow hover:shadow-lg"
                >
                  + {widget.title || widget.type}
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <h3 className="text-slate-300 text-base font-bold mb-4">Your Layout</h3>
          <div className="space-y-4">
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
              <div className="text-slate-500 text-base py-6 text-center border-2 border-dashed border-slate-700 rounded-2xl">
                Click + buttons above to add sections
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="bg-slate-800/70 backdrop-blur-md border border-slate-700 rounded-3xl p-8 shadow-2xl">
        <h3 className="text-xl font-bold mb-6 text-white">Live Preview</h3>
        <div className="bg-slate-900/50 rounded-2xl p-8 text-center relative overflow-hidden min-h-[600px] shadow-2xl">
          {user.background && (
            <div
              className="absolute inset-0 z-0 bg-cover bg-center opacity-70"
              style={{ backgroundImage: `url(${user.background})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70 z-10"></div>
          <div className="relative z-20 space-y-8">
            {layoutStructure.map((section) => {
              if (section.type === 'bio') {
                return (
                  <div key={section.id} className="text-center">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-40 h-40 rounded-full mx-auto mb-6 border-4 border-white/30 shadow-2xl"
                      />
                    ) : (
                      <div className="w-40 h-40 bg-gradient-to-r from-blue-500 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                        <span className="text-5xl text-white font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <h3 className="text-3xl font-bold text-white mb-3">{user.name}</h3>
                    {user.location && (
                      <div className="flex items-center justify-center text-slate-200 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-base">{user.location}</span>
                      </div>
                    )}
                    {user.bio && <p className="text-slate-200 max-w-lg mx-auto text-base leading-relaxed">{user.bio}</p>}
                    {user.badges && user.badges.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-3 mt-6">
                        {user.badges.map(badge => (
                          <div key={badge.id} className="group relative">
                            <img src={badge.icon} alt={badge.name} className="w-10 h-10 rounded-full shadow-md" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 hidden group-hover:block bg-slate-800 text-white text-sm rounded py-2 px-3 whitespace-nowrap shadow-lg">
                              {badge.name}: {badge.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              if (section.type === 'links' && links.length > 0) {
                return (
                  <div key={section.id} className="space-y-4 mt-8">
                    {links
                      .filter(link => link.url && link.title)
                      .map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center w-full py-4 px-6 rounded-2xl text-base text-white backdrop-blur-md border border-white/20 hover:bg-blue-700/30 transition-all hover:shadow-xl"
                        >
                          {link.icon && <img src={link.icon} alt="" className="w-6 h-6 mr-4" />}
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
                  <div key={section.id} className="bg-white/10 rounded-2xl p-6 text-left shadow-xl">
                    {widget.title && <h4 className="text-white font-semibold text-lg mb-3">{widget.title}</h4>}
                    {widget.type === 'youtube' && widget.url ? (
                      <div className="aspect-video bg-slate-800 rounded-2xl overflow-hidden">
                        <iframe
                          src={`https://www.youtube.com/embed/${getYouTubeId(widget.url)}`}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        ></iframe>
                      </div>
                    ) : widget.type === 'spotify' && widget.url ? (
                      <div className="aspect-video bg-slate-800 rounded-2xl overflow-hidden">
                        <iframe
                          src={`https://open.spotify.com/embed/${getSpotifyId(widget.url)}`}
                          frameBorder="0"
                          allowTransparency={true}
                          allow="encrypted-media"
                          className="w-full h-full"
                        ></iframe>
                      </div>
                    ) : widget.type === 'twitter' && widget.url ? (
                      <div className="bg-slate-800 rounded-2xl p-6">
                        <a href={widget.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-base">
                          🐦 View Twitter Feed
                        </a>
                      </div>
                    ) : widget.type === 'custom' && widget.content ? (
                      <div
                        className="text-slate-300 text-base"
                        dangerouslySetInnerHTML={{ __html: widget.content }}
                      />
                    ) : (
                      <div className="text-slate-400 text-base italic">
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
                    className="bg-white/5 p-6 rounded-2xl shadow-xl"
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
const getYouTubeId = (url: string): string => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.*?v=))([^&?# ]{11})/);
  return match ? match[1] : '';
};
const getSpotifyId = (url: string): string => {
  const match = url.match(/spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/);
  return match ? `${match[1]}/${match[2]}` : '';
};
// --- Main Dashboard ---
export default function Dashboard() {
  const [user, setUser] = useState<User>({
    _id: '',
    name: '',
    username: '',
    avatar: '',
    bio: '',
    location: '',
    background: '',
    isEmailVerified: true,
    plan: 'free',
    profileViews: 0,
    badges: [],
    email: '',
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
          location: (data.user.location || '').substring(0, 100),
          background: (data.user.background || '').trim(),
          isEmailVerified: data.user.isEmailVerified ?? true,
          plan: data.user.plan || 'free',
          profileViews: data.user.profileViews || 0,
          badges: Array.isArray(data.user.badges) ? data.user.badges : [],
          email: data.user.email || '',
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
            location: user.location?.trim().substring(0, 100) || '',
            background: user.background?.trim() || '',
            plan: user.plan || 'free',
            layoutStructure,
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
  const tabs = [
    { id: 'overview', name: 'Overview', icon: '🏠' },
    { id: 'customize', name: 'Customize', icon: '🎨' },
    { id: 'builder', name: 'Profile Builder', icon: '🛠️' },
    { id: 'links', name: 'Links', icon: '🔗' },
    { id: 'widgets', name: 'Widgets', icon: '🧩' },
    { id: 'analytics', name: 'Analytics', icon: '📊' },
    { id: 'news', name: 'News', icon: '📰' },
    { id: 'badges', name: 'Badges', icon: '🏅' },
    { id: 'settings', name: 'Settings', icon: '⚙️' },
  ];
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-black">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black py-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white">Your BioLink Dashboard</h1>
              <p className="text-slate-400 mt-3 text-lg">
                Customize your bio link page at{' '}
                <a
                  href={getBioLinkUrl(user.username)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-blue-400 hover:text-blue-300 hover:underline"
                >
                  thebiolink.lol/{user.username}
                </a>
              </p>
            </div>
            <div className="flex gap-4 mt-6 sm:mt-0">
              <button
                onClick={handleLogout}
                className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-4 rounded-2xl font-semibold transition-colors border border-slate-700 shadow-lg"
              >
                Logout
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-blue-600 to-violet-600 text-white px-8 py-4 rounded-2xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-70 shadow-lg"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
        <div className="border-b border-slate-700 mb-12 overflow-x-auto">
          <nav className="flex space-x-8 pb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-3 px-2 border-b-2 font-semibold text-base flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                <span className="mr-2 text-lg">{tab.icon}</span> {tab.name}
              </button>
            ))}
          </nav>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
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
            {activeTab === 'analytics' && <AnalyticsTab user={user} links={links} />}
            {activeTab === 'news' && <NewsTab />}
            {activeTab === 'badges' && <BadgesTab user={user} />}
            {activeTab === 'settings' && <SettingsTab user={user} setUser={setUser} />}
          </div>
          <div className="lg:col-span-1">
            <div className="bg-slate-800/70 backdrop-blur-md border border-slate-700 rounded-3xl p-8 shadow-2xl sticky top-12">
              <h2 className="text-2xl font-bold mb-6 text-white">Live Preview</h2>
              <div className="bg-slate-900/50 rounded-2xl p-8 text-center relative overflow-hidden min-h-[600px] shadow-2xl">
                {user.background && (
                  <div
                    className="absolute inset-0 z-0 bg-cover bg-center opacity-70"
                    style={{ backgroundImage: `url(${user.background})` }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70 z-10"></div>
                <div className="relative z-20">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-40 h-40 rounded-full mx-auto mb-6 border-4 border-white/30 shadow-2xl"
                    />
                  ) : (
                    <div className="w-40 h-40 bg-gradient-to-r from-blue-500 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                      <span className="text-5xl text-white font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <h3 className="text-3xl font-bold text-white mb-3">{user.name}</h3>
                  {user.location && (
                    <div className="flex items-center justify-center text-slate-200 mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-base">{user.location}</span>
                    </div>
                  )}
                  {user.bio && <p className="text-slate-200 mb-6 max-w-lg mx-auto text-base leading-relaxed">{user.bio}</p>}
                  {user.badges && user.badges.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-3 mb-8">
                      {user.badges.map(badge => (
                        <div key={badge.id} className="group relative">
                          <img src={badge.icon} alt={badge.name} className="w-10 h-10 rounded-full shadow-md" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 hidden group-hover:block bg-slate-800 text-white text-sm rounded py-2 px-3 whitespace-nowrap shadow-lg">
                            {badge.name}: {badge.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="space-y-8">
                    {layoutStructure.map((section) => {
                      if (section.type === 'bio') return null;
                      if (section.type === 'links' && links.length > 0) {
                        return (
                          <div key={section.id} className="space-y-4">
                            {links
                              .filter(link => link.url && link.title)
                              .map((link, idx) => (
                                <a
                                  key={idx}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center w-full py-4 px-6 rounded-2xl text-base text-white backdrop-blur-md border border-white/20 hover:bg-blue-700/30 transition-all hover:shadow-xl"
                                >
                                  {link.icon && <img src={link.icon} alt="" className="w-6 h-6 mr-4" />}
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
                          <div key={section.id} className="bg-white/10 rounded-2xl p-6 text-left shadow-xl">
                            {widget.title && <h4 className="text-white font-semibold text-lg mb-3">{widget.title}</h4>}
                            <div className="text-slate-400 text-base italic">
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
                            className="bg-white/5 p-6 rounded-2xl shadow-xl"
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
            className={`fixed bottom-8 right-8 p-6 rounded-2xl shadow-2xl ${
              message.type === 'success'
                ? 'bg-green-900/80 text-green-200 border border-green-800'
                : 'bg-red-900/80 text-red-200 border border-red-800'
            } max-w-sm text-lg`}
          >
            {message.text}
          </div>
        )}
        {showGuidelinesModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
            <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 w-full max-w-lg shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-4">Profile Compliance Check</h3>
              <p className="text-slate-300 mb-6 text-lg">
                Please confirm your profile complies with our{' '}
                <a
                  href="https://www.thebiolink.lol/community-guidelines"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  Community Guidelines
                </a>
                .
              </p>
              <p className="text-yellow-400 text-base mb-6">
                ⚠️ Violations may result in account suspension.
              </p>
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setShowGuidelinesModal(false)}
                  className="px-6 py-3 text-slate-300 hover:text-white text-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSave}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-blue-600 to-violet-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-70 shadow-lg text-lg"
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
