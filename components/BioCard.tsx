"use client";

import Image from 'next/image';

interface BioCardProps {
  name: string;
  avatar?: string;
  bio?: string;
}

export default function BioCard({ name, avatar, bio }: BioCardProps) {
  const safeAvatar = avatar ? encodeURI(decodeURI(avatar)) : '';
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center transition-colors duration-200">
      {avatar ? (
        <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-md">
          <Image
            src={safeAvatar}
            alt={name}
            fill
            className="object-cover"
            sizes="96px"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div class="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span class="text-4xl text-white font-bold">${name.charAt(0).toUpperCase()}</span>
                  </div>
                `;
              }
            }}
          />
        </div>
      ) : (
        <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
          <span className="text-4xl text-white font-bold">{name.charAt(0).toUpperCase()}</span>
        </div>
      )}
      
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{name}</h1>
      
      {bio && (
        <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-xs mx-auto">
          {bio}
        </p>
      )}
      
      <div className="flex justify-center space-x-2 mt-2">
        <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
      </div>
    </div>
  );
}
