// components/TypingBio.tsx
'use client';

import { useState, useEffect } from 'react';

interface TypingBioProps {
  bio: string;
}

export default function TypingBio({ bio }: TypingBioProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(100);

  useEffect(() => {
    const handleTyping = () => {
      const fullText = bio;
      const current = displayedText;
      const isEnd = loopNum === 2;

      if (isDeleting) {
        setDisplayedText(fullText.substring(0, current.length - 1));
      } else {
        setDisplayedText(fullText.substring(0, current.length + 1));
      }

      setTypingSpeed(isDeleting ? 50 : 100);

      if (!isDeleting && current === fullText) {
        setTimeout(() => setIsDeleting(true), 1000);
      } else if (isDeleting && current === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, loopNum, bio, typingSpeed]);

  return (
    <div className="text-gray-300 text-sm font-medium">
      {displayedText}
      <span className="inline-block w-1 h-5 bg-white ml-1 animate-blink"></span>
    </div>
  );
}
