// app/discovery/ProfileCard.tsx
'use client';

export default function ProfileCard({
  username,
  name,
  avatar,
  bio,
}: {
  username: string;
  name: string;
  avatar?: string;
  bio?: string;
}) {
  return (
    <a
      href={`https://thebiolink.lol/${username}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 text-center hover:bg-gray-700/50 transition-all duration-200 group"
    >
      {avatar ? (
        <div className="relative w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-2 border-white/30">
          <img
            src={avatar}
            alt={name}
            className="object-cover w-full h-full"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      ) : (
        <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl text-white font-bold">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      <h3 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">
        {name}
      </h3>

      <p className="text-indigo-400 hover:text-indigo-300 font-mono text-sm mb-3 transition-colors">
        thebiolink.lol/{username}
      </p>

      {bio && (
        <p className="text-gray-400 text-sm line-clamp-2">
          {bio}
        </p>
      )}

      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">View Profile →</p>
      </div>
    </a>
  );
}
