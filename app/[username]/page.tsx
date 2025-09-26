// app/[username]/page.tsx
import { notFound } from 'next/navigation';
import { getUserByUsername } from '@/lib/storage';
import Link from 'next/link';

interface LinkItem {
  id: string;
  url: string;
  title: string;
  icon?: string;
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  awardedAt: string;
}

interface UserData {
  name: string;
  avatar?: string;
  bio?: string;
  background?: string;
  links: LinkItem[];
  badges: Badge[]; // ✅ Include badges in interface
}

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function UserPage({ params }: PageProps) {
  const { username } = await params;

  try {
    const userData = await getUserByUsername(username);
    if (!userData) {
      notFound();
    }

    // Destructure with defaults
    const { name = '', avatar = '', bio = '', background = '', links = [], badges = [] } = userData as UserData;

    return (
      <div className="min-h-screen relative">
        {/* Background GIF */}
        {background && (
          <div
            className="absolute inset-0 z-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${background})`,
            }}
          />
        )}

        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-black/70 z-10"></div>

        <div className="relative z-20 flex items-center justify-center p-4 min-h-screen">
          <div className="w-full max-w-md">
            {/* Profile Card */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center mb-6">
              {avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  className="w-24 h-24 rounded-full mx-auto mb-6 border-2 border-white/30"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl text-white font-bold">
                    {name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              <h1 className="text-2xl font-bold text-white mb-2">{name}</h1>

              {bio && <p className="text-gray-200 mb-6 max-w-xs mx-auto">{bio}</p>}

              {/* ✅ Badges Section */}
              {badges && badges.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">Badges</h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {badges.map((badge) => (
                      <div
                        key={badge.id}
                        className="group relative"
                        title={`${badge.name} - Awarded: ${new Date(badge.awardedAt).toLocaleDateString()}`}
                      >
                        <div className="flex items-center bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-3 py-1.5 transition-all">
                          <img
                            src={badge.icon}
                            alt={badge.name}
                            className="w-5 h-5 mr-2"
                          />
                          <span className="text-white text-xs font-medium">{badge.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* End Badges Section */}

              <div className="flex justify-center space-x-2 mt-6">
                <div className="w-1.5 h-1.5 bg-white/30 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-white/30 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-white/30 rounded-full"></div>
              </div>
            </div>

            {/* Links */}
            <div className="space-y-3 mb-8">
              {links
                .filter((link: LinkItem) => link.url && link.title)
                .map((link: LinkItem) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-4 text-left transition-all duration-200 hover:translate-x-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{link.title}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </a>
                ))}
            </div>

            {/* Footer */}
            <div className="text-center text-gray-300 text-sm">
              <p className="mb-2">Powered by The BioLink</p>
              <Link
                href="/"
                className="text-indigo-300 hover:text-indigo-200 hover:underline transition-colors"
              >
                Create your own
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Public Profile Page Error:', error);
    notFound();
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  try {
    const userData = await getUserByUsername(username);

    if (!userData) {
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
