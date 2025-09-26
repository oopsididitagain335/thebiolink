// app/dashboard/page.tsx
'use client'; // Keep this as it is

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/AuthContext';
// Remove these imports as they directly reference server-side code
// import { getUserBadgeInfo, updateUserBadge } from '@/lib/storage';

// Define your interfaces here or import from a shared types file
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
  badgeOption: string | null;
  badgePaid: boolean;
  createdAt?: string;
  badgePurchaseTimestamp?: string;
}

const WEEKLY_OPTIONS = [
  { name: 'Common Star', rarity: 'Common' },
  { name: 'Common Heart', rarity: 'Common' },
  { name: 'Common Lightning', rarity: 'Common' },
  { name: 'Uncommon Shield', rarity: 'Uncommon' },
  { name: 'Uncommon Crown', rarity: 'Uncommon' },
  { name: 'Rare Diamond', rarity: 'Rare' },
  { name: 'Rare Unicorn', rarity: 'Rare' },
  { name: 'Rare Phoenix', rarity: 'Rare' },
];

const FREE_BADGE_CODE = 'xovyontop25';

export default function Dashboard() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User>({
    _id: '',
    name: '',
    username: '',
    avatar: '',
    bio: '',
    background: '',
    isEmailVerified: true,
    badgeOption: null,
    badgePaid: false,
  });
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  // State for badge info will now come from API calls or local state updates after actions
  const [badgeInfo, setBadgeInfo] = useState<{ option: string | null; paid: boolean } | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [codeInput, setCodeInput] = useState('');

  useEffect(() => {
    if (authUser && !authLoading) {
      fetchUserData();
      // Fetch badge info via API route instead of direct storage call
      fetchBadgeInfoFromAPI();
    }
  }, [authUser, authLoading]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/data');
      if (!res.ok) {
        if (res.status === 401) {
          console.warn("Unauthorized, redirecting to login.");
        }
        router.push('/auth/login');
        return;
      }
      const data = await res.json();

      setUser({
        _id: data.user._id || '',
        name: data.user.name || '',
        username: data.user.username || '',
        avatar: data.user.avatar || '',
        bio: data.user.bio || '',
        background: data.user.background || '',
        isEmailVerified: data.user.isEmailVerified ?? true,
        badgeOption: data.user.badgeOption || null,
        badgePaid: data.user.badgePaid || false,
      });

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

  // Fetch badge info via API route
  const fetchBadgeInfoFromAPI = async () => {
    if (!authUser?.id) return;
    try {
      const res = await fetch(`/api/user/badge?id=${authUser.id}`); // Example API endpoint
      if (res.ok) {
        const info = await res.json();
        setBadgeInfo(info);
        if (info?.paid && info.option) {
          setSelectedOption(info.option);
        }
      } else {
          console.error("Failed to fetch badge info via API:", res.status);
          // Optionally set a default or error state
          setBadgeInfo({ option: null, paid: false });
      }
    } catch (error) {
      console.error('Error fetching badge info via API:', error);
      // Optionally set an error state
      setBadgeInfo({ option: null, paid: false });
    }
  };

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

  const handlePurchase = async () => {
    if (!authUser || !selectedOption) return;

    setIsProcessing(true);
    setMessage(null);

    try {
      const res = await fetch('/api/badge/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': authUser.id, // Consider using Authorization header or session cookies instead
        },
        body: JSON.stringify({ option: selectedOption }),
      });

      const data = await res.json();

      if (res.ok) {
        // Ensure this URL is correctly constructed by your backend
        // Example: data.sessionUrl
        router.push(data.checkoutUrl || `https://checkout.stripe.com/pay/${data.sessionId}`);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to initiate payment' });
      }
    } catch (error) {
      console.error('Purchase error:', error);
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRedeemCode = async () => {
    if (!authUser || !codeInput.trim()) {
      setMessage({ type: 'error', text: 'Please enter a code' });
      return;
    }

    if (codeInput.trim() === FREE_BADGE_CODE) {
      try {
        // Call API route to update the badge
        const res = await fetch('/api/user/redeem-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: authUser.id, code: codeInput.trim() }),
        });

        if (res.ok) {
          const updatedBadgeInfo = await res.json();
          setBadgeInfo(updatedBadgeInfo);
          setUser({ ...user, badgeOption: updatedBadgeInfo.option, badgePaid: updatedBadgeInfo.paid });
          setMessage({ type: 'success', text: 'Free badge redeemed successfully!' });
          setCodeInput('');
        } else {
          const errorData = await res.json();
          setMessage({ type: 'error', text: errorData.error || 'Failed to redeem code' });
        }
      } catch (error) {
        console.error('Redeem error:', error);
        setMessage({ type: 'error', text: 'Failed to redeem code' });
      }
    } else {
      setMessage({ type: 'error', text: 'Invalid code' });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!authUser) {
    router.push('/auth/login');
    return null;
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

                {/* Background GIF Input */}
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a2 2 0 00-2.828 0l-6 6a2 2 0 002.828 2.828l6-6a2 2 0 000-2.828z" />
                    </svg>
                    <p>No links added yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Custom Badge Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-4 text-white">Custom Badge</h2>
              <p className="text-gray-300 mb-4 text-sm">Select a badge option for this week. Prices range from £2.00 to £2.50 depending on rarity.</p>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {WEEKLY_OPTIONS.map((opt) => (
                  <button
                    key={opt.name}
                    onClick={() => setSelectedOption(opt.name)}
                    disabled={badgeInfo?.paid} // Use state from API call
                    className={`p-2 rounded-lg border text-xs ${
                      selectedOption === opt.name
                        ? 'border-indigo-500 bg-indigo-900/20'
                        : 'border-gray-700 hover:border-gray-500'
                    } ${
                      badgeInfo?.paid ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    } transition-colors`}
                  >
                    <div className="font-medium">{opt.name}</div>
                    <div className={`text-xs mt-1 ${
                      opt.rarity === 'Rare' ? 'text-purple-400' : 
                      opt.rarity === 'Uncommon' ? 'text-blue-400' : 'text-gray-400'
                    }`}>
                      {opt.rarity}
                    </div>
                  </button>
                ))}
              </div>

              {message && (
                <div className={`mt-2 p-2 rounded-lg text-xs ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {message.text}
                </div>
              )}

              {!badgeInfo?.paid ? ( // Use state from API call
                <button
                  onClick={handlePurchase}
                  disabled={!selectedOption || isProcessing}
                  className={`mt-2 w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors text-sm ${
                    !selectedOption || isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isProcessing ? 'Processing...' : 'Buy Badge'}
                </button>
              ) : (
                <div className="mt-2 p-2 bg-green-900/30 text-green-400 rounded-lg text-xs">
                  You have: <strong>{badgeInfo?.option}</strong> {/* Use state from API call */}
                </div>
              )}
            </div>

            {/* Redeem Code Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 sticky top-64">
              <h2 className="text-xl font-semibold mb-4 text-white">Redeem Code</h2>
              <p className="text-gray-300 mb-4 text-sm">Enter a code to unlock special badges!</p>
              
              <div className="flex gap-1">
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="Enter code..."
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleRedeemCode}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium text-sm transition-colors"
                >
                  Redeem
                </button>
              </div>
            </div>

            {/* Preview Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 sticky top-96">
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
                  {/* Display Badge */}
                  {user.badgeOption && (
                    <div className="flex justify-center mb-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-500 text-white mr-2">
                        {user.badgeOption}
                      </span>
                    </div>
                  )}
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
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 sticky top-[1000px]">
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
