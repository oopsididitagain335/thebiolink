// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/AuthContext';
import { getUserBadgeInfo, updateUserBadge } from '@/lib/storage';

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

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [badgeInfo, setBadgeInfo] = useState<{ option: string | null; paid: boolean } | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [codeInput, setCodeInput] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchBadgeInfo();
    }
  }, [user?.id]);

  const fetchBadgeInfo = async () => {
    if (!user?.id) return;
    try {
      const info = await getUserBadgeInfo(user.id);
      setBadgeInfo(info);
      if (info?.paid && info.option) {
        setSelectedOption(info.option);
      }
    } catch (error) {
      console.error('Error fetching badge info:', error);
    }
  };

  const handlePurchase = async () => {
    if (!user || !selectedOption) return;

    setIsProcessing(true);
    setMessage(null);

    try {
      const res = await fetch('/api/badge/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user.id,
        },
        body: JSON.stringify({ option: selectedOption }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(`https://checkout.stripe.com/pay/${data.sessionId}`);
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
    if (!user || !codeInput.trim()) {
      setMessage({ type: 'error', text: 'Please enter a code' });
      return;
    }

    if (codeInput.trim() === FREE_BADGE_CODE) {
      try {
        await updateUserBadge(user.id, 'Xovy x TheBioLink');
        setBadgeInfo({ option: 'Xovy x TheBioLink', paid: true });
        setMessage({ type: 'success', text: 'Free badge redeemed successfully!' });
        setCodeInput('');
      } catch (error) {
        console.error('Redeem error:', error);
        setMessage({ type: 'error', text: 'Failed to redeem code' });
      }
    } else {
      setMessage({ type: 'error', text: 'Invalid code' });
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900"><div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <button
            onClick={() => {
              document.cookie = 'token=; Max-Age=0; path=/; SameSite=Strict';
              router.push('/login');
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Logout
          </button>
        </header>

        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Custom Badge</h2>
          <p className="text-gray-300 mb-4">Select a badge option for this week. Prices range from £2.00 to £2.50 depending on rarity.</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {WEEKLY_OPTIONS.map((opt) => (
              <button
                key={opt.name}
                onClick={() => setSelectedOption(opt.name)}
                disabled={badgeInfo?.paid}
                className={`p-3 rounded-lg border ${
                  selectedOption === opt.name
                    ? 'border-indigo-500 bg-indigo-900/20'
                    : 'border-gray-700 hover:border-gray-500'
                } ${
                  badgeInfo?.paid ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                } transition-colors`}
              >
                <div className="text-sm font-medium">{opt.name}</div>
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
            <div className={`mt-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.text}
            </div>
          )}

          {!badgeInfo?.paid ? (
            <button
              onClick={handlePurchase}
              disabled={!selectedOption || isProcessing}
              className={`mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors ${
                !selectedOption || isProcessing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isProcessing ? 'Processing...' : 'Buy Badge'}
            </button>
          ) : (
            <div className="mt-4 p-3 bg-green-900/30 text-green-400 rounded-lg">
              You have purchased the <strong>{badgeInfo.option}</strong> badge.
            </div>
          )}
        </div>

        {/* Redeem Code Section */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Redeem Code</h2>
          <p className="text-gray-300 mb-4">Enter a code to unlock special badges!</p>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Enter code..."
              className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleRedeemCode}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
            >
              Redeem
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
