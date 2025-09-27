'use client';

import { useState } from 'react';

interface Badge {
  id: string;
  name: string;
  icon: string;
  awardedAt: string;
}

interface BadgesProps {
  badges: Badge[];
}

export default function Badges({ badges }: BadgesProps) {
  const [badgeIcons, setBadgeIcons] = useState<{ [key: string]: string }>(
    Object.fromEntries(badges.map(badge => [badge.id, badge.icon]))
  );

  const handleBadgeError = (badgeId: string, badgeName: string, icon: string) => {
    console.log(`Failed to load badge icon for ${badgeName}: ${icon}`);
    setBadgeIcons(prev => ({ ...prev, [badgeId]: '/fallback-badge.png' }));
  };

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {badges.map(badge => (
        <div
          key={badge.id}
          className="group relative"
          title={`${badge.name} - Awarded: ${new Date(badge.awardedAt).toLocaleDateString()}`}
        >
          <div className="flex items-center bg-white/20 hover:bg-white/30 border border-white/30 rounded-full px-3 py-1.5 transition-all">
            <img
              src={badgeIcons[badge.id]}
              alt={badge.name}
              className="w-5 h-5 mr-2"
              onError={() => handleBadgeError(badge.id, badge.name, badge.icon)}
            />
            <span className="text-white text-sm font-medium">{badge.name}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
