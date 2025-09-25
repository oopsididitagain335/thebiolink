'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cookies } from 'next/headers';

// Types
interface Link {
  id: string;
  url: string;
  title: string;
  icon?: string;
}

interface User {
  _id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  isEmailVerified: boolean;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  // Fetch user data on mount
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
        setLinks(data.links || []);
      } catch (error) {
        router.push('/auth/login');
      }
    };
    fetchUserData();
  }, [router]);

  // Handle profile updates
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!user) return;
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  // Handle link updates
  const handleLinkChange = (index: number, field: keyof Link, value: string) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setLinks(newLinks);
  };

  // Add new link
  const addLink = () => {
    setLinks([...links, { id: Date.now().toString(), url: '', title: '', icon: '' }]);
  };

  // Remove link
  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  // Save all changes
  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    setMessage(null);
    
    try {
      const res = await fetch('/api/dashboard/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          profile: { 
            name: user.name, 
            username: user.username, 
            avatar: user.avatar, 
            bio: user.bio 
          },
          links 
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Changes saved successfully!' });
        // Update URL if username changed
        if (data.newUrl) {
          window.history.replaceState({}, '', data.newUrl);
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save changes' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your BioLink Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Customize your bio link page at{' '}
            <a 
              href={`https://thebiolink.lol/${user.username}`} 
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-indigo-600 hover:underline"
            >
              thebiolink.lol/{user.username}
            </a>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Section */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Form */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={user.name}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                      thebiolink.lol/
                    </span>
                    <input
                      type="text"
                      name="username"
                      value={user.username}
                      onChange={handleProfileChange}
                      className="flex-1 min-w-0 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="yourname"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    This will be your public link: thebiolink.lol/{user.username}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Avatar URL (optional)
                  </label>
                  <input
                    type="url"
                    name="avatar"
                    value={user.avatar || ''}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio (optional)
                  </label>
                  <textarea
                    name="bio"
                    value={user.bio || ''}
                    onChange={handleProfileChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Tell people about yourself"
                  />
                </div>
              </div>
            </div>

            {/* Links Manager */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Link Manager</h2>
                <button
                  onClick={addLink}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Add Link
                </button>
              </div>
              
              <div className="space-y-4">
                {links.map((link, index) => (
                  <div key={link.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={link.title}
                          onChange={(e) => handleLinkChange(index, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="My Website"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          URL
                        </label>
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <input
                        type="text"
                        value={link.icon || ''}
                        onChange={(e) => handleLinkChange(index, 'icon', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Icon URL (optional)"
                      />
                      <button
                        onClick={() => removeLink(index)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                
                {links.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No links added yet. Click "Add Link" to get started.
                  </p>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-70"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {/* Status Message */}
            {message && (
              <div className={`mt-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            
