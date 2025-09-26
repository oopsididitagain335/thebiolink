// app/dashboard/page.tsx
'use client';

// import { useSession } from 'next-auth/react'; // Remove this import
import { useState, useEffect } from 'react';
import { redirect } from 'next/navigation';
import { getUserById, updateUserProfile, getLinksByUserId, saveUserLinks, getDynamicStripePlans, PlanDetails } from '@/lib/storage';
import { User, Link } from '@/types'; // Ensure you have a Link type defined if not already
import { cookies } from 'next/headers'; // Import cookies if needed for direct fetching

// Define your Link type if not already in types.ts
// export type Link = { id: string; title: string; url: string; icon?: string; position: number };

export default function DashboardPage() {
  // const { data: session, status } = useSession(); // Remove this hook
  const [user, setUser] = useState<User | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [newLink, setNewLink] = useState({ title: '', url: '', icon: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [dynamicPlans, setDynamicPlans] = useState<PlanDetails[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated' | 'error'>('loading');

  useEffect(() => {
    const checkSessionAndLoadData = async () => {
      try {
        // Get session ID from cookie
        const sessionId = (await import('next/headers')).cookies().get('biolink_session')?.value;
        if (!sessionId) {
          setStatus('unauthenticated');
          return;
        }

        // Validate session ID format if necessary (e.g., check if it's a valid ObjectId)
        let userId;
        try {
          userId = sessionId; // Or validate sessionId format here if needed
        } catch {
          setStatus('unauthenticated');
          return;
        }

        // Fetch user data using the session ID (which should be the user ID)
        const userData = await getUserById(userId);
        if (userData) {
          setStatus('authenticated');
          setUser(userData);
          const userLinks = await getLinksByUserId(userId);
          // Sort links by position
          userLinks.sort((a, b) => a.position - b.position);
          setLinks(userLinks);
        } else {
          setStatus('unauthenticated'); // Or 'error' depending on your logic
        }
      } catch (error) {
        console.error('Error checking session or fetching user data:', error);
        setStatus('error');
      } finally {
        setLoadingPlans(false);
      }
    };

    checkSessionAndLoadData();
    fetchDynamicPlans(); // Fetch plans when component mounts
  }, []);

  const fetchDynamicPlans = async () => {
    try {
      const plans = await getDynamicStripePlans();
      setDynamicPlans(plans);
    } catch (error) {
      console.error('Error fetching dynamic plans:', error);
      // Optionally set an error state or show a message to the user
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!user) return;
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      // Use the updated function name
      const updatedUser = await updateUserProfile(user.id, { name: user.name, username: user.username, avatar: user.avatar, bio: user.bio, background: user.background });
      setUser(updatedUser); // Update the local state with the returned user object
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile.');
    }
    setIsSaving(false);
  };

  const handleAddLink = async () => {
    if (!user || !newLink.title || !newLink.url) return;
    try {
      const linkWithPosition = { ...newLink, position: links.length };
      const createdLink = { ...linkWithPosition, id: `temp-${Date.now()}` }; // Temporary ID for optimistic update
      const newLinks = [...links, createdLink];
      setLinks(newLinks); // Optimistic update
      await saveUserLinks(user.id, newLinks); // Save to DB
      // Fetch links again to ensure positions are correct and IDs are updated
      const updatedLinks = await getLinksByUserId(user.id);
      updatedLinks.sort((a, b) => a.position - b.position);
      setLinks(updatedLinks);
      setNewLink({ title: '', url: '', icon: '' });
    } catch (error) {
      console.error('Error adding link:', error);
      alert('Failed to add link.');
      // Revert optimistic update if needed
      setLinks(links.slice(0, -1));
    }
  };

  const handleUpdateLink = async (index: number, updatedLink: Link) => {
    try {
      const newLinks = [...links];
      newLinks[index] = updatedLink;
      setLinks(newLinks); // Optimistic update
      await saveUserLinks(user!.id, newLinks); // Save to DB
      // Optionally fetch links again if needed
      // const updatedLinks = await getLinksByUserId(user.id);
      // updatedLinks.sort((a, b) => a.position - b.position);
      // setLinks(updatedLinks);
    } catch (error) {
      console.error('Error updating link:', error);
      alert('Failed to update link.');
      // Revert optimistic update if needed
      const originalLinks = await getLinksByUserId(user!.id);
      originalLinks.sort((a, b) => a.position - b.position);
      setLinks(originalLinks);
    }
  };

  const handleDeleteLink = async (index: number) => {
    const linkToDelete = links[index];
    if (!window.confirm('Are you sure you want to delete this link?')) return;

    try {
      const newLinks = links.filter((_, i) => i !== index);
      // Update positions after deletion
      const updatedLinks = newLinks.map((link, i) => ({ ...link, position: i }));
      setLinks(updatedLinks); // Optimistic update
      await saveUserLinks(user!.id, updatedLinks); // Save to DB
    } catch (error) {
      console.error('Error deleting link:', error);
      alert('Failed to delete link.');
      // Revert optimistic update if needed
      const originalLinks = await getLinksByUserId(user!.id);
      originalLinks.sort((a, b) => a.position - b.position);
      setLinks(originalLinks);
    }
  };

  if (status === 'loading' || loadingPlans) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  if (status === 'unauthenticated') {
    redirect('/auth/login'); // Redirect to your login page
  }

  if (status === 'error' || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Error loading dashboard.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center py-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center space-x-4">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="font-bold">{user.name.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <span>{user.name}</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Profile Section */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
            <div className="space-y-4">
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
                    placeholder="username"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Avatar URL</label>
                <input
                  type="text"
                  name="avatar"
                  value={user.avatar}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                <textarea
                  name="bio"
                  value={user.bio}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Background URL (Optional)</label>
                <input
                  type="text"
                  name="background"
                  value={user.background}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="https://example.com/background.jpg"
                />
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-70"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>

          {/* Links Section */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Manage Links</h2>
            <div className="space-y-4 mb-6">
              <h3 className="font-medium text-gray-300">Add New Link</h3>
              <div className="flex flex-col space-y-2">
                <input
                  type="text"
                  value={newLink.title}
                  onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                  className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Link Title"
                />
                <input
                  type="url"
                  value={newLink.url}
                  onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                  className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
                <input
                  type="text"
                  value={newLink.icon}
                  onChange={(e) => setNewLink({ ...newLink, icon: e.target.value })}
                  className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Icon URL (Optional)"
                />
                <button
                  onClick={handleAddLink}
                  className="bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Add Link
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-300">Your Links</h3>
              {links.length === 0 ? (
                <p className="text-gray-400">No links added yet.</p>
              ) : (
                links.map((link, index) => (
                  <div key={link.id} className="border border-gray-600 rounded-lg p-4 bg-gray-700/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Title</label>
                        <input
                          type="text"
                          value={link.title}
                          onChange={(e) => handleUpdateLink(index, { ...link, title: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-600/50 border border-gray-500 rounded text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="My Website"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">URL</label>
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => handleUpdateLink(index, { ...link, url: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-600/50 border border-gray-500 rounded text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="https://mywebsite.com"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Icon URL</label>
                        <input
                          type="text"
                          value={link.icon || ''}
                          onChange={(e) => handleUpdateLink(index, { ...link, icon: e.target.value || undefined })}
                          className="w-full px-3 py-2 bg-gray-600/50 border border-gray-500 rounded text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="https://example.com/icon.png"
                        />
                      </div>
                      <button
                        onClick={() => handleDeleteLink(index)}
                        className="ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Subscription Plans Section */}
        <div className="mt-8 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Subscription Plans</h2>
          {loadingPlans ? (
            <p>Loading plans...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {dynamicPlans.map((plan) => (
                <div key={plan.id} className="bg-gray-700/50 border border-gray-600 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-2">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-white">
                      ${plan.amount / 100} {/* Convert cents to dollars */}
                    </span>
                    <span className="text-gray-400"> / {plan.interval}</span>
                    {plan.intervalCount > 1 && (
                      <span className="text-gray-400"> (every {plan.intervalCount} {plan.interval}s)</span>
                    )}
                  </div>
                  {/* Example of using metadata for benefits */}
                  <ul className="mt-4 space-y-1 text-sm text-gray-300">
                    {plan.metadata?.benefit1 && <li>✓ {plan.metadata.benefit1}</li>}
                    {plan.metadata?.benefit2 && <li>✓ {plan.metadata.benefit2}</li>}
                    {plan.metadata?.benefit3 && <li>✓ {plan.metadata.benefit3}</li>}
                  </ul>
                  <button
                    onClick={async () => {
                      // Call your API route to create a Stripe checkout session for this specific price ID
                      try {
                        const response = await fetch('/api/stripe/create-checkout-session', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            priceId: plan.id, // Pass the dynamic price ID
                            userId: user.id, // Pass the user ID
                          }),
                        });

                        if (response.ok) {
                          const { url } = await response.json();
                          window.location.href = url; // Redirect to Stripe Checkout
                        } else {
                          console.error('Failed to create checkout session');
                          alert('Failed to initiate checkout. Please try again.');
                        }
                      } catch (error) {
                        console.error('Error initiating checkout:', error);
                        alert('An error occurred. Please try again.');
                      }
                    }}
                    className="mt-6 w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Upgrade Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
