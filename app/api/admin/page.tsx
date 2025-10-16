'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  badges: Array<{
    id: string;
    name: string;
    icon: string;
    awardedAt: string;
  }>;
  isBanned: boolean;
  bannedAt?: string;
  plan?: string;
}

interface Badge {
  id: string;
  name: string;
  icon: string;
}

interface NewsPost {
  id: string;
  title: string;
  content: string;
  authorName: string;
  publishedAt: string;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [newsPosts, setNewsPosts] = useState<NewsPost[]>([]);
  const [newBadge, setNewBadge] = useState({ name: '', icon: '' });
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedBadge, setSelectedBadge] = useState<string>('');
  const [newsForm, setNewsForm] = useState({ title: '', content: '', imageUrl: '' });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersRes, badgesRes, newsRes] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/badges'),
          fetch('/api/news')
        ]);

        if (!usersRes.ok || !badgesRes.ok) {
          router.push('/dashboard');
          return;
        }

        const usersData = await usersRes.json();
        const badgesData = await badgesRes.json();
        const newsData = await newsRes.json();

        if (!Array.isArray(usersData) || !Array.isArray(badgesData)) {
          router.push('/dashboard');
          return;
        }

        setUsers(usersData);
        setBadges(badgesData);
        setNewsPosts(Array.isArray(newsData) ? newsData : []);
      } catch (error) {
        console.error('Fetch error:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleCreateBadge = async () => {
    if (!newBadge.name.trim() || !newBadge.icon.trim()) {
      setMessage({ type: 'error', text: 'Badge name and icon URL are required.' });
      return;
    }

    try {
      const res = await fetch('/api/admin/badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBadge)
      });

      const data = await res.json();

      if (res.ok && data.id) {
        setBadges([...badges, data]);
        setNewBadge({ name: '', icon: '' });
        setMessage({ type: 'success', text: 'Badge created successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create badge.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
  };

  const handleAddBadge = async () => {
    if (!selectedUser || !selectedBadge) {
      setMessage({ type: 'error', text: 'Please select both a user and a badge.' });
      return;
    }

    const badgeToAdd = badges.find(b => b.id === selectedBadge);
    if (!badgeToAdd) {
      setMessage({ type: 'error', text: 'Selected badge not found.' });
      return;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser,
          badge: badgeToAdd
        })
      });

      const data = await res.json();

      if (res.ok) {
        setUsers(users.map(user =>
          user.id === selectedUser
            ? { ...user, badges: [...user.badges, { ...badgeToAdd, awardedAt: new Date().toISOString() }] }
            : user
        ));
        setSelectedUser('');
        setSelectedBadge('');
        setMessage({ type: 'success', text: 'Badge assigned successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to assign badge.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
  };

  const handleRemoveBadge = async (userId: string, badgeId: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, badgeId })
      });

      const data = await res.json();

      if (res.ok) {
        setUsers(users.map(user =>
          user.id === userId
            ? { ...user, badges: user.badges.filter(b => b.id !== badgeId) }
            : user
        ));
        setMessage({ type: 'success', text: 'Badge removed successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to remove badge.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
  };

  const handleBanUser = async (userId: string, action: 'ban' | 'unban') => {
    try {
      const res = await fetch('/api/admin/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      });

      const data = await res.json();

      if (res.ok) {
        setUsers(users.map(user =>
          user.id === userId
            ? { ...user, isBanned: action === 'ban' }
            : user
        ));
        setMessage({ type: 'success', text: `User ${action === 'ban' ? 'banned' : 'unbanned'} successfully!` });
      } else {
        setMessage({ type: 'error', text: data.error || `Failed to ${action} user.` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
  };

  const handlePostNews = async () => {
    if (!newsForm.title.trim() || !newsForm.content.trim()) {
      setMessage({ type: 'error', text: 'Title and content are required.' });
      return;
    }

    try {
      const res = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newsForm)
      });

      const data = await res.json();

      if (res.ok) {
        setNewsPosts([data, ...newsPosts]);
        setNewsForm({ title: '', content: '', imageUrl: '' });
        setMessage({ type: 'success', text: 'News post published successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to publish news.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage users, badges, and site announcements</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Global Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-md border ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border-green-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* News Section */}
        <section className="mb-10 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Post Announcement</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="news-title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                id="news-title"
                type="text"
                value={newsForm.title}
                onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., New Feature Launch"
              />
            </div>
            <div>
              <label htmlFor="news-image" className="block text-sm font-medium text-gray-700 mb-1">
                Image URL (optional)
              </label>
              <input
                id="news-image"
                type="url"
                value={newsForm.imageUrl}
                onChange={(e) => setNewsForm({ ...newsForm, imageUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <label htmlFor="news-content" className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                id="news-content"
                value={newsForm.content}
                onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="Write your announcement..."
              />
            </div>
            <button
              onClick={handlePostNews}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-md font-medium transition-colors"
            >
              Publish Announcement
            </button>
          </div>
        </section>

        {/* Two-Column Admin Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Create Badge */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Badge</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="badge-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Badge Name
                </label>
                <input
                  id="badge-name"
                  type="text"
                  value={newBadge.name}
                  onChange={(e) => setNewBadge({ ...newBadge, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Early Adopter"
                />
              </div>
              <div>
                <label htmlFor="badge-icon" className="block text-sm font-medium text-gray-700 mb-1">
                  Icon URL
                </label>
                <input
                  id="badge-icon"
                  type="url"
                  value={newBadge.icon}
                  onChange={(e) => setNewBadge({ ...newBadge, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/badge.png"
                />
              </div>
              <button
                onClick={handleCreateBadge}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-md font-medium transition-colors"
              >
                Create Badge
              </button>
            </div>
          </div>

          {/* Assign Badge */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Assign Badge to User</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="select-user" className="block text-sm font-medium text-gray-700 mb-1">
                  Select User
                </label>
                <select
                  id="select-user"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">— Choose a user —</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="select-badge" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Badge
                </label>
                <select
                  id="select-badge"
                  value={selectedBadge}
                  onChange={(e) => setSelectedBadge(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">— Choose a badge —</option>
                  {badges.map((badge) => (
                    <option key={badge.id} value={badge.id}>
                      {badge.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleAddBadge}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-md font-medium transition-colors"
              >
                Assign Badge
              </button>
            </div>
          </div>
        </div>

        {/* Users List */}
        <section className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">All Users ({users.length})</h2>
          </div>
          {users.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-600 truncate">{user.email}</p>
                      {user.isBanned && (
                        <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Banned
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Badges ({user.badges.length})</h4>
                    {user.badges.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {user.badges.map((badge) => (
                          <div
                            key={badge.id}
                            className="flex items-center bg-gray-100 rounded px-2 py-1 text-xs"
                          >
                            <img
                              src={badge.icon}
                              alt={badge.name}
                              className="w-4 h-4 mr-1 rounded-sm"
                            />
                            <span className="text-gray-700">{badge.name}</span>
                            <button
                              onClick={() => handleRemoveBadge(user.id, badge.id)}
                              className="ml-1 text-red-500 hover:text-red-700"
                              aria-label={`Remove ${badge.name} badge`}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No badges assigned</p>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleBanUser(user.id, user.isBanned ? 'unban' : 'ban')}
                      className={`w-full py-2 text-sm font-medium rounded-md ${
                        user.isBanned
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {user.isBanned ? 'Unban User' : 'Ban User'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-500">No users found.</p>
            </div>
          )}
        </section>

        {/* Badges Gallery */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">All Badges ({badges.length})</h2>
          {badges.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 text-center"
                >
                  <img
                    src={badge.icon}
                    alt={badge.name}
                    className="w-12 h-12 mx-auto mb-2 object-contain"
                  />
                  <p className="text-sm font-medium text-gray-900">{badge.name}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-500">No badges created yet.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
