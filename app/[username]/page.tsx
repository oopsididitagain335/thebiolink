import { getUserByUsername, getUserByUsernameForMetadata } from '@/lib/storage';
import Avatar from '@/components/Avatar';
import Badges from '@/components/Badges';
import Links from '@/components/Links';

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
  position?: number;
}

interface UserData {
  name: string;
  avatar?: string;
  bio?: string;
  background?: string;
  backgroundVideo?: string;
  backgroundAudio?: string;
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
  console.log('UserPage:', { username, clientId });

  try {
    const userData = await getUserByUsername(username, clientId);
    if (!userData) {
      console.log(`User not found for username: ${username}`);
      return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-2">User Not Found</h1>
            <p className="text-gray-400 mb-6">The user profile you are looking for does not exist.</p>
            <a href="/" className="text-indigo-400 hover:text-indigo-300 hover:underline">
              Return Home
            </a>
          </div>
        </div>
      );
    }

    if (userData.isBanned) {
      console.log(`User banned: ${username}`);
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
            <a href="/" className="text-indigo-400 hover:text-indigo-300 hover:underline">
              Create your own
            </a>
          </div>
        </div>
      );
    }

    const { name = '', avatar = '', bio = '', background = '', backgroundVideo = '', backgroundAudio = '', badges = [], links = [], profileViews = 0 } = userData as UserData;

    // Validate background and backgroundVideo URLs
    const isValidBackground = background && /\.(gif|png|jpg|jpeg|webp)$/i.test(background);
    const isValidBackgroundVideo = backgroundVideo && /\.(mp4|webm|ogg)$/i.test(backgroundVideo);

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
                const url = new URL(window.location);
                if (url.searchParams.get('clientId') !== clientId) {
                  url.searchParams.set('clientId', clientId);
                  window.history.replaceState({}, '', url);
                }
              })();
            `,
          }}
        />
        {/* Background Video or GIF with fallback */}
        {backgroundVideo && isValidBackgroundVideo ? (
          <video
            className="absolute inset-0 z-0 object-cover w-full h-full"
            src={backgroundVideo}
            autoPlay
            loop
            muted
            playsInline
          />
        ) : isValidBackground ? (
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url(${background})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            className="absolute inset-0 z-0"
            style={{ backgroundColor: 'rgba(17, 24, 39, 1)' }} // Tailwind gray-900
          />
        )}
        {/* Background Audio */}
        {backgroundAudio && (
          <audio autoPlay loop>
            <source src={backgroundAudio} type="audio/mpeg" />
          </audio>
        )}
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-black/70 z-10"></div>
        <div className="relative z-20 flex items-center justify-center p-4 min-h-screen">
          <div className="w-full max-w-md">
            {/* Profile Card with Transparent Background */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-center mb-6">
              <Avatar name={name} avatar={avatar} />
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
                  <Badges badges={badges} />
                </div>
              )}
              <div className="flex justify-center space-x-2 mt-6">
                <div className="w-1.5 h-1.5 bg-white/30 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-white/30 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-white/30 rounded-full"></div>
              </div>
            </div>
            {/* Links with Transparent Background */}
            <Links links={links} />
            <div className="text-center text-gray-300 text-sm">
              <p className="mb-2">Powered by The BioLink</p>
              <a href="/" className="text-indigo-300 hover:text-indigo-200 hover:underline transition-colors">
                Create your own
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error: any) {
    console.error('UserPage error:', {
      username,
      clientId,
      error: error.message,
      stack: error.stack,
    });
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
          <p className="text-gray-400 mb-6">Something went wrong while loading this profile.</p>
          <a href="/" className="text-indigo-400 hover:text-indigo-300 hover:underline">
            Return Home
          </a>
        </div>
      </div>
    );
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  console.log('Generating metadata for username:', username);
  try {
    const userData = await getUserByUsernameForMetadata(username);
    if (!userData) {
      console.log(`Metadata: User not found for username: ${username}`);
      return { title: 'User Not Found | The BioLink' };
    }
    if (userData.isBanned) {
      console.log(`Metadata: User banned for username: ${username}`);
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
  } catch (error: any) {
    console.error('Metadata error:', {
      username,
      error: error.message,
      stack: error.stack,
    });
    return { title: 'User Not Found | The BioLink' };
  }
}
