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
  isEmailVerified: boolean;
}

export default function Dashboard() {
  const [user, setUser] = useState<User>({
    _id: '',
    name: '',
    username: '',
    avatar: '',
    bio: '',
    isEmailVerified: true
  });
  const [links, setLinks] = useState<Link[]>([{ id: Date.now().toString(), url: '', title: '', icon: '' }]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch('/api/dashboard/data');
        if (!res.ok) {
          router.push('/auth/login');
          return;
        }
        const data = await res.json();
        setUser(data.user);
        setLinks(data.links.length > 0 ? data.links : [{ id: Date.now().toString(), url: '', title: '', icon: '' }]);
      } catch (error) {
        console.error('Fetch error:', error);
        router.push('/auth/login');
      }
    };
    fetchUserData();
  }, [router]);

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
      const res = await fetch('/api/dashboard/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          profile: { 
            name: user.name.trim(), 
            username: user.username.trim().toLowerCase(), 
            avatar: user.avatar?.trim() || '', 
            bio: user.bio?.trim() || '' 
          },
          links: links
            .filter(link => link.url?.trim() && link.title?.trim())
            .map((link, index) => ({
              id: link.id || Date.now().toString(),
              url: link.url.trim(),
              title: link.title.trim(),
              icon: link.icon?.trim() || ''
            }))
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Changes saved successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save changes' });
      }
    } catch (error: any) {
      console.error('Save error:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your BioLink Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Customize your bio link page at{' '}
            <a 
              href={`https://thebiolink.lol/${user.username}`} 
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline"
            >
              thebiolink.lol/{user.username}
            </a>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Profile Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={user.name}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      thebiolink.lol/
                    </span>
                    <input
                      type="text"
                      name="username"
                      value={user.username}
                      onChange={handleProfileChange}
                      className="flex-1 min-w-0 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-r-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="yourname"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    This will be your public link: thebiolink.lol/{user.username}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Avatar URL</label>
                  <input
                    type="url"
                    name="avatar"
                    value={user.avatar}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                  <textarea
                    name="bio"
                    value={user.bio}
                    onChange={handleProfileChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Tell people about yourself"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Link Manager</h2>
                <button
                  onClick={addLink}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Add Link
                </button>
              </div>
              
              <div className="space-y-4">
                {links.map((link, index) => (
                  <div key={link.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                        <input
                          type="text"
                          value={link.title}
                          onChange={(e) => handleLinkChange(index, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="My Website"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL</label>
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <input
                        type="text"
                        value={link.icon}
                        onChange={(e) => handleLinkChange(index, 'icon', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Icon URL (optional)"
                      />
                      <button
                        onClick={() => removeLink(index)}
                        className="text-red-600 hover:text-red-800 font-medium dark:text-red-400 dark:hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-70"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {message && (
              <div className={`mt-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                {message.text}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Preview</h2>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-20 h-20 rounded-full mx-auto mb-4"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-white font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">{user.name}</h3>
                {user.bio && <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">{user.bio}</p>}
                
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

            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-500 p-4 mt-6 rounded-r-lg">
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                🔔 <strong>Email verification is currently disabled.</strong><br />
                Please join our Discord and ask <span className="font-mono">@theceosolace</span> to verify you:<br />
                <a 
                  href="https://discord.gg/YKjgqmNP" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 font-medium underline"
                >
                  https://discord.gg/YKjgqmNP
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
