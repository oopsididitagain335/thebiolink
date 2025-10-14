// app/ripple/page.tsx
'use client';

import { useState } from 'react';

export default function FortniteSignup() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      username: formData.get('username')?.toString().trim() || '', // Fortnite username
      discordUser: formData.get('discordUser')?.toString().trim() || '',
      discordId: formData.get('discordId')?.toString().trim() || '',
      email: formData.get('email')?.toString().trim() || '',
      age: formData.get('age')?.toString().trim() || '',
      region: formData.get('region')?.toString().trim() || '',
    };

    if (
      !data.username ||
      !data.discordUser ||
      !data.discordId ||
      !data.email ||
      !data.age ||
      !data.region
    ) {
      alert('Please fill in all fields.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/fortnite-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setIsSubmitted(true);
        (e.target as HTMLFormElement).reset();
      } else {
        alert('Failed to register. Please try again.');
      }
    } catch {
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-indigo-500/30 shadow-2xl p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-green-500/20 rounded-full">
            <span className="text-2xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">You're In!</h2>
          <p className="text-gray-300 mb-6">
            Your registration was successful.
          </p>

          {/* Tournament Info — ONLY shown after submit */}
          <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-4 mb-6">
            <h3 className="font-bold text-indigo-300 mb-3">Tournament Details</h3>
            <div className="space-y-2 text-left text-sm">
              <div>
                <span className="text-gray-400">Game 1 Code:</span>{' '}
                <span className="font-mono bg-gray-800 px-2 py-0.5 rounded">SolaceBioLink</span>
              </div>
              <div>
                <span className="text-gray-400">Start Time:</span>{' '}
                <span>Announced in Discord</span>
              </div>
              <div>
                <span className="text-gray-400">Game 2 Code:</span>{' '}
                <span>Announced in Discord</span>
              </div>
            </div>
          </div>

          <a
            href="https://discord.gg/29yDsapcXh"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition shadow-lg"
          >
            Join Discord for Updates →
          </a>

          <p className="text-xs text-gray-500 mt-4">
            The exact start time and Game 2 code will be posted in the server.
          </p>
        </div>
      </div>
    );
  }

  // BEFORE SUBMIT: No codes shown
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800/40 backdrop-blur-lg rounded-2xl border border-gray-700 shadow-2xl p-6">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-indigo-600/20 flex items-center justify-center mb-4">
            <span className="text-2xl">🎮</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Fortnite Tournament Signup</h1>
          <p className="text-gray-400 text-sm mt-2">
            Fill out the form below to join the tournament.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Fortnite Username <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="username"
              required
              className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Your in-game name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Discord Username <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="discordUser"
              required
              className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Solace#1234"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Discord ID <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="discordId"
              required
              className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Right-click your profile → Copy ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Age <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              name="age"
              min="13"
              max="99"
              required
              className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Region <span className="text-red-400">*</span>
            </label>
            <select
              name="region"
              required
              className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select your region</option>
              <option value="NA-EAST">NA East</option>
              <option value="NA-WEST">NA West</option>
              <option value="EU">Europe</option>
              <option value="BR">Brazil</option>
              <option value="ME">Middle East</option>
              <option value="ASIA">Asia</option>
              <option value="OCE">Oceania</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white font-medium rounded-lg transition-colors shadow-lg"
          >
            {isSubmitting ? 'Registering...' : 'Sign Up for Tournament'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          Game codes and start time will be shared after registration.
        </p>
      </div>
    </div>
  );
}
