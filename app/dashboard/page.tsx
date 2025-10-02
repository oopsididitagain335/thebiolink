'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Types
interface Link {
  id: string;
  url: string;
  title: string;
  icon: string;
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

// Famous links
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

const isValidUsername = (username: string): boolean => {
  return /^[a-zA-Z0-9_-]{3,30}$/.test(username);
};

const getBioLinkUrl = (username: string): string => {
  if (!isValidUsername(username)) {
    return 'https://thebiolink.lol/';
  }
  return `https://thebiolink.lol/${encodeURIComponent(username)}`;
};

const sanitizeDisplayText = (text: string): string => {
  return text.trim().replace(/[<>'"&]/g, '');
};

// Drag-and-Drop Item Type
const ITEM_TYPE = 'LINK_ITEM';

// Draggable Link Item Component
const DraggableLinkItem = ({ 
  link, 
  index, 
  onMove, 
  onChange, 
  onRemove 
}: { 
  link: Link; 
  index: number; 
  onMove: (from: number, to: number) => void; 
  onChange: (index: number, field: keyof Link, value: string) => void;
  onRemove: (index: number) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ITEM_TYPE,
    hover(item: { index: number }, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      
      if (dragIndex === hoverIndex) return;
      
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;
      
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
      
      onMove(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  return (
    <div 
      ref={ref}
      className={`border border-gray-700 rounded-xl p-4 bg-gray-700/30 mb-3 transition-opacity ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
          <input
            type="text"
            value={link.title}
            onChange={(e) => onChange(index, 'title', e.target.value)}
            maxLength={100}
            className="w-full px-3 py-2 bg-gray-600/50 border border-gray-600 rounded-lg text-white placeholder-gray-400"
            placeholder="My Website"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">URL</label>
          <input
            type="url"
            value={link.url}
            onChange={(e) => onChange(index, 'url', e.target.value)}
            className="w-full px-3 py-2 bg-gray-600/50 border border-gray-600 rounded-lg text-white placeholder-gray-400"
            placeholder="https://example.com"
          />
        </div>
      </div>
      <div className="flex justify-between items-center">
        <input
          type="text"
          value={link.icon}
          onChange={(e) => onChange(index, 'icon', e.target.value)}
          className="px-3 py-2 bg-gray-600/50 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 flex-1 mr-3"
          placeholder="Icon URL (optional)"
        />
        <button
          onClick={() => onRemove(index)}
          className="text-red-400 hover:text-red-300 font-medium"
        >
          Remove
        </button>
      </div>
    </div>
  );
};

// Tab Content Components
const OverviewTab = ({ user, links }: { user: User; links: Link[] }) => {
  const bioLinkUrl = getBioLinkUrl(user.username);
  const displayUsername = sanitizeDisplayText(user.username);
  
  return (
    <div className="space-y-6">
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Profile Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">Profile URL</h3>
            <a
              href={bioLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-indigo-400 hover:text-indigo-300 hover:underline break-all"
            >
              {bioLinkUrl}
            </a>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">Profile Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Links</span>
                <span className="text-white font-medium">{links.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Profile Completion</span>
                <span className="text-white font-medium">
                  {(() => {
                    const completedFields = [
                      user.name,
                      user.username,
                      user.avatar || user.bio,
                      user.background,
                    ].filter(Boolean).length;
                    const totalFields = 4;
                    return `${Math.round((completedFields / totalFields) * 100)}%`;
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Subscription</h2>
        {user.plan && user.plan !== 'free' ? (
          <div>
            <p className="text-gray-300 mb-4">
              You're on the{' '}
              <span className="font-bold text-purple-400">
                {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
              </span>{' '}
              plan.
            </p>
            <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium transition-colors">
              Cancel Subscription
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-400 mb-4">You're on the Free plan</p>
            <button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity">
              Upgrade Plan
            </button>
          </div>
        )}
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
          <label className="block text-sm font-medium text-gray-300 mb-2">Background GIF URL</label>
          <input
            type="url"
            name="background"
            value={user.background}
            onChange={handleProfileChange}
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="https://media.giphy.com/.../background.gif"
          />
          <p className="mt-2 text-xs text-gray-500">
            Only Giphy/Tenor GIFs allowed (.gif format)
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

const LinksTab = ({ 
  links, 
  setLinks 
}: { 
  links: Link[]; 
  setLinks: (links: Link[]) => void; 
}) => {
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
        ? { 
            ...link, 
            [field]: field === 'url' && value && !value.match(/^https?:\/\//i) 
              ? 'https://' + value.replace(/^(https?:\/\/)?/i, '') 
              : value 
          } 
        : link
    ));
  };
  
  const addLink = () => {
    if (newLinkTitle) {
      const preset = FAMOUS_LINKS.find(l => l.title === newLinkTitle);
      setLinks([
        ...links,
        {
          id: Date.now().toString(),
          url: '',
          title: newLinkTitle,
          icon: preset?.icon || '',
          position: links.length,
        }
      ]);
      setNewLinkTitle('');
    } else {
      setLinks([
        ...links,
        { id: Date.now().toString(), url: '', title: '', icon: '', position: links.length },
      ]);
    }
  };
  
  const addFamousLink = (preset: (typeof FAMOUS_LINKS)[0]) => {
    setLinks([
      ...links,
      {
        id: Date.now().toString(),
        url: '',
        title: preset.title,
        icon: preset.icon,
        position: links.length,
      },
    ]);
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
              className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white"
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
            <button
              onClick={() => FAMOUS_LINKS.forEach(addFamousLink)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              Add All Famous Links
            </button>
          </div>
        </div>

        <DndProvider backend={HTML5Backend}>
          <div className="space-y-4">
            {links.map((link, index) => (
              <DraggableLinkItem
                key={link.id}
                link={link}
                index={index}
                onMove={moveLink}
                onChange={handleLinkChange}
                onRemove={removeLink}
              />
            ))}

            {links.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto mb-4 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a2 2 0 00-2.828 0l-6 6a2 2 0 002.828 2.828l6-6a2 2 0 000-2.828z"
                  />
                </svg>
                <p>No links added yet</p>
              </div>
            )}
          </div>
        </DndProvider>
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
              <span className="text-white">Discord</span>
            </div>
            <p className="text-gray-400 text-sm mt-2">Coming Soon</p>
          </div>
          <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600">
            <div className="flex items-center">
              <img 
                src="https://cdn-icons-png.flaticon.com/512/174/174855.png" 
                alt="Instagram" 
                className="w-8 h-8 mr-3"
              />
              <span className="text-white">Instagram</span>
            </div>
            <button className="mt-2 text-indigo-400 text-sm">Connect</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AppearanceTab = () => {
  const [theme, setTheme] = useState('dark');
  const [buttonStyle, setButtonStyle] = useState('rounded');
  const [font, setFont] = useState('sans');
  
  return (
    <div className="space-y-6">
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-6 text-white">Theme & Colors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-300 mb-3">Theme</h3>
            <div className="flex space-x-4">
              {['dark', 'light', 'gradient'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`px-4 py-2 rounded-lg ${
                    theme === t 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-300 mb-3">Accent Color</h3>
            <div className="flex space-x-2">
              {['indigo', 'purple', 'blue', 'green', 'red'].map((color) => (
                <div
                  key={color}
                  className={`w-8 h-8 rounded-full cursor-pointer border-2 ${
                    color === 'indigo' ? 'border-indigo-500' :
                    color === 'purple' ? 'border-purple-500' :
                    color === 'blue' ? 'border-blue-500' :
                    color === 'green' ? 'border-green-500' : 'border-red-500'
                  }`}
                  style={{
                    backgroundColor: 
                      color === 'indigo' ? '#6366f1' :
                      color === 'purple' ? '#a855f7' :
                      color === 'blue' ? '#3b82f6' :
                      color === 'green' ? '#10b981' : '#ef4444'
                  }}
                  onClick={() => console.log(`Set accent to ${color}`)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-6 text-white">Layout & Typography</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-300 mb-3">Button Style</h3>
            <div className="flex space-x-4">
              {['rounded', 'square', 'pill'].map((style) => (
                <button
                  key={style}
                  onClick={() => setButtonStyle(style)}
                  className={`px-4 py-2 ${
                    buttonStyle === style 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-700 text-gray-300'
                  }`}
                  style={{
                    borderRadius: 
                      style === 'rounded' ? '0.5rem' :
                      style === 'square' ? '0' : '9999px'
                  }}
                >
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-300 mb-3">Font Family</h3>
            <select
              value={font}
              onChange={(e) => setFont(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="sans">Sans Serif</option>
              <option value="serif">Serif</option>
              <option value="mono">Monospace</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

const ComingSoonTab = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="text-5xl mb-4">🚧</div>
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-gray-400">This feature is coming soon!</p>
    </div>
  </div>
);

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
          if (res.status === 401) {
            console.warn('Unauthorized, redirecting to login.');
          }
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
          plan: data.user.plan || 'free',
        });

        const fetchedLinks = Array.isArray(data.links) ? data.links : [];
        const sortedLinks = [...fetchedLinks].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        setLinks(
          sortedLinks.length > 0
            ? sortedLinks.map((link: any) => ({
                id: link.id || Date.now().toString() + Math.random(),
                url: (link.url || '').trim(),
                title: (link.title || '').substring(0, 100),
                icon: (link.icon || '').trim(),
                position: link.position ?? 0,
              }))
            : []
        );
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
          },
          links: linksToSend,
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
    { id: 'appearance', name: 'Appearance' },
    { id: 'links', name: 'Links' },
    { id: 'badges', name: 'Badges' },
    { id: 'widgets', name: 'Widgets' },
    { id: 'tracks', name: 'Tracks' },
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
    <DndProvider backend={HTML5Backend}>
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
                    thebiolink.lol/{sanitizeDisplayText(user.username)}
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
          <div className="border-b border-gray-700 mb-8">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-white'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mb-8">
            {activeTab === 'overview' && <OverviewTab user={user} links={links} />}
            {activeTab === 'customize' && <CustomizeTab user={user} setUser={setUser} />}
            {activeTab === 'appearance' && <AppearanceTab />}
            {activeTab === 'links' && <LinksTab links={links} setLinks={setLinks} />}
            {['badges', 'widgets', 'tracks', 'manage', 'settings'].includes(activeTab) && (
              <ComingSoonTab title={`${tab.name} Tab`} />
            )}
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
                  Before saving, please confirm that your profile and links comply with our{' '}
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
                  ⚠️ Violations may result in account suspension or removal without notice.
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
                    {isSaving ? 'Saving...' : 'I Comply – Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
}
