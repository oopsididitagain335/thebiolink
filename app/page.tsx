'use client';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';
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
      logoIcon: 'Pumpkin',
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
      particles: 'Ghost',
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
        <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,${theme.fogGradient1}_0%,transparent_60%)]`} />
        <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,${theme.fogGradient2}_0%,transparent_60%)]`} />
      </div>

      {/* Floating Particles (Ghosts or none) */}
      {theme.particles && (
        <div className="fixed inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-white/30 text-2xl"
              initial={{ x: Math.random() * window.innerWidth, y: -50 }}
              animate={{ y: window.innerHeight + 50, x: Math.random() * windowaked.innerWidth }}
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
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center space-x-2">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${theme.colors.primary} p-0.5 shadow-lg ${c.shadow}`}>
                <div className="w-full h-full rounded-xl bg-black flex items-center justify-center">
                  <span className={`text-lg font-black ${HALLOWEEN_MODE ? 'text-orange-400' : 'text-white'}`}>
                    {HALLOWEEN_MODE ? theme.logoIcon : 'B'}
                  </span>
                </div>
              </div>
              <span className={`text-xl font-black bg-clip-text text-transparent bg-gradient-to-r ${theme.colors.primary}`}>
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
                href="https://discord.gg/29yDsapcXh"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${c.discord} ${c.discordHover} transition-all flex items-center gap-2`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.198.363-.437.828-.635 1.222a18.6 18.6 0 0 0-5.487 0a12.69 12.69 0 0 0-.635-1.222a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.207-1.967a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.027-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.027.128a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.106c.36.698.772 1.362 1.206 1.967a.078.078 0 0 0 .084.028a19.839 19.839 0 0 0 6.03-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.175 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.175 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418z" />
                </svg>
                Discord
              </motion.a>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          {/* Logo */}
          <motion.div
            initial={HALLOWEEN_MODE ? { scale: 0, rotate: -180 } : { scale: 0.8, opacity: 0 }}
            animate={HALLOWEEN_MODE ? { scale: 1, rotate: 0 } : { scale: 1, opacity: 1 }}
            transition={HALLOWEEN_MODE ? { type: "spring", stiffness: 200, damping: 15 } : { duration: 0.6 }}
            className={`inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br ${theme.colors.primary}/30 mb-8 ring-1 ring-white/10 ${HALLOWEEN_MODE ? c.shadow : ''}`}
          >
            <span className={`text-5xl font-black ${HALLOWEEN_MODE ? '' : 'bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300'}`}>
              {HALLOWEEN_MODE ? theme.logoIcon : 'B'}
            </span>
          </motion.div>

          {/* Title */}
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

          {/* Input Card */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="relative max-w-xl mx-auto mb-12"
            style={{ perspective: 1000 }}
          >
            <motion.div
              animate={{ rotateX: isFocused ? -5 : 0, rotateY: isFocused ? 5 : 0 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <form onSubmit={handleGo}>
                <div
                  className={clsx(
                    'flex items-center rounded-2xl transition-all duration-300 backdrop-blur-xl border-2 p-1',
                    isFocused
                      ? `ring-4 ${c.inputRing} bg-black/60 ${c.inputBorder} ${c.shadow}`
                      : `bg-black/40 ${c.inputBorder} ${HALLOWEEN_MODE ? 'shadow-lg shadow-purple-900/30' : 'shadow-lg'}`
                  )}
                >
                  <span className={`px-5 py-4 ${HALLOWEEN_MODE ? 'text-orange-300' : 'text-gray-400'} font-mono text-lg select-none`}>
                    thebiolink.lol/
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={HALLOWEEN_MODE ? "witchname" : "yourname"}
                    className={`flex-1 min-w-0 bg-transparent py-4 px-2 ${c.inputText} ${c.inputPlaceholder} outline-none font-mono text-lg`}
                  />
                  <AnimatePresence>
                    {username && isValid && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale:: 0.8 }}
                        className={`px-3 py-4 text-sm font-mono ${HALLOWEEN_MODE ? 'text-orange-300' : 'text-indigo-300'}`}
                      >
                        thebiolink.lol/<span className={c.inputText}>{username}</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <button
                    type="submit"
                    disabled={isDisabled}
                    className={clsx(
                      'mx-3 px-6 py-2.5 rounded-xl font-bold transition-all duration-200 shadow-md',
                      isDisabled
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : `bg-gradient-to-r ${theme.colors.primary} ${c.buttonText} hover:${theme.colors.primaryHover} ${c.shadow}`
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
                  <span className={c.checking + ' animate-pulse'}>{HALLOWEEN_MODE ? 'Summoning spirits…' : 'Checking…'}</span>
                ) : availability === true ? (
                  <span className={c.available}>Available!</span>
                ) : availability === false && username && isValid ? (
                  <span className={c.taken}>{HALLOWEEN_MODE ? 'Haunted – try another' : 'Taken – try another'}</span>
                ) : (
                  HALLOWEEN_MODE ? 'Choose your spooky username!' : 'Choose a unique username!'
                )}
              </p>
            </motion.div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/auth/signup"
              className={`px-8 py-4 rounded-2xl font-bold text-lg bg-gradient-to-r ${theme.colors.primary} ${c.buttonText} hover:${theme.colors.primaryHover} transition-all ${c.shadow}`}
            >
              Start for Free
            </Link>
            <Link
              href="/auth/login"
              className={`px-8 py-4 rounded-2xl font-bold text-lg bg-black/60 ${HALLOWEEN_MODE ? 'text-orange-200' : 'text-white'} hover:bg-black/80 backdrop-blur-sm border ${HALLOWEEN_MODE ? 'border-orange-800/50' : 'border-gray-700'} transition-colors`}
            >
              Sign In
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
