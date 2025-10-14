// app/dashboard/page.tsx — COMPLETE REDESIGN
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ========= INTERFACES =========
interface User {
  _id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  location?: string;
  background?: string;
  theme: 'indigo' | 'purple' | 'green' | 'red' | 'halloween' | 'custom';
  customTheme?: {
    primary: string;
    background: string;
    text: string;
  };
}

interface Link {
  id: string;
  url: string;
  title: string;
  icon?: string;
}

interface Block {
  id: string;
  type: 'bio' | 'links' | 'spacer' | 'widget' | 'custom';
  height?: number;
  content?: string;
  widgetId?: string;
}

// ========= HOOKS =========
const useDebounce = (value: any, delay: number) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

// ========= COMPONENTS =========
const StudioHeader = ({ onSave, onLogout, saving }: { 
  onSave: () => void; 
  onLogout: () => void; 
  saving: boolean; 
}) => (
  <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-gray-800 py-4 px-6">
    <div className="flex items-center justify-between max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
          BioLink Studio
        </h1>
        <p className="text-gray-400 text-sm">Design your identity</p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onLogout}
          className="px-4 py-2 text-gray-300 hover:text-white rounded-lg transition-colors"
        >
          Logout
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-70"
        >
          {saving ? 'Saving...' : 'Publish'}
        </button>
      </div>
    </div>
  </header>
);

