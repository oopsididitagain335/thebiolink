// app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  badges: Badge[];
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  awardedAt?: string;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [newBadge, setNewBadge] = useState({ name: '', icon: '' });
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedBadge, setSelectedBadge] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, badgesRes] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/badges')
        ]);

        if (!usersRes.ok || !badgesRes.ok) {
          router.push('/auth/login');
          return;
        }

        const usersData = await usersRes.json();
        const badgesData = await badgesRes.json();

        setUsers(usersData);
        setBadges(badgesData);
      } catch (error) {
        console.error('Fetch error:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

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
        setMessage({ type: 'success', text: 'Badge created successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create badge' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
  };

  const handleAddBadge = async () => {
    if (!selectedUser || !selectedBadge) {
      setMessage({ type: 'error', text: 'Please select a user and badge' });
      return;
    }

    try {
      const badgeToAdd = badges.find(b => b.id === selectedBadge);
      if (!badgeToAdd) {
        setMessage({ type: 'error', text: 'Badge not found' });
        return;
      }

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
        // Update local state to show badge
        setUsers(users.map(user => 
          user.id === selectedUser 
            ? { ...user, badges: [...user.badges, { ...badgeToAdd, awardedAt: new Date().toISOString() }] } 
            : user
        ));
        setSelectedUser('');
        setSelectedBadge('');
        setMessage({ type: 'success', text: 'Badge added successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to add badge' });
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
        // Update local state to remove badge
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, badges: user.badges.filter(b => b.id !== badgeId) } 
            : user
        ));
        setMessage({ type: 'success', text: 'Badge removed successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to remove badge' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
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
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-400 mt-2">Manage users and badges</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Badge Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Create New Badge</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Badge Name</label>
                <input
                  type="text"
                  value={newBadge.name}
                  onChange={(e) => setNewBadge({ ...newBadge, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Early Adopter"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Badge Icon URL</label>
                <input
                  type="url"
                  value={newBadge.icon}
                  onChange={(e) => setNewBadge({ ...newBadge, icon: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="https://example.com/badge.png"
                />
              </div>
              <button
                onClick={handleCreateBadge}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                Create Badge
              </button>
            </div>
          </div>

          {/* Add Badge to User Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Add Badge to User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Select User</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Choose a user</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Select Badge</label>
                <select
                  value={selectedBadge}
                  onChange={(e) => setSelectedBadge(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Choose a badge</option>
                  {badges.map((badge) => (
                    <option key={badge.id} value={badge.id}>
                      {badge.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleAddBadge}
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                Add Badge to User
              </button>
            </div>
          </div>
        </div>

        {/* All Users Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">All Users</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <div key={user.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{user.name.charAt(0)}</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                    <p className="text-gray-400 text-sm">{user.email}</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-md font-medium text-gray-300 mb-2">Badges</h4>
                  {user.badges.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.badges.map((badge) => (
                        <div key={badge.id} className="relative group">
                          <div className="flex items-center bg-gray-700/50 rounded-lg px-3 py-2">
                            <img src={badge.icon} alt={badge.name} className="w-6 h-6 mr-2" />
                            <span className="text-white text-sm">{badge.name}</span>
                            <button 
                              onClick={() => handleRemoveBadge(user.id, badge.id)}
                              className="ml-2 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No badges</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* All Badges Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">All Badges</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {badges.map((badge) => (
              <div key={badge.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-4 text-center">
                <img src={badge.icon} alt={badge.name} className="w-16 h-16 mx-auto mb-2" />
                <p className="text-white font-medium">{badge.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
