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
}

interface Badge {
  id: string;
  name: string;
  icon: string;
}

interface ReferralStat {
  userId: string;
  username: string;
  usageCount: number;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [newBadge, setNewBadge] = useState({ name: '', icon: '' });
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedBadge, setSelectedBadge] = useState<string>('');
  const [referralStats, setReferralStats] = useState<ReferralStat[]>([]);
  const [selectedReferralUser, setSelectedReferralUser] = useState<string>('');
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersRes, badgesRes, statsRes] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/badges'),
          fetch('/api/admin/referral-stats'),
        ]);

        if (!usersRes.ok || !badgesRes.ok) {
          router.push('/dashboard');
          return;
        }

        setUsers(await usersRes.json());
        setBadges(await badgesRes.json());
        setReferralStats(await statsRes.json());
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
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // ===== Badge Functions (unchanged) =====
  const handleCreateBadge = async () => {
    if (!newBadge.name || !newBadge.icon) {
      setMessage({ type: 'error', text: 'Name and icon are required' });
      return;
    }

    try {
      const res = await fetch('/api/admin/badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBadge)
      });

      const data = await res.json();

      if (res.ok) {
        setBadges([...badges, data]);
        setNewBadge({ name: '', icon: '' });
        setMessage({ type: 'success', text: 'Badge created!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create badge' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error.' });
    }
  };

  const handleAddBadge = async () => {
    if (!selectedUser || !selectedBadge) {
      setMessage({ type: 'error', text: 'Select user and badge' });
      return;
    }

    const badgeToAdd = badges.find(b => b.id === selectedBadge);
    if (!badgeToAdd) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser, badge: badgeToAdd })
      });

      if (res.ok) {
        setUsers(users.map(u =>
          u.id === selectedUser
            ? { ...u, badges: [...u.badges, { ...badgeToAdd, awardedAt: new Date().toISOString() }] }
            : u
        ));
        setSelectedUser('');
        setSelectedBadge('');
        setMessage({ type: 'success', text: 'Badge added!' });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to add badge' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error.' });
    }
  };

  const handleRemoveBadge = async (userId: string, badgeId: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, badgeId })
      });

      if (res.ok) {
        setUsers(users.map(u =>
          u.id === userId ? { ...u, badges: u.badges.filter(b => b.id !== badgeId) } : u
        ));
        setMessage({ type: 'success', text: 'Badge removed!' });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to remove badge' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error.' });
    }
  };

  const handleBanUser = async (userId: string, action: 'ban' | 'unban') => {
    try {
      const res = await fetch('/api/admin/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      });

      if (res.ok) {
        setUsers(users.map(u =>
          u.id === userId ? { ...u, isBanned: action === 'ban' } : u
        ));
        setMessage({ type: 'success', text: `User ${action === 'ban' ? 'banned' : 'unbanned'}!` });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || `Failed to ${action} user` });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error.' });
    }
  };

  // ===== NEW: Referral Link Generator =====
  const handleGenerateReferral = () => {
    if (!selectedReferralUser) {
      setMessage({ type: 'error', text: 'Please select a user' });
      return;
    }

    const user = users.find(u => u.id === selectedReferralUser);
    if (!user) return;

    const link = `https://www.thebiolink.lol/auth/signup?ref=${user.id}`;
    setGeneratedLink(link);
    setMessage({ type: 'success', text: 'Referral link generated!' });
  };

  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setMessage({ type: 'success', text: 'Link copied to clipboard!' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
              <p className="text-gray-400 mt-2">Manage users, badges, and referrals</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 sm:mt-0 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg max-w-sm ${
            message.type === 'success' ? 'bg-green-900/30 text-green-300 border border-green-800' : 'bg-red-900/30 text-red-300 border border-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* ===== Generate Referral Section ===== */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-white">Generate Referral Link</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Select User</label>
              <select
                value={selectedReferralUser}
                onChange={(e) => setSelectedReferralUser(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white"
              >
                <option value="">Choose a user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} (@{user.username})
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleGenerateReferral}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium"
            >
              Generate Referral Link
            </button>
            {generatedLink && (
              <div className="mt-4">
                <label className="block text-sm text-gray-400 mb-2">Referral Link</label>
                <div className="flex">
                  <input
                    type="text"
                    readOnly
                    value={generatedLink}
                    className="flex-1 px-3 py-2 bg-gray-700/50 text-gray-300 rounded-l-lg"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 rounded-r-lg"
                  >
                    Copy
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  This link redirects to signup with ?ref=USER_ID
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ===== Existing Badge/User Management ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Create Badge */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Create New Badge</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={newBadge.name}
                onChange={(e) => setNewBadge({ ...newBadge, name: e.target.value })}
                placeholder="Badge Name"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white"
              />
              <input
                type="url"
                value={newBadge.icon}
                onChange={(e) => setNewBadge({ ...newBadge, icon: e.target.value })}
                placeholder="Icon URL"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white"
              />
              <button
                onClick={handleCreateBadge}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg"
              >
                Create Badge
              </button>
            </div>
          </div>

          {/* Add Badge to User */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Add Badge to User</h2>
            <div className="space-y-4">
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white"
              >
                <option value="">Select user</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
              <select
                value={selectedBadge}
                onChange={(e) => setSelectedBadge(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white"
              >
                <option value="">Select badge</option>
                {badges.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <button
                onClick={handleAddBadge}
                className="w-full bg-green-600 text-white py-2 rounded-lg"
              >
                Add Badge
              </button>
            </div>
          </div>
        </div>

        {/* ===== All Users ===== */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">All Users</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <div key={user.id} className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                <p className="text-gray-400 text-sm">{user.email}</p>
                {user.isBanned && (
                  <span className="inline-block mt-2 px-2 py-1 bg-red-900 text-red-300 text-xs rounded">
                    Banned
                  </span>
                )}
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => handleBanUser(user.id, user.isBanned ? 'unban' : 'ban')}
                    className={`w-full py-2 rounded-lg text-white ${
                      user.isBanned ? 'bg-green-600' : 'bg-red-600'
                    }`}
                  >
                    {user.isBanned ? 'Unban' : 'Ban'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== Referral Tracking ===== */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Referral Link Usage</h2>
          {referralStats.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {referralStats.map((stat) => (
                <div key={stat.userId} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <div className="flex justify-between">
                    <span className="text-white font-medium">@{stat.username}</span>
                    <span className="text-indigo-400 font-bold">{stat.usageCount}</span>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">
                    https://www.thebiolink.lol/auth/signup?ref={stat.userId}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No referral data yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
