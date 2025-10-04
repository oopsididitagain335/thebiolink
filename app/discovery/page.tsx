// app/discovery/page.tsx
import { getAllUsers } from '@/lib/storage';
import Link from 'next/link';
import ProfileCard from './ProfileCard';

interface User {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  bio?: string;
  isBanned?: boolean;
}

export default async function DiscoveryPage() {
  let validUsers: User[] = [];

  try {
    const users = await getAllUsers();
    // Extra safety: ensure uniqueness in case JS dedupe missed something
    const seen = new Set<string>();
    validUsers = users.filter(user => {
      if (!user.username || seen.has(user.username)) return false;
      seen.add(user.username);
      return true;
    });
  } catch (error) {
    console.error('Discovery page error:', error);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 bg-gray-900/80 backdrop-blur-md z-50 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-white">BioLink</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Home
              </Link>
              <Link
                href="/pricing"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/auth/login"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Signup
              </Link>
              <Link
                href="https://discord.gg/29yDsapcXh"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Discord
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white">Discover BioLinks</h1>
            <p className="text-gray-400 mt-2">
              Explore amazing profiles from our community
            </p>
          </div>

          {validUsers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {validUsers.map((user) => (
                <ProfileCard
                  key={user.id} // ✅ Must be unique per user
                  username={user.username}
                  name={user.name}
                  avatar={user.avatar}
                  bio={user.bio}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-12 h-12 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.291-1.1-5.291-2.709M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0H9"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">No Profiles Yet</h2>
              <p className="text-gray-500">Be the first to create a BioLink profile!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
