// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Link {
  id: string;
  url: string;
  title: string;
  icon: string;
}

interface User {
  _id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  background: string;
  backgroundVideo: string; // ✅ Add video field
  backgroundAudio: string; // ✅ Add audio field
  isEmailVerified: boolean;
  isBanned: boolean;
  bannedAt?: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User>({
    _id: '',
    name: '',
    username: '',
    avatar: '',
    bio: '',
    background: '',
    backgroundVideo: '', // ✅ Initialize video state
    backgroundAudio: '', // ✅ Initialize audio state
    isEmailVerified: true,
    isBanned: false,
    bannedAt: ''
  });
  const [links, setLinks] = useState<Link[]>([{ id: Date.now().toString(), url: '', title: '', icon: '' }]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
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
        
        setUser({
          _id: data.user._id,
          name: data.user.name,
          username: data.user.username,
          avatar: data.user.avatar,
          bio: data.user.bio,
          background: data.user.background,
          backgroundVideo: data.user.backgroundVideo || '', // ✅ Load video
          backgroundAudio: data.user.backgroundAudio || '', // ✅ Load audio
          isEmailVerified: data.user.isEmailVerified,
          isBanned: data.user.isBanned,
          bannedAt: data.user.bannedAt
        });
        
        setLinks(data.links.length > 0 ? data.links : [{ id: Date.now().toString(), url: '', title: '', icon: '' }]);
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

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleLinkChange = (index: number, field: keyof Link, value: string) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setLinks(newLinks);
  };

  const addLink = () => {
    setLinks([...links, { id: Date.now().toString(), url: '', title: '', icon: '' }]);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/dashboard/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          profile: { 
            name: user.name.trim(), 
            username: user.username.trim().toLowerCase(), 
            avatar: user.avatar?.trim() || '', 
            bio: user.bio?.trim() || '',
            background: user.background?.trim() || '',
            backgroundVideo: user.backgroundVideo?.trim() || '', // ✅ Save video
            backgroundAudio: user.backgroundAudio?.trim() || '' // ✅ Save audio
          },
          links: links
            .filter(link => link.url?.trim() && link.title?.trim())
            .map((link, index) => ({
              id: link.id,
              url: link.url.trim(),
              title: link.title.trim(),
              icon: link.icon?.trim() || ''
            }))
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Changes saved successfully!' });
      } else {
        setMessage({ 
          type: 'error', 
          text: data.error || 'Failed to save changes' 
        });
      }
    } catch (error: any) {
      console.error('Network error:', error);
      setMessage({ 
        type: 'error', 
        text: 'Network error. Please try again.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

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
                  href={`https://thebiolink.lol/${user.username}`} 
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-4 text-white">Profile Settings</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={user.name}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      thebiolink.lol/
                    </span>
                    <input
                      type="text"
                      name="username"
                      value={user.username}
                      onChange={handleProfileChange}
                      className="flex-1 min-w-0 px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-r-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="yourname"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    This will be your public link: thebiolink.lol/{user.username}
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
                
                {/* ✅ Background GIF Input */}
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
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Only Giphy/Tenor GIFs allowed (.gif format)
                  </p>
                </div>
                
                {/* ✅ Background Video Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Background Video URL</label>
                  <input
                    type="url"
                    name="backgroundVideo"
                    value={user.backgroundVideo}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="https://example.com/.../background.mp4"
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    MP4/WebM videos only. Will autoplay muted in background.
                  </p>
                </div>
                
                {/* ✅ Background Audio Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Background Audio URL</label>
                  <input
                    type="url"
                    name="backgroundAudio"
                    value={user.backgroundAudio}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="https://example.com/.../background.mp3"
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    MP3/WAV audio only. Will autoplay muted in background.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                  <textarea
                    name="bio"
                    value={user.bio}
                    onChange={handleProfileChange}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Tell people about yourself"
                  />
                </div>
              </div>
            </div>

            {/* Links Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Link Manager</h2>
                <button
                  onClick={addLink}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  + Add Link
                </button>
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
                          className="w-full px-3 py-2 bg-gray-600/50 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                          placeholder="My Website"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">URL</label>
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600/50 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                          placeholder="https://example.com"
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
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Preview Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-4 text-white">Live Preview</h2>
              <div className="bg-gray-900/50 rounded-xl p-6 text-center relative overflow-hidden min-h-[400px]">
                {/* ✅ Display Background Media */}
                {user.backgroundVideo ? (
                  <video
                    src={user.backgroundVideo}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 z-0 w-full h-full object-cover"
                  />
                ) : user.background ? (
                  <div 
                    className="absolute inset-0 z-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${user.background})`,
                    }}
                  />
                ) : user.backgroundAudio ? (
                  <audio
                    src={user.backgroundAudio}
                    autoPlay
                    muted
                    loop
                    className="hidden"
                  />
                ) : null}
                
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
                      <span className="text-4xl text-white font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-white mb-2">{user.name}</h3>
                  {user.bio && <p className="text-gray-300 mb-4 text-sm">{user.bio}</p>}
                  
                  <div className="space-y-2">
                    {links.filter(link => link.url && link.title).map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-indigo-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-indigo-700 transition-colors"
                      >
                        {link.title}
                      </a>
                    ))}
                  </div>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
                    View live at: thebiolink.lol/{user.username}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 sticky top-64">
              <h3 className="text-lg font-semibold mb-4 text-white">Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Links</span>
                  <span className="text-white font-medium">{links.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Profile Complete</span>
                  <span className="text-white font-medium">
                    {(() => {
                      const completedFields = [
                        user.name,
                        user.username,
                        user.avatar || user.bio,
                        user.background || user.backgroundVideo || user.backgroundAudio, // ✅ Include media
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

        {/* Status Message */}
        {message && (
          <div className={`fixed bottom-6 right-6 p-4 rounded-xl ${message.type === 'success' ? 'bg-green-900/80 text-green-200 border border-green-800' : 'bg-red-900/80 text-red-200 border border-red-800'} max-w-sm`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