const BlockEditor = ({ block, onUpdate, onRemove }: { 
  block: Block; 
  onUpdate: (updates: Partial<Block>) => void; 
  onRemove: () => void; 
}) => {
  if (block.type === 'spacer') {
    return (
      <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-gray-300">Spacer</span>
          <button onClick={onRemove} className="text-red-400 hover:text-red-300 text-xs">Remove</button>
        </div>
        <input
          type="range"
          min="10"
          max="200"
          value={block.height || 40}
          onChange={(e) => onUpdate({ height: parseInt(e.target.value) })}
          className="w-full"
        />
        <div className="text-xs text-gray-500 mt-1">{block.height || 40}px</div>
      </div>
    );
  }

  if (block.type === 'custom') {
    return (
      <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-gray-300">Custom HTML</span>
          <button onClick={onRemove} className="text-red-400 hover:text-red-300 text-xs">Remove</button>
        </div>
        <textarea
          value={block.content || ''}
          onChange={(e) => onUpdate({ content: e.target.value })}
          placeholder="Enter custom HTML"
          className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white text-sm font-mono"
          rows={4}
        />
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-300 capitalize">{block.type}</span>
        <button onClick={onRemove} className="text-red-400 hover:text-red-300 text-xs">Remove</button>
      </div>
    </div>
  );
};

const ThemeEditor = ({ user, setUser }: { user: User; setUser: (u: User) => void }) => {
  const themes = [
    { id: 'indigo', name: 'Indigo', bg: 'from-indigo-900/30 to-purple-900/30' },
    { id: 'purple', name: 'Purple', bg: 'from-purple-900/30 to-fuchsia-900/30' },
    { id: 'green', name: 'Forest', bg: 'from-emerald-900/30 to-teal-900/30' },
    { id: 'red', name: 'Crimson', bg: 'from-rose-900/30 to-red-900/30' },
    { id: 'halloween', name: '🎃 Halloween', bg: 'from-orange-900/30 to-yellow-900/30' },
    { id: 'custom', name: 'Custom', bg: 'from-gray-800 to-gray-900' },
  ];

  return (
    <div className="bg-gray-900/50 rounded-2xl p-5 border border-gray-800">
      <h3 className="font-medium text-white mb-4">Theme</h3>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setUser({ ...user, theme: t.id as any })}
            className={`p-3 rounded-xl text-center text-sm ${
              user.theme === t.id 
                ? 'ring-2 ring-white/50 bg-white/10' 
                : 'bg-gradient-to-b ' + t.bg
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {user.theme === 'custom' && (
        <div className="space-y-3 pt-3 border-t border-gray-800">
          <div>
            <label className="text-xs text-gray-400">Primary Color</label>
            <input
              type="color"
              value={user.customTheme?.primary || '#6366f1'}
              onChange={(e) => setUser({
                ...user,
                customTheme: { ...user.customTheme, primary: e.target.value }
              })}
              className="w-full h-10 rounded bg-gray-800"
            />
          </div>
        </div>
      )}
    </div>
  );
};

const ProfileEditor = ({ user, setUser }: { user: User; setUser: (u: User) => void }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm text-gray-300 mb-2">Name</label>
      <input
        value={user.name}
        onChange={(e) => setUser({ ...user, name: e.target.value })}
        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white"
      />
    </div>
    <div>
      <label className="block text-sm text-gray-300 mb-2">Location (optional)</label>
      <input
        value={user.location || ''}
        onChange={(e) => setUser({ ...user, location: e.target.value })}
        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white"
        placeholder="Tokyo, Berlin, etc."
      />
    </div>
    <div>
      <label className="block text-sm text-gray-300 mb-2">Bio</label>
      <textarea
        value={user.bio}
        onChange={(e) => setUser({ ...user, bio: e.target.value })}
        rows={3}
        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white"
      />
    </div>
    <div>
      <label className="block text-sm text-gray-300 mb-2">Avatar URL</label>
      <input
        type="url"
        value={user.avatar}
        onChange={(e) => setUser({ ...user, avatar: e.target.value })}
        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white"
      />
    </div>
  </div>
);

const BlockPalette = ({ onAddBlock }: { onAddBlock: (type: Block['type']) => void }) => (
  <div className="bg-gray-900/50 rounded-2xl p-5 border border-gray-800">
    <h3 className="font-medium text-white mb-4">Add Section</h3>
    <div className="grid grid-cols-2 gap-3">
      {[
        { type: 'bio', label: '👤 Bio', icon: '👤' },
        { type: 'links', label: '🔗 Links', icon: '🔗' },
        { type: 'spacer', label: '↕️ Spacer', icon: '↕️' },
        { type: 'custom', label: '</> HTML', icon: '</>' },
      ].map((item) => (
        <button
          key={item.type}
          onClick={() => onAddBlock(item.type as Block['type'])}
          className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-white text-sm flex flex-col items-center"
        >
          <span className="text-lg mb-1">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  </div>
);

// ========= MAIN DASHBOARD =========
export default function Dashboard() {
  const [user, setUser] = useState<User>({
    _id: '',
    name: '',
    username: '',
    avatar: '',
    bio: '',
    location: '',
    theme: 'indigo',
    customTheme: { primary: '#6366f1', background: '#000000', text: '#ffffff' },
  });
  const [blocks, setBlocks] = useState<Block[]>([
    { id: 'bio-1', type: 'bio' },
    { id: 'spacer-1', type: 'spacer', height: 30 },
    { id: 'links-1', type: 'links' },
  ]);
  const [links, setLinks] = useState<Link[]>([]);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  // Load data
  useEffect(() => {
    // Simulate API fetch
    const mockData = {
      user: {
        _id: '1',
        name: 'Alex Morgan',
        username: 'alexm',
        avatar: '',
        bio: 'Digital artist & streamer',
        location: 'Los Angeles',
        theme: 'indigo',
      },
      blocks: [
        { id: 'bio-1', type: 'bio' },
        { id: 'spacer-1', type: 'spacer', height: 30 },
        { id: 'links-1', type: 'links' },
      ],
      links: [
        { id: '1', title: 'Instagram', url: 'https://instagram.com' },
        { id: '2', title: 'Twitch', url: 'https://twitch.tv' },
      ],
    };
    setUser(mockData.user as User);
    setBlocks(mockData.blocks);
    setLinks(mockData.links);
  }, []);

  const addBlock = (type: Block['type']) => {
    const newBlock: Block = {
      id: `${type}-${Date.now()}`,
      type,
      ...(type === 'spacer' && { height: 40 }),
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const moveBlock = (from: number, to: number) => {
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(from, 1);
    newBlocks.splice(to, 0, moved);
    setBlocks(newBlocks);
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    alert('Published!');
  };

  const handleLogout = () => {
    router.push('/auth/login');
  };

  // ========= RENDER =========
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <StudioHeader onSave={handleSave} onLogout={handleLogout} saving={saving} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: EDITORS */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-900/50 rounded-2xl p-5 border border-gray-800">
              <h2 className="font-bold text-xl mb-4">Profile</h2>
              <ProfileEditor user={user} setUser={setUser} />
            </div>

            <ThemeEditor user={user} setUser={setUser} />
            <BlockPalette onAddBlock={addBlock} />

            {/* Future: Link Manager, Widgets, etc. */}
          </div>

          {/* RIGHT: LIVE PREVIEW + BLOCK EDITOR */}
          <div className="lg:col-span-2 space-y-8">
            {/* PREVIEW */}
            <div className="bg-gray-900/50 rounded-2xl p-5 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-xl">Preview</h2>
                <span className="text-xs text-gray-400">Mobile View</span>
              </div>
              <div className="bg-black rounded-2xl p-6 max-w-md mx-auto border border-gray-800">
                {/* SIMULATED PROFILE PAGE */}
                {blocks.map((block, idx) => {
                  if (block.type === 'bio') {
                    return (
                      <div key={block.id} className="text-center mb-6">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full mx-auto mb-3" />
                        ) : (
                          <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-xl font-bold">{user.name.charAt(0)}</span>
                          </div>
                        )}
                        <h3 className="text-xl font-bold">{user.name}</h3>
                        {user.location && (
                          <div className="text-gray-300 text-sm flex items-center justify-center gap-1 mt-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
                            {user.location}
                          </div>
                        )}
                        {user.bio && <p className="text-gray-300 text-sm mt-2 px-4">{user.bio}</p>}
                      </div>
                    );
                  }
                  if (block.type === 'links' && links.length > 0) {
                    return (
                      <div key={block.id} className="space-y-3 mb-6">
                        {links.map(link => (
                          <a
                            key={link.id}
                            href={link.url}
                            className="block w-full py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-center text-sm transition-colors"
                          >
                            {link.title}
                          </a>
                        ))}
                      </div>
                    );
                  }
                  if (block.type === 'spacer') {
                    return <div key={block.id} style={{ height: `${block.height}px` }} />;
                  }
                  return null;
                })}
              </div>
            </div>

            {/* BLOCK EDITOR */}
            <div className="bg-gray-900/50 rounded-2xl p-5 border border-gray-800">
              <h2 className="font-bold text-xl mb-4">Layout</h2>
              <p className="text-gray-400 text-sm mb-4">Drag to reorder sections</p>
              <div className="space-y-4">
                {blocks.map((block, index) => (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('blockIndex', index.toString())}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const from = parseInt(e.dataTransfer.getData('blockIndex'));
                      if (!isNaN(from) && from !== index) moveBlock(from, index);
                    }}
                    className="cursor-move"
                  >
                    <BlockEditor
                      block={block}
                      onUpdate={(updates) => updateBlock(block.id, updates)}
                      onRemove={() => removeBlock(block.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
