// app/[username]/page.tsx
import { notFound } from 'next/navigation';
import { getUserByUsername } from '@/lib/storage';

// ✅ Define interfaces for type safety
interface Badge {
  id: string;
  name: string;
  icon: string;
  awardedAt: string;
}

interface Link {
  id: string;
  url: string;
  title: string;
  icon?: string;
}

interface UserData {
  name: string;
  avatar?: string;
  bio?: string;
  background?: string;
  links: Link[];
  badges: Badge[]; // ✅ Include badges
  isBanned: boolean; // ✅ Include ban status
}

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function UserPage({ params }: PageProps) {
  const { username } = await params;
  
  try {
    const userData = await getUserByUsername(username);
    
    // ✅ Handle case where user doesn't exist
    if (!userData) {
      notFound();
    }

    // ✅ Handle banned user
    if (userData.isBanned) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <div className="w-24 h-24 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">Account Suspended</h1>
            <p className="text-gray-400 mb-6">
              This user's account has been suspended due to violation of our terms of service.
            </p>
            
            <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-300">
                If you are the account holder and believe this is an error, please contact support.
              </p>
            </div>
            
            <p className="text-xs text-gray-500">
              Powered by The BioLink
            </p>
            <a 
              href="/" 
              className="text-indigo-400 hover:text-indigo-300 hover:underline"
            >
              Create your own
            </a>
          </div>
        </div>
      );
    }

    // ✅ Destructure with defaults
    const { name = '', avatar = '', bio = '', background = '', links = [], badges = [] } = userData as UserData;

    return (
      <div className="min-h-screen relative">
        {/* ✅ Background GIF */}
        {background && (
          <div 
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url(${background})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
        )}
        
        {/* ✅ Overlay for readability */}
        <div className="absolute inset-0 bg-black/70 z-10"></div>
        
        {/* ✅ Transparent container in front of GIF */}
        <div className="relative z-20 flex items-center justify-center p-4 min-h-screen">
          <div className="w-full max-w-md">
            {/* ✅ Profile Box with Transparent Background */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              {/* ✅ User Info */}
              <div className="flex items-center mb-4">
                {avatar ? (
                  <img 
                    src={avatar} 
                    alt={name} 
                    className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-white/30"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl text-white font-bold">
                      {name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="ml-4">
                  <h1 className="text-2xl font-bold text-white mb-2">{name}</h1>
                  {bio && <p className="text-gray-300 mb-4">{bio}</p>}
                </div>
              </div>

              {/* ✅ Badges Section - Same Box */}
              {badges.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <h2 className="text-lg font-semibold text-white mb-3">Badges</h2>
                  <div className="flex flex-wrap gap-2">
                    {badges.map((badge: Badge) => (
                      <div 
                        key={badge.id} 
                        className="group relative"
                        title={`${badge.name} - Awarded: ${new Date(badge.awardedAt).toLocaleDateString()}`}
                      >
                        <div className="flex items-center bg-white/20 hover:bg-white/30 border border-white/30 rounded-full px-3 py-1.5 transition-all">
                          <img 
                            src={badge.icon} 
                            alt={badge.name} 
                            className="w-5 h-5 mr-2" 
                          />
                          <span className="text-white text-sm font-medium">{badge.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ✅ Links Section - Transparent Background */}
            <div className="mt-6 space-y-3">
              {links
                .filter((link: Link) => link.url && link.title)
                .map((link: Link) => (
                  <div 
                    key={link.id}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{link.title}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
            </div>
            
            {/* ✅ Footer */}
            <div className="mt-8 text-center text-gray-500 dark:text-gray-400 text-sm">
              <p>Powered by The BioLink</p>
              <a 
                href="/" 
                className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline transition-colors"
              >
                Create your own
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Database error:', error);
    notFound();
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  try {
    const userData = await getUserByUsername(username);
    
    // ✅ Handle banned user in metadata
    if (!userData || userData.isBanned) {
      return { title: 'User Not Found | The BioLink' };
    }
    
    return {
      title: `${userData.name || username} | The BioLink`,
      description: userData.bio || `Check out ${userData.name || username}'s links`,
      openGraph: {
        title: `${userData.name || username} | The BioLink`,
        description: userData.bio || `Check out ${userData.name || username}'s links`,
        images: userData.avatar ? [userData.avatar] : [],
      },
    };
  } catch (error) {
    return { title: 'User Not Found | The BioLink' };
  }
}
