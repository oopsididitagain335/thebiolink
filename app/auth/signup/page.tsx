'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

// --- Child component that uses useSearchParams ---
function UsernamePrefiller({ onUsernameChange }: { onUsernameChange: (username: string) => void }) {
  const searchParams = useSearchParams();
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const raw = searchParams.get('username');
    if (raw) {
      const clean = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (clean) {
        onUsernameChange(clean);
      }
    }
  }, [searchParams, onUsernameChange]);

  // Optional: handle browser autofill by syncing input value
  useEffect(() => {
    const timer = setTimeout(() => {
      if (usernameRef.current) {
        const currentVal = usernameRef.current.value;
        const expectedVal = (usernameRef.current as any).expectedValue || '';
        if (currentVal !== expectedVal) {
          usernameRef.current.value = expectedVal;
        }
      }
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  return null; // This component doesn't render anything visible
}

// --- Main Signup Form ---
function SignupForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const usernameRef = useRef<HTMLInputElement>(null);

  const handleUsernameChange = (username: string) => {
    if (username && username !== formData.username) {
      setFormData((prev) => ({ ...prev, username }));
      if (usernameRef.current) {
        (usernameRef.current as any).expectedValue = username;
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === 'username') {
      finalValue = value.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    setFormData({ ...formData, [name]: finalValue });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (!formData.name.trim()) {
      setError('Please enter your full name');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    if (!/^[a-z0-9]+$/.test(formData.username)) {
      setError('Username can only contain lowercase letters and numbers');
      setIsLoading(false);
      return;
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Account created successfully!');
        setTimeout(() => router.push('/auth/login'), 2000);
      } else {
        setError(data.error || 'Sign up failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Sync input value after state update
  useEffect(() => {
    if (usernameRef.current) {
      usernameRef.current.value = formData.username;
      (usernameRef.current as any).expectedValue = formData.username;
    }
  }, [formData.username]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <span className="text-xl sm:text-2xl font-bold text-white">B</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Create Account</h1>
            <p className="text-gray-400 text-sm">Get started with your BioLink</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/40 border border-red-800/60 text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-900/40 border border-green-800/60 text-green-200 rounded-lg text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                autoComplete="name"
                className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-gray-700/70 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-gray-700/70 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">
                Username
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 sm:px-4 rounded-l-xl border border-r-0 border-gray-600 bg-gray-700/70 text-gray-400 text-sm select-none whitespace-nowrap">
                  thebiolink.lol/
                </span>
                <input
                  ref={usernameRef}
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  inputMode="text"
                  className="flex-1 min-w-0 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-gray-700/70 border border-gray-600 rounded-r-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="yourname"
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                Only lowercase letters and numbers (3–20 chars)
              </p>
              {formData.username && !/^[a-z0-9]{3,20}$/.test(formData.username) && (
                <p className="mt-1 text-xs text-red-400">
                  Must be 3–20 lowercase letters or numbers.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-gray-700/70 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                placeholder="••••••••"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                At least 6 characters
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 sm:py-3 rounded-xl font-medium text-sm sm:text-base hover:opacity-95 transition-opacity disabled:opacity-70"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-700/50 text-center">
            <p className="text-gray-400 text-xs sm:text-sm">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Page Export ---
export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <UsernamePrefiller onUsernameChange={(username) => {
        // This will be handled inside SignupForm via state lifting
        // But since we can't pass state up from here easily,
        // we instead let UsernamePrefiller be a child of SignupForm
        // So we refactor: move Suspense inside SignupForm
      }} />
      <SignupForm />
    </Suspense>
  );
}
