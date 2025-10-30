// app/admin/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
  imageUrl?: string;
  authorName: string;
  publishedAt: string;
}

export default function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // Check login status on mount
  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    if (auth === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const envUser = process.env.NEXT_PUBLIC_ADMIN_USER;
    const envPass = process.env.NEXT_PUBLIC_ADMIN_PASS;

    if (!envUser || !envPass) {
      setLoginError('Admin credentials not configured in .env.local');
      return;
    }

    if (loginForm.username === envUser && loginForm.password === envPass) {
      localStorage.setItem('admin_auth', 'true');
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Invalid username or password');
      setLoginForm({ username: '', password: '' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    setIsLoggedIn(false);
  };

  // 🔐 Gate: Show login if not authenticated
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950">
        <div className="w-full max-w-md p-8 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 shadow-xl">
          <h1 className="text-2xl font-bold text-center text-white mb-2">Admin Login</h1>
          <p className="text-gray-400 text-center mb-6">Enter your admin credentials</p>

          {loginError && (
            <div className="mb-4 p-3 bg-red-900/30 text-red-300 rounded-lg text-sm border border-red-800/50">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              placeholder="Username"
              className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              placeholder="Password"
              className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2.5 rounded-lg font-medium transition-all shadow-md"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 👇 Rest of your original component (only shown when logged in)
  const [users, setUsers] = useState<User[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [newsPosts, setNewsPosts] = useState<NewsPost[]>([]);
  const [newBadge, setNewBadge] = useState({ name: '', icon: '' });
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedBadge, setSelectedBadge] = useState<string>('');
  const [newsForm, setNewsForm] = useState({ id: '', title: '', content: '', imageUrl: '' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', username: '', email: '' });
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const [passwordModal, setPasswordModal] = useState<{ userId: string; username: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [editingNews, setEditingNews] = useState<NewsPost | null>(null);

  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, badgesRes, newsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/badges'),
        fetch('/api/news')
      ]);

      if (!usersRes.ok || !badgesRes.ok) {
        setMessage({ type: 'error', text: 'Unauthorized access' });
        setTimeout(() => router.push('/dashboard'), 1500);
        return;
      }

      const usersData = await usersRes.json();
      const badgesData = await badgesRes.json();
      const newsData = await newsRes.json();

      if (!Array.isArray(usersData) || !Array.isArray(badgesData)) {
        throw new Error('Invalid data format');
      }

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
      setMessage({ type: 'error', text: 'Failed to load admin data' });
      setTimeout(() => router.push('/dashboard'), 2000);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(user =>
      (user.name && user.name.toLowerCase().includes(q)) ||
      (user.username && user.username.toLowerCase().includes(q)) ||
      (user.email && user.email.toLowerCase().includes(q))
    );
  }, [users, searchQuery]);

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
      const url = newsForm.id ? `/api/news/${newsForm.id}` : '/api/news';
      const method = newsForm.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newsForm)
      });

      const data = await res.json();

      if (res.ok) {
        if (newsForm.id) {
          setNewsPosts(newsPosts.map(n => n.id === newsForm.id ? data : n));
        } else {
          setNewsPosts([data, ...newsPosts]);
        }
        setNewsForm({ id: '', title: '', content: '', imageUrl: '' });
        setMessage({ type: 'success', text: 'News post published successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to publish news.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm('Are you sure you want to delete this news post?')) return;

    try {
      const res = await fetch(`/api/news/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNewsPosts(newsPosts.filter(n => n.id !== id));
        setMessage({ type: 'success', text: 'News post deleted!' });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to delete.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error.' });
    }
  };

  const handleEditNews = (post: NewsPost) => {
    setNewsForm({ id: post.id, title: post.title, content: post.content, imageUrl: post.imageUrl || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({ name: user.name, username: user.username, email: user.email });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...updated } : u));
        setEditingUser(null);
        setMessage({ type: 'success', text: 'User updated!' });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Update failed.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error.' });
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUserId || !confirm('Permanently delete this user? This cannot be undone.')) {
      setDeletingUserId(null);
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${deletingUserId}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== deletingUserId));
        setDeletingUserId(null);
        setMessage({ type: 'success', text: 'User deleted!' });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Deletion failed.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error.' });
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }
    if (!passwordModal) return;

    try {
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
        setMessage({ type: 'error', text: d.error || 'Failed to reset password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  const handleDeleteBadge = async (badgeId: string) => {
    if (!confirm('Delete this badge? It will be removed from all users.')) return;
    try {
      const res = await fetch(`/api/admin/badges/${badgeId}`, { method: 'DELETE' });
      if (res.ok) {
        setBadges(badges.filter(b => b.id !== badgeId));
        setUsers(users.map(u => ({
          ...u,
          badges: u.badges.filter(b => b.id !== badgeId)
        })));
        setMessage({ type: 'success', text: 'Badge deleted!' });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to delete badge.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error.' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-gray-400 mt-1">Manage users, badges, links, and announcements</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2.5 border border-rose-700 rounded-lg text-sm font-medium text-rose-300 bg-rose-900/20 hover:bg-rose-900/30 transition-colors"
            >
              🔒 Logout
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center px-4 py-2.5 border border-gray-700 rounded-lg text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-750 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${message.type === 'success' ? 'bg-green-900/20 text-green-300 border-green-800/50' : 'bg-red-900/20 text-red-300 border-red-800/50'}`}>
            {message.text}
          </div>
        )}

        {/* News */}
        <section className="mb-10 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span>📢</span> Post Announcement
          </h2>
          <div className="space-y-4">
            <input
              type="text"
              value={newsForm.title}
              onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
              placeholder="Title"
              className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="url"
              value={newsForm.imageUrl}
              onChange={(e) => setNewsForm({ ...newsForm, imageUrl: e.target.value })}
              placeholder="Image URL (optional)"
              className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              value={newsForm.content}
              onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
              rows={4}
              placeholder="Content"
              className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handlePostNews}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2.5 rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
            >
              {newsForm.id ? 'Update Post' : 'Publish Announcement'}
            </button>
          </div>
        </section>

        {/* Admin Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Create Badge */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>🎖️</span> Create Badge
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                value={newBadge.name}
                onChange={(e) => setNewBadge({ ...newBadge, name: e.target.value })}
                placeholder="Badge name"
                className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="url"
                value={newBadge.icon}
                onChange={(e) => setNewBadge({ ...newBadge, icon: e.target.value })}
                placeholder="Icon URL (SVG/PNG)"
                className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleCreateBadge}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2.5 rounded-lg font-medium transition-all"
              >
                Create Badge
              </button>
            </div>
          </div>

          {/* Assign Badge */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>🎁</span> Assign Badge
            </h2>
            <div className="space-y-4">
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select user</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} (@{u.username})</option>
                ))}
              </select>
              <select
                value={selectedBadge}
                onChange={(e) => setSelectedBadge(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select badge</option>
                {badges.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <button
                onClick={handleAddBadge}
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white py-2.5 rounded-lg font-medium transition-all"
              >
                Assign Badge
              </button>
            </div>
          </div>
        </div>

        {/* User Search */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name, username, or email..."
            className="w-full max-w-2xl px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Users */}
        <section className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Users ({filteredUsers.length})</h2>
            {searchQuery && (
              <span className="text-sm text-gray-400">
                Showing {filteredUsers.length} of {users.length} users
              </span>
            )}
          </div>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No users found matching "{searchQuery}"
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map(user => (
                <div key={user.id} className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-5 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-start">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{user.name}</h3>
                      <p className="text-sm text-gray-400 truncate">@{user.username}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      {user.isBanned && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs bg-red-900/40 text-red-300 border border-red-800/30">
                          Banned
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Links */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Links ({user.links?.length || 0})</h4>
                    {user.links?.length ? (
                      <div className="space-y-1 max-h-20 overflow-y-auto text-xs">
                        {user.links.map(link => (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-300 hover:text-blue-200 block truncate"
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
                      <div className="flex flex-wrap gap-1.5">
                        {user.badges.map(badge => (
                          <div key={badge.id} className="flex items-center bg-gray-700/40 rounded-md px-2 py-1 text-xs">
                            <img src={badge.icon} alt={badge.name} className="w-4 h-4 mr-1.5" />
                            <span className="text-gray-200">{badge.name}</span>
                            <button
                              onClick={() => handleRemoveBadge(user.id, badge.id)}
                              className="ml-1.5 text-red-400 hover:text-red-300"
                              title="Remove badge"
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
                  <div className="mt-5 pt-4 border-t border-gray-700/50 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="py-2 text-sm bg-gray-700/50 hover:bg-gray-700 text-gray-200 rounded font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingUserId(user.id)}
                        className="py-2 text-sm bg-rose-900/30 hover:bg-rose-900/50 text-rose-300 rounded font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                    <button
                      onClick={() => handleBanUser(user.id, user.isBanned ? 'unban' : 'ban')}
                      className={`w-full py-2 text-sm rounded font-medium transition-colors ${
                        user.isBanned
                          ? 'bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-300'
                          : 'bg-rose-900/30 hover:bg-rose-900/50 text-rose-300'
                      }`}
                    >
                      {user.isBanned ? 'Unban User' : 'Ban User'}
                    </button>
                    <button
                      onClick={() => setPasswordModal({ userId: user.id, username: user.username })}
                      className="w-full py-2 text-sm bg-amber-900/30 hover:bg-amber-900/50 text-amber-300 rounded font-medium transition-colors"
                    >
                      Reset Password
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* News Posts */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4">Announcements ({newsPosts.length})</h2>
          {newsPosts.length === 0 ? (
            <p className="text-gray-500">No announcements yet.</p>
          ) : (
            <div className="space-y-4">
              {newsPosts.map(post => (
                <div key={post.id} className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5">
                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt=""
                      className="w-full h-48 object-cover rounded-lg mb-3"
                    />
                  )}
                  <h3 className="text-lg font-semibold text-white mb-2">{post.title}</h3>
                  <p className="text-gray-300 mb-3 whitespace-pre-line">{post.content}</p>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>By {post.authorName}</span>
                    <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleEditNews(post)}
                      className="text-sm px-3 py-1 bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteNews(post.id)}
                      className="text-sm px-3 py-1 bg-rose-900/30 hover:bg-rose-900/50 text-rose-300 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Badges Gallery */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">Badges ({badges.length})</h2>
          {badges.length === 0 ? (
            <p className="text-gray-500">No badges created yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {badges.map(badge => (
                <div key={badge.id} className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4 text-center group relative">
                  <img src={badge.icon} alt={badge.name} className="w-16 h-16 mx-auto mb-2 object-contain" />
                  <p className="text-sm text-gray-200">{badge.name}</p>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDeleteBadge(badge.id)}
                      className="text-rose-400 hover:text-rose-300"
                      title="Delete badge"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modals */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Edit User</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Full name"
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
              <input
                type="text"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                placeholder="Username"
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="Email"
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSaveUser}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2.5 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {passwordModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              Reset Password for @{passwordModal.username}
            </h3>
            <div className="space-y-4">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min. 8 chars)"
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleResetPassword}
                className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white py-2.5 rounded-lg font-medium"
              >
                Reset Password
              </button>
              <button
                onClick={() => {
                  setPasswordModal(null);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="px-4 py-2.5 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingUserId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl border border-rose-700/50 w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-rose-400 mb-2">Confirm Deletion</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to permanently delete this user? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteUser}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-lg font-medium"
              >
                Delete User
              </button>
              <button
                onClick={() => setDeletingUserId(null)}
                className="px-4 py-2.5 text-gray-400 hover:text-white"
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
