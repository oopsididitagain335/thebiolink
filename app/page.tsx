'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { clsx } from 'clsx';

interface Theme {
  name: string;
  emoji: string;
  bg: string;
  color: string;
  particles?: string;
}

const themes: Theme[] = [
  {
    name: 'Rainbow',
    emoji: '🌈',
    bg: 'bg-gradient-to-r from-pink-500 via-yellow-500 to-purple-500',
    color: 'text-white',
    particles: '✨',
  },
  {
    name: 'Ocean',
    emoji: '🌊',
    bg: 'bg-gradient-to-r from-blue-500 to-teal-400',
    color: 'text-white',
    particles: '💧',
  },
  {
    name: 'Forest',
    emoji: '🌲',
    bg: 'bg-gradient-to-r from-green-600 to-lime-500',
    color: 'text-white',
    particles: '🍃',
  },
  {
    name: 'Sunset',
    emoji: '🌅',
    bg: 'bg-gradient-to-r from-orange-500 to-pink-600',
    color: 'text-white',
    particles: '☀️',
  },
];

export default function HomePage() {
  const [theme, setTheme] = useState<Theme>(themes[0]);
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<{ startX: number; endX: number }[]>([]);

  // Ensure client-side only rendering
  useEffect(() => {
    setMounted(true);

    // Only generate particle positions on client
    if (typeof window !== 'undefined' && theme.particles) {
      const newParticles = Array.from({ length: 8 }).map(() => ({
        startX: Math.random() * window.innerWidth,
        endX: Math.random() * window.innerWidth,
      }));
      setParticles(newParticles);
    }
  }, [theme]);

  if (!mounted) return null; // avoid hydration mismatch

  const handleConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <main
      className={clsx(
        'min-h-screen flex flex-col items-center justify-center transition-all duration-700 relative overflow-hidden',
        theme.bg,
        theme.color
      )}
    >
      {/* Floating particles */}
      {theme.particles && (
        <div className="fixed inset-0 pointer-events-none">
          <AnimatePresence>
            {particles.map((p, i) => (
              <motion.div
                key={i}
                className="absolute text-white/30 text-2xl"
                initial={{ x: p.startX, y: -50 }}
                animate={{ y: window.innerHeight + 50, x: p.endX }}
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
          </AnimatePresence>
        </div>
      )}

      {/* Content */}
      <motion.h1
        className="text-5xl font-bold mb-4 drop-shadow-lg"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {theme.emoji} Theme Playground
      </motion.h1>

      <p className="text-lg mb-8 opacity-90">Select your vibe and celebrate 🎉</p>

      {/* Theme Buttons */}
      <div className="flex flex-wrap justify-center gap-4">
        {themes.map((t) => (
          <motion.button
            key={t.name}
            onClick={() => {
              setTheme(t);
              handleConfetti();
            }}
            className={clsx(
              'px-6 py-3 rounded-2xl font-semibold shadow-md transition-transform hover:scale-110',
              t.bg,
              'text-white'
            )}
            whileTap={{ scale: 0.9 }}
          >
            {t.emoji} {t.name}
          </motion.button>
        ))}
      </div>

      <div className="absolute bottom-6 text-sm opacity-70">
        Built with ❤️ using Next.js & Framer Motion
      </div>
    </main>
  );
}
