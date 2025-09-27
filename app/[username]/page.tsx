import { notFound } from 'next/navigation';
import { getUserByUsername, getUserByUsernameForMetadata } from '@/lib/storage';

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
  badges: Badge[];
  links: Link[];
  isBanned: boolean;
  profileViews: number;
}

interface PageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ clientId?: string }>;
}

export default async function UserPage({ params, searchParams }: PageProps) {
  const { username } = await params;
  const { clientId = '' } = await searchParams;

  try {
    const userData = await getUserByUsername(username, clientId || crypto.randomUUID());

    if (!userData) {
      notFound();
    }

    // Handle banned user
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

            <p className="text-xs text-gray-500 mt-6">
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

    const { name = '', avatar = '', bio = '', background = '', badges = [], links = [], profileViews = 0 } = userData as UserData;

    return (
      <div className="min-h-screen relative">
        {/* Client-side script to set clientId in localStorage */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                let clientId = localStorage.getItem('clientId');
                if (!clientId) {
                  clientId = crypto.randomUUID();
                  localStorage.setItem('clientId', clientId);
                }
                // Redirect to include clientId in search params if not present
                if (!window.location.search.includes('clientId')) {
                  const url = new URL(window.location);
                  url.searchParams.set('clientId', clientId);
                  window.history.replaceState({}, '', url);
                }
              })();
            `,
          }}
        />

        {/* Background GIF */}
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

        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-black/70 z-10"></div>

        <div className="relative z-20 flex items-center justify-center p-4 min-h-screen">
          <div className="w-full max-w-md">
            {/* Profile Card with Transparent Background */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-center mb-6">
              {avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-white/30"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl text-white font-bold">
                    {name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              <h1 className="text-2xl font-bold text-white mb-2">{name}</h1>

              {bio && <p className="text-gray-200 mb-4 max-w-xs mx-auto">{bio}</p>}

              {/* Profile Views Display */}
              <div className="text-gray-300 text-sm mb-4">
                <span className="flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {profileViews.toLocaleString()} {profileViews === 1 ? 'view' : 'views'}
                </span>
              </div>

              {/* Badges Section */}
              {badges.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <h3 className="text-md font-semibold text-gray-300 mb-2">Badges</h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {badges.map((badge) => (
                      <div
                        key={badge.id}
                        className="group relative"
                        title={`${badge.name} - Awarded: ${new Date(badge.awardedAt).toLocaleDateString()}`}
                      >
                        <div className="flex items-center bg-white/20 hover:bg-white/30 border border-white/30 rounded-full px-3 py-1.5 transition-all">
                          <img src={badge.icon} alt={badge.name} className="w-5 h-5 mr-2" />
                          <span className="text-white text-sm font-medium">{badge.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-center space-x-2 mt-6">
                <div className="w-1.5 h-1.5 bg-white/30 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-white/30 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-white/30 rounded-full"></div>
              </div>
            </div>

            {/* Links with Transparent Background */}
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
                        {link.icon ? (
                          <img src={link.icon} alt={link.title} className="w-6 h-6 mr-3" />
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

            <div className="text-center text-gray-300 text-sm">
              <p className="mb-2">Powered by The BioLink</p>
              <a
                href="/"
                className="text-indigo-300 hover:text-indigo-200 hover:underline transition-colors"
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
    const userData = await getUserByUsernameForMetadata(username);

    if (!userData) {
      return { title: 'User Not Found | The BioLink' };
    }

    // Handle banned user in metadata
    if (userData.isBanned) {
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
