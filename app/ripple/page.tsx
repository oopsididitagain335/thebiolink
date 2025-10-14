// app/ripple/page.tsx
'use client';

import { useState } from 'react';

export default function FortniteSignup() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    const formData = new FormData(e.currentTarget);
    const data = {
      username: formData.get('username')?.toString().trim() || '',
      discordUser: formData.get('discordUser')?.toString().trim() || '',
      discordId: formData.get('discordId')?.toString().trim() || '',
      email: formData.get('email')?.toString().trim() || '',
      age: formData.get('age')?.toString().trim() || '',
      region: formData.get('region')?.toString().trim() || '',
      // Honeypot field (anti-bot)
      phone: formData.get('phone')?.toString().trim() || '',
    };

    // Basic client-side validation
    if (
      !data.username ||
      !data.discordUser ||
      !data.discordId ||
      !data.email ||
      !data.age ||
      !data.region
    ) {
      setSubmitStatus('error');
      setIsSubmitting(false);
      return;
    }

    if (data.phone) {
      // Bot filled honeypot → silently fail
      setSubmitStatus('success');
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
        setSubmitStatus('success');
        (e.target as HTMLFormElement).reset();
      } else {
        setSubmitStatus('error');
      }
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800/40 backdrop-blur-lg rounded-2xl border border-gray-700 shadow-2xl p-6">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-indigo-600/20 flex items-center justify-center mb-4">
            <span className="text-2xl">🎮</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Fortnite Tournament</h1>
          <p className="text-gray-300 text-sm mt-2">
            Game 1 Code: <span className="font-mono bg-gray-900/50 px-1.5 py-0.5 rounded">SolaceBioLink</span><br />
            Game 2 Code: Announced on stream
          </p>
        </div>

        {submitStatus === 'success' && (
          <div className="mb-4 p-3 bg-green-900/30 border border-green-800 rounded-lg text-green-200 text-center">
            ✅ Signup successful! Check your Discord for updates.
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-200 text-center">
            ❌ Failed to submit. Please check your info and try again.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Honeypot field (hidden) */}
          <input
            type="text"
            name="phone"
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Fortnite Username</label>
            <input
              type="text"
              name="username"
              required
              className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Ninja"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Discord Username</label>
            <input
              type="text"
              name="discordUser"
              required
              className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Solace#1234"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Discord ID</label>
            <input
              type="text"
              name="discordId"
              required
              className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Right-click your profile → Copy ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Age</label>
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
            <label className="block text-sm font-medium text-gray-300 mb-1">Region</label>
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
            {isSubmitting ? 'Signing Up...' : 'Register for Tournament'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          By signing up, you agree to receive tournament updates via Discord.
        </p>
      </div>
    </div>
  );
}
