'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { clsx } from 'clsx';

// Toggle Halloween Mode
const HALLOWEEN_MODE = false; // false = normal BioLink

// Theme configuration
const theme = HALLOWEEN_MODE
  ? {
      name: 'BooLink',
      logoIcon: '🎃',
      title: 'Claim Your Haunted Link',
      subtitle: 'Create a spooky, fast link-in-bio page. Free forever. No tricks. Just treats.',
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
      subtitle: 'Create a stunning, lightning-fast link-in-bio page. Free forever. No tracking. Just you.',
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

// Username availability hook
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
          if (available && typeof window !== 'undefined') {
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

export default function HomePage() {
  const [username, setUsername] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [particlePositions, setParticlePositions] = useState<{ x: number; y: number }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const availability = useUsernameAvailability(username);
  const c = theme.colors;

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && theme.particles) {
      setParticlePositions(
        Array.from({ length: 8 }).map(() => ({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
        }))
      );
      if (window.innerWidth >= 768) inputRef.current?.focus();
    }
  }, []);

  const handleGo = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim().toLowerCase();
    if (trimmed && availability === true) {
      router.push(`/auth/signup?username=${encodeURIComponent(trimmed)}`);
    } else if (!trimmed) {
      inputRef.current?.focus();
    }
  };

  const isValid = /^[a-z0-9]{3,20}$/.test(username);
  const isDisabled = !username.trim() || !isValid || availability !== true;

  if (!mounted) return null; // avoid SSR issues

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

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 inset-x-0 bg-black/50 backdrop-blur-2xl z-50 border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center space-x-2">
              <div
                className={`w-9 h-9 rounded-xl bg-gradient-to-br ${theme.colors.primary} p-0.5 shadow-lg ${c.shadow}`}
              >
                <div className="w-full h-full rounded-xl bg-black flex items-center justify-center">
                  <span className="text-lg font-black text-white">{theme.logoIcon}</span>
                </div>
              </div>
              <span
                className={`text-xl font-black bg-clip-text text-transparent bg-gradient-to-r ${theme.colors.primary}`}
              >
                {theme.name}
              </span>
            </motion.div>
            <div className="flex items-center space-x-1 sm:space-x-4">
              {['/', '/news', '/pricing', '/auth/login', '/auth/signup'].map((href, i) => (
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
              ))}
              <motion.a
                href="https://discord.gg/z5EK5aJhSb"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${c.discord} ${c.discordHover} transition-all flex items-center gap-2`}
              >
                Discord
              </motion.a>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Floating particles */}
      {theme.particles &&
        particlePositions.map((pos, i) => (
          <motion.div
            key={i}
            className="absolute text-white/30 text-2xl"
            initial={{ x: pos.x, y: -50 }}
            animate={{ y: window.innerHeight + 50, x: Math.random() * window.innerWidth }}
            transition={{ duration: 20 + Math.random() * 15, repeat: Infinity, ease: 'linear', delay: Math.random() * 10 }}
          >
            {theme.particles}
          </motion.div>
        ))}

      {/* Hero & Input Section */}
      <section className="pt-28 pb-16 px-4 sm:px-6 text-center">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-600 to-orange-600 mb-8 ring-1 ring-white/10 shadow-lg"
        >
          <span className="text-5xl font-black">{theme.logoIcon}</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-5xl sm:text-6xl md:text-7xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-orange-500 leading-tight"
        >
          {theme.title}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`text-lg sm:text-xl ${c.text} max-w-2xl mx-auto mb-12 px-2`}
        >
          {theme.subtitle}
        </motion.p>

        {/* Username Input */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
          <form onSubmit={handleGo} className="max-w-xl mx-auto">
            <div
              className={clsx(
                'flex items-center rounded-2xl border-2 p-1 transition-all duration-300 backdrop-blur-xl',
                isFocused
                  ? `ring-4 ${c.inputRing} bg-black/60 ${c.inputBorder} ${c.shadow}`
                  : `bg-black/40 ${c.inputBorder} ${HALLOWEEN_MODE ? 'shadow-lg shadow-purple-900/30' : 'shadow-lg'}`
              )}
            >
              <span className={`px-5 py-4 font-mono text-lg select-none ${HALLOWEEN_MODE ? 'text-orange-300' : 'text-gray-400'}`}>
                thebiolink.lol/
              </span>
              <input
                ref={inputRef}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={HALLOWEEN_MODE ? 'witchname' : 'yourname'}
                className={`flex-1 min-w-0 bg-transparent py-4 px-2 ${c.inputText} ${c.inputPlaceholder} outline-none font-mono text-lg`}
              />
              <button
                type="submit"
                disabled={isDisabled}
                className={clsx(
                  'mx-3 px-6 py-2.5 rounded-xl font-bold transition-all duration-200 shadow-md',
                  isDisabled
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : `bg-gradient-to-r ${c.primary} ${c.buttonText} hover:${c.primaryHover} ${c.shadow}`
                )}
              >
                Claim
              </button>
            </div>
          </form>

          {/* Feedback */}
          <p className={`mt-4 text-sm ${c.feedback}`}>
            {username && !isValid ? (
              <span className={c.taken}>3–20 letters/numbers only</span>
            ) : availability === 'checking' ? (
              <span className={`${c.checking} animate-pulse`}>{HALLOWEEN_MODE ? 'Summoning spirits…' : 'Checking…'}</span>
            ) : availability === true ? (
              <span className={c.available}>Available!</span>
            ) : availability === false && username && isValid ? (
              <span className={c.taken}>{HALLOWEEN_MODE ? 'Haunted – try another' : 'Taken – try another'}</span>
            ) : (
              HALLOWEEN_MODE ? 'Choose your spooky username!' : 'Choose a unique username!'
            )}
          </p>
        </motion.div>
      </section>
    </>
  );
}
