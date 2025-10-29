'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';
// ✅ Fix: Add this line to silence the TS type error
// You can also move it to a separate `types.d.ts` file.
declare module 'canvas-confetti';
import confetti from 'canvas-confetti';
import { clsx } from 'clsx';

/* ==============================================================
   TOGGLE HALLOWEEN MODE HERE
   ============================================================== */
const HALLOWEEN_MODE = true; // ← Change to `false` to disable Halloween

/* ==============================================================
   Theme Config (Auto-switches based on HALLOWEEN_MODE)
   ============================================================== */
const theme = HALLOWEEN_MODE
  ? {
      name: 'BooLink',
      logoIcon: '🎃',
      title: 'Claim Your Haunted Link',
      subtitle:
        'Create a spooky, fast link-in-bio page. Free forever. No tricks. Just treats.',
      colors: {
        primary: 'from-orange-600 to-purple-600',
        primaryHover: 'from-orange-500 to-purple-500',
        text: 'text-orange-200',
        inputBorder: 'border-orange-500/60',
        inputRing: 'ring-orange-500/50',
        shadow: 'shadow-orange-600/40',
        buttonText: 'text-white',
        navLink: 'text-orange-200',
        navLinkHover: 'hover:text-white hover:bg-orange-900/30',
        discord: 'text-purple-300',
        discordHover: 'hover:text-white hover:bg-purple-900/30',
        inputPlaceholder: 'placeholder-orange-500/70',
        inputText: 'text-white',
        feedback: 'text-orange-200',
        available: 'text-green-400',
        taken: 'text-red-400',
        checking: 'text-yellow-300',
      },
      particles: '👻',
      confettiColors: ['#f97316', '#a855f7', '#f59e0b', '#ec4899'],
      bgGradient: 'from-black via-purple-950 to-orange-950/20',
      fogGradient1: 'rgba(139,92,246,0.15)',
      fogGradient2: 'rgba(249,115,22,0.15)',
    }
  : {
      name: 'BioLink',
      logoIcon: 'B',
      title: 'Own Your Link',
      subtitle:
        'Create a stunning, lightning-fast link-in-bio page. Free forever. No tracking. Just you.',
      colors: {
        primary: 'from-indigo-600 to-purple-600',
        primaryHover: 'from-indigo-500 to-purple-500',
        text: 'text-gray-400',
        inputBorder: 'border-gray-700/60',
        inputRing: 'ring-indigo-500/50',
        shadow: 'shadow-indigo-500/20',
        buttonText: 'text-white',
        navLink: 'text-gray-300',
        navLinkHover: 'hover:text-white hover:bg-white/5',
        discord: 'text-indigo-300',
        discordHover: 'hover:text-white hover:bg-indigo-900/30',
        inputPlaceholder: 'placeholder-gray-500',
        inputText: 'text-white',
        feedback: 'text-gray-500',
        available: 'text-green-400',
        taken: 'text-red-400',
        checking: 'text-yellow-400',
      },
      particles: null,
      confettiColors: ['#6366f1', '#8b5cf6', '#ec4899'],
      bgGradient: 'from-gray-900 via-black to-indigo-900/20',
      fogGradient1: 'rgba(120,119,198,0.3)',
      fogGradient2: 'rgba(255,119,198,0.3)',
    };

/* --------------------------------------------------------------
   Live Username Availability – uses /api/username
   -------------------------------------------------------------- */
const useUsernameAvailability = (username: string) => {
  const [status, setStatus] = useState<'idle' | 'checking' | boolean>('idle');

  useEffect(() => {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed || !/^[a-z0-9]{3,20}$/.test(trimmed)) {
      setStatus('idle');
      return;
    }

    setStatus('checking');

    const timer = setTimeout(() => {
      fetch(`/api/username?username=${encodeURIComponent(trimmed)}`)
        .then((res) => res.json())
        .then((data) => {
          const available = data.available === true;
          setStatus(available);
          if (available) {
            confetti({
              particleCount: 70,
              spread: 100,
              origin: { y: 0.65 },
              colors: theme.confettiColors,
              scalar: 0.8,
              ticks: 80,
            });
          }
        })
        .catch(() => setStatus(false));
    }, 400);

    return () => clearTimeout(timer);
  }, [username]);

  return status;
};

/* --------------------------------------------------------------
   Main Component
   -------------------------------------------------------------- */
export default function HomePage() {
  const [username, setUsername] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const availability = useUsernameAvailability(username);

  const handleGo = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim().toLowerCase();
    if (trimmed && availability === true) {
      router.push(`/auth/signup?username=${encodeURIComponent(trimmed)}`);
    } else if (!trimmed) {
      inputRef.current?.focus();
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      inputRef.current?.focus();
    }
  }, []);

  const isValid = /^[a-z0-9]{3,20}$/.test(username);
  const isDisabled = !username.trim() || !isValid || availability !== true;
  const c = theme.colors;

  return (
    <>
      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.bgGradient}`} />
        <div
          className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,${theme.fogGradient1}_0%,transparent_60%)]`}
        />
        <div
          className={`absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,${theme.fogGradient2}_0%,transparent_60%)]`}
        />
      </div>

      {/* Floating Particles */}
      {theme.particles && (
        <div className="fixed inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-white/30 text-2xl"
              initial={{ x: Math.random() * window.innerWidth, y: -50 }}
              animate={{
                y: window.innerHeight + 50,
                x: Math.random() * window.innerWidth,
              }}
              transition={{
                duration: 20 + Math.random() * 15,
                repeat: Infinity,
                ease: 'linear',
                delay: Math.random() * 10,
              }}
            >
              {theme.particles}
            </motion.div>
          ))}
        </div>
      )}

      {/* Google AdSense */}
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8336311096274398"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 inset-x-0 bg-black/50 backdrop-blur-2xl z-50 border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-2"
            >
              <div
                className={`w-9 h-9 rounded-xl bg-gradient-to-br ${theme.colors.primary} p-0.5 shadow-lg ${c.shadow}`}
              >
                <div className="w-full h-full rounded-xl bg-black flex items-center justify-center">
                  <span
                    className={`text-lg font-black ${
                      HALLOWEEN_MODE ? 'text-orange-400' : 'text-white'
                    }`}
                  >
                    {HALLOWEEN_MODE ? theme.logoIcon : 'B'}
                  </span>
                </div>
              </div>
              <span
                className={`text-xl font-black bg-clip-text text-transparent bg-gradient-to-r ${theme.colors.primary}`}
              >
                {theme.name}
              </span>
            </motion.div>
            <div className="flex items-center space-x-1 sm:space-x-4">
              {['/', '/news', '/pricing', '/auth/login', '/auth/signup'].map(
                (href, i) => (
                  <motion.div
                    key={href}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <Link
                      href={href}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${c.navLink} ${c.navLinkHover} transition-all backdrop-blur-sm`}
                    >
                      {href === '/' && 'Home'}
                      {href === '/news' && 'News'}
                      {href === '/pricing' && 'Pricing'}
                      {href === '/auth/login' && 'Login'}
                      {href === '/auth/signup' && 'Signup'}
                    </Link>
                  </motion.div>
                )
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-4 sm:px-6 text-center">
        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`text-5xl sm:text-6xl md:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r ${theme.colors.primary} mb-6 leading-tight`}
        >
          {theme.title}
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`text-lg sm:text-xl ${c.text} max-w-2xl mx-auto mb-12 px-2`}
        >
          {theme.subtitle}
        </motion.p>
      </section>
    </>
  );
}
