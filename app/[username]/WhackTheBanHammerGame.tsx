// app/[username]/WhackTheBanHammerGame.tsx
'use client';

import { useState, useEffect } from 'react';

export default function WhackTheBanHammerGame() {
  const [hammers, setHammers] = useState<boolean[]>(Array(6).fill(false));
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(true);

  useEffect(() => {
    if (!gameActive) return;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * 6);
      setHammers((prev) => {
        const newState = [...prev];
        newState[randomIndex] = true;
        return newState;
      });

      setTimeout(() => {
        setHammers((prev) => {
          const newState = [...prev];
          newState[randomIndex] = false;
          return newState;
        });
      }, 1200);
    }, Math.random() * 700 + 800);

    return () => clearInterval(interval);
  }, [gameActive]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setGameActive(false);
    }, 15000);
    return () => clearTimeout(timer);
  }, []);

  const whack = (index: number) => {
    if (hammers[index]) {
      setScore((s) => s + 1);
      setHammers((prev) => {
        const newState = [...prev];
        newState[index] = false;
        return newState;
      });
    }
  };

  return (
    <div className="relative">
      <div className="text-xs text-gray-500 mb-2">
        Score: <span className="font-bold text-red-400">{score}</span> |{' '}
        {gameActive ? 'Time left: 15s' : 'Game Over'}
      </div>
      <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
        {hammers.map((visible, i) => (
          <button
            key={i}
            onClick={() => whack(i)}
            disabled={!gameActive}
            className={`w-12 h-12 rounded-lg flex items-center justify-center text-white text-lg font-bold transition-transform ${
              visible
                ? 'bg-red-600 hover:bg-red-700 scale-110'
                : 'bg-gray-800 cursor-default'
            } ${!gameActive ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {visible ? '🔨' : ''}
          </button>
        ))}
      </div>
      {!gameActive && score === 0 && (
        <p className="text-xs text-gray-500 mt-2">Ban remains... forever.</p>
      )}
      {!gameActive && score > 0 && (
        <p className="text-xs text-green-400 mt-2">Nice try. Still banned.</p>
      )}
    </div>
  );
}
