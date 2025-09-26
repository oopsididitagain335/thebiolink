// components/ImageWithFallback.tsx
'use client';

import { useState } from 'react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackElement?: React.ReactNode;
}

export default function ImageWithFallback({ 
  src, 
  alt, 
  className = '',
  fallbackElement 
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return fallbackElement || (
      <div className={`bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}
