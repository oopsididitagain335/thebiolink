// components/BioCard.tsx
import Image from 'next/image';

interface BioCardProps {
  name: string;
  avatar?: string;
  bio?: string;
  badges?: Array<{
    id: string;
    name: string;
    icon: string;
    awardedAt: string;
  }>;
}

export default function BioCard({ name, avatar, bio, badges = [] }: BioCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
      {avatar ? (
        <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-md">
          <Image
            src={avatar}
            alt={name}
            fill
            className="object-cover"
            sizes="96px"
          />
        </div>
      ) : (
        <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl text-white font-bold">{name.charAt(0).toUpperCase()}</span>
        </div>
      )}
      
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{name}</h1>
      
      {bio && <p className="text-gray-600 dark:text-gray-300 mb-4">{bio}</p>}
      
      {/* ✅ Badges Section */}
      {badges.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Badges</h3>
          <div className="flex flex-wrap justify-center gap-2">
            {badges.map((badge) => (
              <div 
                key={badge.id} 
                className="group relative"
                title={`${badge.name} - Awarded: ${new Date(badge.awardedAt).toLocaleDateString()}`}
              >
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                  <img src={badge.icon} alt={badge.name} className="w-6 h-6 mr-2" />
                  <span className="text-gray-800 dark:text-white text-sm font-medium">{badge.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex justify-center space-x-2 mt-6">
        <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
      </div>
    </div>
  );
}
