'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  email: string;
  badges: { id: string; name: string; icon: string; awardedAt: string }[];
  referralCode?: string;
  referralId?: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User>({
    _id: '',
    name: '',
    username: '',
    avatar: '',
    bio: '',
    background: '',
    isEmailVerified: true,
    email: '',
    badges: [],
    referralCode: '',
    referralId: '',
  });
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [topReferrers, setTopReferrers] = useState<{ username: string; referredCount: number }[]>([]);
  const [announcementInput, setAnnouncementInput] = useState('');
  const router = useRouter();

  // --- Effect to load user data and links on mount ---
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
        console.log('Fetched user data:', data); // Debug log
        // --- Populate user state including background ---
        setUser({
          _id: data.user._id || '',
          name: data.user.name || '',
          username: data.user.username || '',
          avatar: data.user.avatar || '',
          bio: data.user.bio || '',
          background: data.user.background || '',
          isEmailVerified: data.user.isEmailVerified ?? true,
          email: data.user.email || '',
          badges: data.user.badges || [],
          referralCode: data.user.referralCode || '',
          referralId: data.user.referralId || '',
        });
        // --- Populate links state ---
        const fetchedLinks = Array.isArray(data.links) ? data.links : [];
        const sortedLinks = [...fetchedLinks].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        setLinks(
          sortedLinks.length > 0
            ? sortedLinks.map((link: any) => ({
                id: link.id || Date.now().toString() + Math.random(),
                url: link.url || '',
                title: link.title || '',
                icon: link.icon || '',
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

  // Fetch announcement and top referrers if admin
  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const res = await fetch('/api/dashboard/announcement');
        if (res.ok) {
          const data = await res.json();
          setAnnouncement(data.text || null);
        } else {
          console.error('Failed to fetch announcement:', await res.text());
        }
      } catch (error) {
        console.error('Failed to fetch announcement:', error);
      }
    };

    fetchAnnouncement();

    if (user.email === 'lyharry31@gmail.com') {
      const fetchTopReferrers = async () => {
        try {
          const res = await fetch('/api/referrals');
          if (res.ok) {
            setTopReferrers(await res.json());
          } else {
            console.error('Failed to fetch top referrers:', await res.text());
          }
        } catch (error) {
          console.error('Failed to fetch top referrers:', error);
        }
      };
      fetchTopReferrers();
    }
  }, [user.email]);

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
    const { name, value } = e.target;
    setUser((prevUser) => ({ ...prevUser, [name]: value }));
  };

  const handleLinkChange = (index: number, field: keyof Link, value: string) => {
    setLinks((prevLinks) => {
      const newLinks = [...prevLinks];
      newLinks[index] = { ...newLinks[index], [field]: value };
      return newLinks;
    });
  };

  const addLink = () => {
    setLinks((prevLinks) => [
      ...prevLinks,
      { id: Date.now().toString(), url: '', title: '', icon: '', position: prevLinks.length },
    ]);
  };

  const removeLink = (index: number) => {
    setLinks((prevLinks) => prevLinks.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const linksToSend = links
        .filter((link) => link.url.trim() && link.title.trim())
        .map((link, index) => ({
          id: link.id,
          url: link.url.trim(),
          title: link.title.trim(),
          icon: link.icon?.trim() || '',
          position: index,
        }));
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

  const handleSendAnnouncement = async () => {
    if (!announcementInput.trim()) {
      setMessage({ type: 'error', text: 'Announcement text cannot be empty.' });
      return;
    }
    try {
      const res = await fetch('/api/dashboard/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: announcementInput }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Announcement sent!' });
        setAnnouncementInput('');
        // Refresh announcement
        const annRes = await fetch('/api/dashboard/announcement');
        if (annRes.ok) {
          const data = await annRes.json();
          setAnnouncement(data.text || null);
        }
      } else {
        const errorData = await res.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to send announcement.' });
      }
    } catch (error) {
      console.error('Send announcement error:', error);
      setMessage({ type: 'error', text: 'Network error.' });
    }
  };

  const hasSponsoredBadge = user.badges.some((b) => b.name === 'Sponsored');
  const referralLink = hasSponsoredBadge
    ? `https://thebiolink.lol/${user.referralCode}?referralid=${user.referralId}`
    : '';

  const handleCopyReferral = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setMessage({ type: 'success', text: 'Referral link copied!' });
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
        {/* Announcement Box - Visible to all */}
        {announcement && (
          <div className="bg-yellow-900/50 backdrop-blur-sm border border-yellow-800 rounded-2xl p-6 mb-8 text-white">
            <h3 className="text-lg font-semibold mb-2">Announcement</h3>
            <p>{announcement}</p>
          </div>
        )}
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
                    <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-600 bg-gray-700/50 text-gray-400">
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
                  <p className="mt-2 text-xs text-gray-500">
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
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Tell people about yourself"
                  />
                </div>
              </div>
              {/* Referral Link Section */}
              {hasSponsoredBadge && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2 text-white">Your Sponsored Referral Link</h3>
                  <p className="text-gray-400 mb-2">Share this link to refer new users (leads to signup for now):</p>
                  <div className="flex">
                    <input
                      type="text"
                      value={referralLink}
                      readOnly
                      className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-l-xl text-white"
                    />
                    <button
                      onClick={handleCopyReferral}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-r-xl font-medium transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* Links Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
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
            </div>
          </div>
          {/* Sidebar - Made whole sidebar sticky */}
          <div className="lg:col-span-1 lg:sticky lg:top-8 space-y-6">
            {/* Preview Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-4 text-white">Live Preview</h2>
              <div className="bg-gray-900/50 rounded-xl p-6 text-center relative overflow-hidden min-h-[400px]">
                {/* Display Background GIF */}
                {user.background && (
                  <div
                    className="absolute inset-0 z-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${user.background})`,
                    }}
                  />
                )}
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
                      <span className="text-3xl text-white font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-white mb-2">{user.name}</h3>
                  {user.bio && <p className="text-gray-300 mb-4">{user.bio}</p>}
                  <div className="space-y-3">
                    {links
                      .filter((link) => link.url && link.title)
                      .map((link, index) => (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg text-sm transition-colors"
                        >
                          {link.title}
                        </a>
                      ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Stats Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Stats</h3>
              <div className="space-y-3">
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
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Updated</span>
                  <span className="text-white font-medium">Just now</span>
                </div>
              </div>
              {/* Personal Subscriptions Coming Soon */}
              <div className="mt-6 bg-indigo-900/50 p-4 rounded-lg text-center text-white font-medium">
                Personal subscriptions coming soon!
              </div>
            </div>
            {/* Admin Sections - Only for lyharry31@gmail.com */}
            {user.email === 'lyharry31@gmail.com' && (
              <>
                {/* Send Announcement Card */}
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">Send Announcement</h3>
                  <textarea
                    value={announcementInput}
                    onChange={(e) => setAnnouncementInput(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 mb-4"
                    placeholder="Enter announcement text..."
                  />
                  <button
                    onClick={handleSendAnnouncement}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-colors"
                  >
                    Send
                  </button>
                </div>
                {/* Top Referrers Card */}
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">Top Referrers</h3>
                  {topReferrers.length > 0 ? (
                    <ul className="space-y-2">
                      {topReferrers.map((r, index) => (
                        <li key={index} className="flex justify-between text-gray-300">
                          <span>{r.username}</span>
                          <span className="font-medium text-white">{r.referredCount}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No referrals yet.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        {/* Status Message */}
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
      </div>
    </div>
  );
}
