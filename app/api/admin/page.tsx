// app/admin/page.tsx
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
  plan?: string;
  links?: Array<{
    id: string;
    url: string;
    title: string;
    icon?: string;
  }>;
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
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Password reset modal
  const [passwordModal, setPasswordModal] = useState<{ userId: string; username: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

        // Fetch links for each user
        const usersWithLinks = await Promise.all(
          usersData.map(async (user: any) => {
            const linksRes = await fetch(`/api/profile/${user.username}/links`);
            const links = linksRes.ok ? await linksRes.json() : [];
            return { ...user, links };
          })
        );

        setUsers(usersWithLinks);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- All handlers preserved ---
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
    <div className="min-h-screen bg-gray-900 text-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400 mt-1">Manage users, badges, links, and announcements</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center px-4 py-2 border border-gray-700 rounded-md text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700"
          >
            ← Back to Dashboard
          </button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-md border ${message.type === 'success' ? 'bg-green-900/30 text-green-300 border-green-800' : 'bg-red-900/30 text-red-300 border-red-800'}`}>
            {message.text}
          </div>
        )}

        {/* News */}
        <section className="mb-10 bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Post Announcement</h2>
          <div className="space-y-4">
            <input
              type="text"
              value={newsForm.title}
              onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
              placeholder="Title"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
            />
            <input
              type="url"
              value={newsForm.imageUrl}
              onChange={(e) => setNewsForm({ ...newsForm, imageUrl: e.target.value })}
              placeholder="Image URL (optional)"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
            />
            <textarea
              value={newsForm.content}
              onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
              rows={4}
              placeholder="Content"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 font-mono"
            />
            <button onClick={handlePostNews} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded font-medium">
              Publish
            </button>
          </div>
        </section>

        {/* Admin Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Create Badge */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Create Badge</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={newBadge.name}
                onChange={(e) => setNewBadge({ ...newBadge, name: e.target.value })}
                placeholder="Badge name"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
              />
              <input
                type="url"
                value={newBadge.icon}
                onChange={(e) => setNewBadge({ ...newBadge, icon: e.target.value })}
                placeholder="Icon URL"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
              />
              <button onClick={handleCreateBadge} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded font-medium">
                Create Badge
              </button>
            </div>
          </div>

          {/* Assign Badge */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Assign Badge</h2>
            <div className="space-y-4">
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="">Select user</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
              <select
                value={selectedBadge}
                onChange={(e) => setSelectedBadge(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="">Select badge</option>
                {badges.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <button onClick={handleAddBadge} className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded font-medium">
                Assign Badge
              </button>
            </div>
          </div>
        </div>

        {/* Users */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4">Users ({users.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {users.map(user => (
              <div key={user.id} className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-white">{user.name}</h3>
                    <p className="text-sm text-gray-400">@{user.username}</p>
                    {user.isBanned && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs bg-red-900/50 text-red-300">
                        Banned
                      </span>
                    )}
                  </div>
                </div>

                {/* Links */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Links ({user.links?.length || 0})</h4>
                  {user.links?.length ? (
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {user.links.map(link => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-300 hover:text-blue-200 block truncate"
                        >
                          {link.title || link.url}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No links</p>
                  )}
                </div>

                {/* Badges */}
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Badges ({user.badges.length})</h4>
                  {user.badges.length ? (
                    <div className="flex flex-wrap gap-1">
                      {user.badges.map(badge => (
                        <div key={badge.id} className="flex items-center bg-gray-700/50 rounded px-2 py-1 text-xs">
                          <img src={badge.icon} alt={badge.name} className="w-4 h-4 mr-1" />
                          <span className="text-gray-200">{badge.name}</span>
                          <button
                            onClick={() => handleRemoveBadge(user.id, badge.id)}
                            className="ml-1 text-red-400 hover:text-red-300"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No badges</p>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-5 pt-4 border-t border-gray-700 space-y-2">
                  <button
                    onClick={() => handleBanUser(user.id, user.isBanned ? 'unban' : 'ban')}
                    className={`w-full py-2 text-sm rounded ${
                      user.isBanned
                        ? 'bg-green-900/30 text-green-300 hover:bg-green-900/50'
                        : 'bg-red-900/30 text-red-300 hover:bg-red-900/50'
                    }`}
                  >
                    {user.isBanned ? 'Unban User' : 'Ban User'}
                  </button>
                  <button
                    onClick={() => setPasswordModal({ userId: user.id, username: user.username })}
                    className="w-full py-2 text-sm bg-amber-900/30 text-amber-300 rounded hover:bg-amber-900/50"
                  >
                    Set New Password
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Badges Gallery */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">Badges ({badges.length})</h2>
          {badges.length ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {badges.map(badge => (
                <div key={badge.id} className="bg-gray-800 rounded-lg border border-gray-700 p-4 text-center">
                  <img src={badge.icon} alt={badge.name} className="w-12 h-12 mx-auto mb-2 object-contain" />
                  <p className="text-sm text-gray-200">{badge.name}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No badges</p>
          )}
        </section>
      </div>

      {/* Password Modal */}
      {passwordModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Set Password for @{passwordModal.username}
            </h3>
            <div className="space-y-4">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={async () => {
                  if (newPassword !== confirmPassword) {
                    setMessage({ type: 'error', text: 'Passwords do not match' });
                    return;
                  }
                  if (newPassword.length < 8) {
                    setMessage({ type: 'error', text: 'Password must be ≥8 chars' });
                    return;
                  }
                  const res = await fetch('/api/admin/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: passwordModal.userId, newPassword }),
                  });
                  if (res.ok) {
                    setMessage({ type: 'success', text: 'Password updated!' });
                    setPasswordModal(null);
                    setNewPassword('');
                    setConfirmPassword('');
                  } else {
                    const d = await res.json();
                    setMessage({ type: 'error', text: d.error || 'Failed' });
                  }
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setPasswordModal(null);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
