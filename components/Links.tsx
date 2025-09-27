'use client';

import { useState } from 'react';

interface Link {
  id: string;
  url: string;
  title: string;
  icon?: string;
  position?: number;
}

interface LinksProps {
  links: Link[];
}

export default function Links({ links }: LinksProps) {
  const [linkIcons, setLinkIcons] = useState<{ [key: string]: string | undefined }>(
    Object.fromEntries(links.map(link => [link.id, link.icon]))
  );

  const handleLinkError = (linkId: string, title: string, icon: string | undefined) => {
    console.log(`Failed to load link icon for ${title}: ${icon}`);
    setLinkIcons(prev => ({ ...prev, [linkId]: '/fallback-link-icon.png' }));
  };

  return (
    <div className="space-y-3 mb-8">
      {links
        .filter(link => link.url && link.title)
        .map(link => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-4 text-left transition-all duration-200 hover:translate-x-1"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {linkIcons[link.id] ? (
                  <img
                    src={linkIcons[link.id]}
                    alt={link.title}
                    className="w-6 h-6 mr-3"
                    onError={() => handleLinkError(link.id, link.title, link.icon)}
                  />
                ) : (
                  <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a2 2 0 00-2.828 0l-6 6a2 2 0 002.828 2.828l6-6a2 2 0 000-2.828z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17.25V21h3.75C8.55 21 10.69 19.75 11.5 18.25a10.05 10.05 0 0011-11C22.49 6.35 20.7 4.5 18.25 4.5h-3.75" />
                    </svg>
                  </div>
                )}
                <span className="text-white font-medium">{link.title}</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>
        ))}
    </div>
  );
}
