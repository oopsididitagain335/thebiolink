// app/pricing/page.tsx
'use client';

import Link from 'next/link';
import Script from 'next/script';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { clsx } from 'clsx';

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  cta: string;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Forever free. No card needed.',
    features: ['1 BioLink', 'Basic themes', '100 links', 'Analytics (30 days)'],
    cta: 'Use Free Plan',
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 5,
    description: 'Perfect for creators & small projects.',
    features: ['5 BioLinks', 'Custom themes', '500 links', 'Analytics (1 year)', 'Priority support'],
    cta: 'Subscribe for £5/mo',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 15,
    description: 'Advanced analytics & customization.',
    features: [
      'Unlimited BioLinks',
      'Custom CSS/JS',
      'Unlimited links',
      'Real-time analytics',
      'API access',
      'White-label',
    ],
    cta: 'Subscribe for £15/mo',
  },
  {
    id: 'fwiend',
    name: 'Fwiend',
    price: 60,
    description: 'Support the project. You’re a legend.',
    features: [
      'Everything in Premium',
      'Early access',
      'Name in credits',
      'Exclusive badge',
      'Eternal gratitude',
    ],
    cta: 'Be a Fwiend',
  },
];

/* ==============================================================
   TOGGLE HALLOWEEN MODE
   ============================================================== */
const HALLOWEEN_MODE = true;

const theme = HALLOWEEN_MODE
  ? {
      bg: 'from-black via-purple-950 to-orange-950/30',
      cardBg: 'bg-black/60 backdrop-blur-xl border-orange-800/50',
      cardHover: 'hover:shadow-2xl hover:shadow-orange-600/40',
      text: 'text-orange-200',
      title: 'from-orange-400 via-purple-400 to-orange-300',
      subtitle: 'text-orange-300',
      buttonPrimary: 'from-orange-600 to-purple-600',
      buttonHover: 'hover:from-orange-500 hover:to-purple-500',
      buttonText: 'text-white',
      input: 'bg-black/50 border-orange-700/50 text-white placeholder-orange-500/70 focus:ring-orange-500',
      errorBg: 'bg-red-900/40 border-red-700 text-red-300',
      confetti: ['#f97316', '#a855f7', '#f59e0b', '#ec4899'],
      logo: 'text-orange-400',
      navLink: 'text-orange-200 hover:text-white hover:bg-orange-900/30',
    }
  : {
      bg: 'from-gray-900 via-black to-indigo-900/30',
      cardBg: 'bg-gray-800/60 backdrop-blur-xl border-gray-700',
      cardHover: 'hover:shadow-2xl hover:shadow-indigo-500/30',
      text: 'text-gray-300',
      title: 'from-indigo-400 via-purple-400 to-pink-400',
      subtitle: 'text-gray-400',
      buttonPrimary: 'from-indigo-600 to-purple-600',
      buttonHover: 'hover:from-indigo-500 hover:to-purple-500',
      buttonText: 'text-white',
      input: 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:ring-indigo-500',
      errorBg: 'bg-red-900/30 border-red-700 text-red-300',
      confetti: ['#6366f1', '#8b5cf6', '#ec4899'],
      logo: 'text-white',
      navLink: 'text-gray-300 hover:text-white hover:bg-white/10',
    };

const c = theme;

