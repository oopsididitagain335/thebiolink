'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Link {
  id: string;
  url: string;
  title: string;
  icon: string;
  position: number; // Add position for ordering if needed by your backend
}

interface User {
  _id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  background: string; // ✅ Crucial: Include background in the state type
  isEmailVerified: boolean;
  // links are managed separately in the `links` state
}

export default function Dashboard() {
  const [user, setUser] = useState<User>({
    _id: '',
    name: '',
    username: '',
    avatar: '',
    bio: '',
    background: '', // ✅ Initialize background state
    isEmailVerified: true,
  });
  const [links, setLinks] = useState<Link[]>([
    { id: Date.now().toString(), url: '', title: '', icon: '', position: 0 },
  ]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  // --- Effect to load user data and links on mount ---
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/dashboard/data');
        if (!res.ok) {
          // Handle 401 Unauthorized (e.g., invalid/expired session cookie)
          if (res.status === 401) {
             console.warn("Unauthorized access, redirecting to login.");
             // Clear potentially bad cookie if needed or just redirect
          }
          router.push('/auth/login');
          return;
        }
        const data = await res.json();
        console.log("Data fetched from API:", data); // Log for debugging

        // --- Crucial: Populate user state including background ---
        setUser({
          _id: data.user._id || '',
          name: data.user.name || '',
          username: data.user.username || '',
          avatar: data.user.avatar || '',
          bio: data.user.bio || '',
          background: data.user.background || '', // ✅ Load background from API
          isEmailVerified: data.user.isEmailVerified ?? true,
        });

        // --- Crucial: Populate links state ---
        // Ensure links is always an array, sort by position if available
        const fetchedLinks = Array.isArray(data.links) ? data.links : [];
        const sortedLinks = fetchedLinks.sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));
        setLinks(
          sortedLinks.length > 0
            ? sortedLinks.map((link: any) => ({
                id: link.id || Date.now().toString() + Math.random(),
                url: link.url || '',
                title: link.title || '',
                icon: link.icon || '',
                position: link.position ?? 0,
              }))
            : [{ id: Date.now().toString(), url: '', title: '', icon: '', position: 0 }]
        );
      } catch (error) {
        console.error('Fetch error:', error);
        // Optional: Show user-friendly error message
        // setMessage({ type: 'error', text: 'Failed to load dashboard data.' });
        router.push('/auth/login'); // Redirect on error
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    // Run once on mount, router is a stable dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]); // Add router to dependency array

  const handleLogout = async () => {
    try {
      // Call the logout API to clear the session cookie
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        console.log("Logout successful");
      } else {
        console.error("Logout API returned non-OK status:", response.status);
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Optionally, still redirect even if API call fails
    } finally {
      // Always redirect to login page after attempting logout
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
      // Ensure the link object has all properties before updating
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
      // Prepare data to send to the backend
      // Ensure links have correct structure before sending
      const linksToSend = links
        .filter((link) => link.url.trim() && link.title.trim()) // Basic validation
        .map((link, index) => ({
          id: link.id,
          url: link.url.trim(),
          title: link.title.trim(),
          icon: link.icon?.trim() || '',
          position: index, // Backend often manages position based on array order
        }));

      const response = await fetch('/api/dashboard/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile: {
            name: user.name.trim(),
            username: user.username.trim().toLowerCase(),
            avatar: user.avatar?.trim() || '',
            bio: user.bio?.trim() || '',
            background: user.background?.trim() || '', // ✅ Send background to API
          },
          links: linksToSend,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Changes saved successfully!' });
        // Optional: Refetch data to ensure UI matches server state exactly
        // await refetchUserData();
      } else {
        // Handle specific error messages from backend
        const errorMessage = data.error || 'Failed to save changes.';
        console.error('Save error from backend:', errorMessage);
        setMessage({ type: 'error', text: errorMessage });
      }
    } catch (error: any) {
      console.error('Network or unexpected save error:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
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

  // Optional: Handle case where user data failed to load but didn't redirect
  if (!user._id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Error loading user data. Please try logging in again.
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

                {/* ✅ Crucial: Background GIF Input Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Background GIF URL</label>
                  <input
                    type="url"
                    name="background" // Name attribute is crucial for handleProfileChange
                    value={user.background} // Value is bound to user.background state
                    onChange={handleProfileChange} // Updates user.background state
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
                          className="w-full px-3 py-2 bg-gray-600/50 border border-gray-600 rounded-lg text-white placeholder-gra
