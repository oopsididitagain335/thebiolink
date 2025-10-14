// components/Avatar.tsx
'use client';

import { useState } from 'react';

interface AvatarProps {
  name: string;
  avatar?: string;
  size?: 'sm' | 'md' | 'lg'; // optional size prop
}

export default function Avatar({ name, avatar, size = 'lg' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-10 h-10 text-lg',
    md: 'w-16 h-16 text-xl',
    lg: 'w-24 h-24 text-2xl',
  };

  const [imgSrc, setImgSrc] = useState<string | undefined>(avatar);

  const handleError = () => {
    console.log(`Failed to load avatar for ${name}: ${avatar}`);
    setImgSrc('/fallback-avatar.png');
  };

  const classes = `${sizeClasses[size]} rounded-full mx-auto mb-4 border-2 border-white/30`;

  if (imgSrc) {
    return (
      <img
        src={imgSrc}
        alt={name}
        className={classes}
        onError={handleError}
      />
    );
  }

  return (
    <div
      className={`${classes} bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