export default function PricingContent() {
  const searchParams = useSearchParams();
  const errorParam = searchParams?.get('error');
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      const t = setTimeout(() => setError(null), 6000);
      return () => clearTimeout(t);
    }
  }, [errorParam]);

  const handleFreePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: c.confetti,
    });
  };

  return (
    <>
      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${c.bg}`} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.05)_0%,transparent_70%)]" />
      </div>

      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8336311096274398"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />

      {/* Nav */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 inset-x-0 bg-black/50 backdrop-blur-2xl z-50 border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 p-0.5 shadow-lg"
              >
                <div className="w-full h-full rounded-xl bg-black flex items-center justify-center">
                  <span className={`text-lg font-black ${c.logo}`}>B</span>
                </div>
              </motion.div>
              <span className={`text-xl font-black bg-clip-text text-transparent bg-gradient-to-r ${c.title}`}>
                {HALLOWEEN_MODE ? 'BooLink' : 'BioLink'}
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              {['/', '/auth/login', '/auth/signup'].map((href, i) => (
                <motion.div
                  key={href}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link
                    href={href}
                    className={clsx('px-3 py-2 rounded-lg text-sm font-medium transition-all', c.navLink)}
                  >
                    {href === '/' ? 'Home' : href.includes('login') ? 'Login' : 'Signup'}
                  </Link>
                </motion.div>
              ))}
              <motion.a
                href="https://discord.gg/29yDsapcXh"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                className={clsx(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  HALLOWEEN_MODE
                    ? 'text-purple-300 hover:text-white hover:bg-purple-900/30'
                    : 'text-indigo-300 hover:text-white hover:bg-indigo-900/30'
                )}
              >
                Discord
              </motion.a>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Main */}
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className={clsx('mb-8 p-4 rounded-xl text-center font-medium', c.errorBg)}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mb-16"
          >
            <h1 className={clsx('text-5xl sm:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r', c.title, 'mb-4')}>
              Choose Your Plan
            </h1>
            <p className={clsx('text-lg max-w-2xl mx-auto', c.subtitle)}>
              {HALLOWEEN_MODE
                ? 'Pick your potion. Brew your link. Own the night.'
                : 'Simple, transparent pricing. No hidden fees.'}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                className={clsx('relative rounded-2xl p-6 transition-all duration-300', c.cardBg, c.cardHover)}
                style={{ perspective: 1000 }}
              >
                {plan.id === 'premium' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full">
                    MOST POPULAR
                  </div>
                )}

                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                  <p className={clsx('mt-2 text-sm', c.text)}>{plan.description}</p>

                  <div className="mt-6">
                    <span className="text-4xl font-bold text-white">
                      {plan.price === 0 ? 'Free' : `£${plan.price}`}
                    </span>
                    {plan.price > 0 && <span className={clsx('text-sm ml-1', c.text)}>/month</span>}
                  </div>

                  <ul className="mt-6 space-y-3 text-left">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className={clsx('flex items-center text-sm', c.text)}>
                        <span className="text-green-400 mr-2">Check</span> {feature}
                      </li>
                    ))}
                  </ul>

                  <form
                    action={plan.id === 'free' ? '/api/subscribe' : '/api/checkout'}
                    method="POST"
                    className="mt-8"
                    onSubmit={plan.id === 'free' ? handleFreePlan : undefined}
                  >
                    <input type="hidden" name="plan" value={plan.id} />
                    {plan.price > 0 && <input type="hidden" name="price" value={String(plan.price)} />}

                    <input
                      type="email"
                      name="email"
                      placeholder="you@biolink.lol"
                      required
                      value={selectedPlan === plan.id ? email : ''}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setSelectedPlan(plan.id);
                      }}
                      className={clsx(
                        'w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all mb-3',
                        c.input
                      )}
                    />

                    <button
                      type="submit"
                      className={clsx(
                        'w-full py-3 rounded-xl font-bold transition-all duration-200 shadow-lg',
                        plan.id === 'fwiend'
                          ? 'bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-500 hover:to-red-500 text-white'
                          : `bg-gradient-to-r ${c.buttonPrimary} ${c.buttonText} ${c.buttonHover} shadow-lg`
                      )}
                    >
                      {plan.cta}
                    </button>
                  </form>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-16">
            <p className={clsx('text-sm', c.text)}>
              Already have a BioLink? Visit{' '}
              <code className="font-mono bg-white/5 px-2 py-1 rounded text-indigo-400">
                thebiolink.lol/yourname
              </code>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
