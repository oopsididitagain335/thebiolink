'use client';

import { useState } from 'react';

export default function AudioPlayer({ audioUrl }: { audioUrl: string }) {
  const [isMuted, setIsMuted] = useState(true);

  return (
    <>
      <audio src={audioUrl} autoPlay loop muted={isMuted} className="hidden" />
      <button
        onClick={() => setIsMuted(!isMuted)}
        className="fixed bottom-4 right-4 z-30 bg-gray-800/80 hover:bg-gray-700 text-white w-12 h-12 rounded-full flex items-center justify-center text-lg shadow-lg backdrop-blur-sm border border-gray-600 transition-all"
        aria-label={isMuted ? "Unmute audio" : "Mute audio"}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>
    </>
  );
}
