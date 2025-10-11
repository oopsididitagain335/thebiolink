'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [username, setUsername] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleGo = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (trimmed) {
      router.push(`/auth/signup?username=${encodeURIComponent(trimmed)}`);
    } else {
      inputRef.current?.focus();
    }
  };

  useEffect(() => {
    if (window.innerWidth >= 768) {
      inputRef.current?.focus();
    }
  }, []);

  const isValidUsername = /^[a-zA-Z0-9]*$/.test(username);
  const isDisabled = !username.trim() || !isValidUsername;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-indigo-900/20 overflow-x-hidden">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 bg-gray-900/70 backdrop-blur-xl z-50 border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-lg font-bold text-white">B</span>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">
                BioLink
              </span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-4">
              {['/', '/news', '/pricing', '/auth/login', '/auth/signup'].map((href) => (
                <Link
                  key={href}
                  href={href}
                  className="px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/60 transition-all duration-200"
                >
                  {href === '/' && 'Home'}
                  {href === '/news' && 'News'}
                  {href === '/pricing' && 'Pricing'}
                  {href === '/auth/login' && 'Login'}
                  {href === '/auth/signup' && 'Signup'}
                </Link>
              ))}
              <Link
                href="https://discord.gg/29yDsapcXh"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-indigo-300 hover:bg-indigo-900/30 transition-all duration-200 flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.198.363-.437.828-.635 1.222a18.6 18.6 0 0 0-5.487 0a12.69 12.69 0 0 0-.635-1.222a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.207-1.967a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.027-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.027.128a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.106c.36.698.772 1.362 1.206 1.967a.078.078 0 0 0 .084.028a19.839 19.839 0 0 0 6.03-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.175 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.175 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418z" />
                </svg>
                Discord
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-28 pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 mb-8 ring-1 ring-white/10">
            <span className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">
              B
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300 mb-6 leading-tight">
            Own Your Link
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-12 px-2">
            Create a stunning, lightning-fast link-in-bio page. Free forever. No tracking. Just you.
          </p>

          {/* Username Input */}
          <div className="relative max-w-xl mx-auto mb-12">
            <form onSubmit={handleGo} className="relative">
              <div
                className={`flex items-center rounded-2xl transition-all duration-300 ${
                  isFocused
                    ? 'ring-2 ring-indigo-500/50 bg-gray-800/60'
                    : 'bg-gray-800/40 hover:bg-gray-800/50'
                } backdrop-blur-sm border border-gray-700/60`}
              >
                <span className="px-5 py-4 text-gray-400 font-mono text-lg select-none">
                  thebiolink.lol/
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="yourname"
                  className="flex-1 min-w-0 bg-transparent py-4 px-2 text-white placeholder-gray-500 outline-none font-mono text-lg"
                />
                <button
                  type="submit"
                  disabled={isDisabled}
                  className={`mx-3 px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                    isDisabled
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90 shadow-lg hover:shadow-indigo-500/20'
                  }`}
                >
                  Claim
                </button>
              </div>
            </form>
            <p className="mt-3 text-sm text-gray-500">
              {username && !isValidUsername ? (
                <span className="text-red-400">Username can only contain letters and numbers</span>
              ) : (
                'Choose a unique username — this will be your public link!'
              )}
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/auth/signup"
              className="px-8 py-4 rounded-2xl font-semibold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg hover:shadow-indigo-500/30"
            >
              Start for Free
            </Link>
            <Link
              href="/auth/login"
              className="px-8 py-4 rounded-2xl font-semibold text-lg bg-gray-800/60 text-white hover:bg-gray-700/80 backdrop-blur-sm border border-gray-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
