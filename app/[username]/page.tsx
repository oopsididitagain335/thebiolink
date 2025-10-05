// app/[username]/page.tsx
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

interface Widget {
  id: string;
  type: 'spotify' | 'youtube' | 'twitter' | 'custom';
  title?: string;
  content?: string;
  url?: string;
  position?: number;
}

interface LayoutSection {
  id: string;
  type: 'bio' | 'links' | 'widget' | 'spacer' | 'custom';
  widgetId?: string;
  height?: number;
  content?: string;
}

interface UserData {
  _id: string;
  username: string;
  name: string;
  avatar?: string;
  bio?: string;
  background?: string;
  backgroundVideo?: string;
  backgroundAudio?: string;
  badges: Badge[];
  links: Link[];
  widgets: Widget[];
  layoutStructure: LayoutSection[];
  isBanned: boolean;
  profileViews: number;
}

interface PageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ clientId?: string }>;
}

function getYouTubeId(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.*?v=))([^&?# ]{11})/);
  return match ? match[1] : '';
}

function getSpotifyId(url: string): string {
  const match = url.match(/spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/);
  return match ? `${match[1]}/${match[2]}` : '';
}

export default async function UserPage({ params, searchParams }: PageProps) {
  const { username } = await params;
  const { clientId = '' } = await searchParams;

  try {
    const userData = await getUserByUsername(username);

    if (!userData) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/10 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0M16 12a4 4 0 10-8 0 4 4 0 008 0zm-4 6a6 6 0 00-6-6m12 0a6 6 0 01-6 6" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">@{username}</h1>
              <p className="text-gray-400 mb-6">
                This link isn’t claimed yet.<br />
                <span className="text-gray-300">Be the first to own it.</span>
              </p>
            </div>
            <a
              href="/auth/signup"
              className="inline-block w-full bg-white text-gray-900 font-semibold py-3.5 rounded-xl hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl"
            >
              Claim Now
            </a>
            <p className="text-gray-500 text-sm mt-4">
              Claim your identity on thebiolink.lol
            </p>
          </div>
        </div>
      );
    }

    if ('isBanned' in userData && userData.isBanned) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Unavailable</h1>
              <p className="text-gray-400 mb-6">
                This profile is currently suspended.<br />
                <span className="text-gray-300">Check back later or appeal in our Discord.</span>
              </p>
            </div>
            <a
              href="https://discord.gg/29yDsapcXh"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors"
            >
              Appeal on Discord
            </a>
          </div>
        </div>
      );
    }

    const user = userData as UserData;

    const {
      name,
      avatar,
      bio,
      background,
      backgroundVideo,
      backgroundAudio,
      badges,
      links,
      widgets,
      layoutStructure,
      profileViews,
    } = user;

    const isValidBackground = background && /\.(gif|png|jpg|jpeg|webp)$/i.test(background);
    const isValidBackgroundVideo = backgroundVideo && /\.(mp4|webm|ogg)$/i.test(backgroundVideo);

    const sortedLinks = [...links].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    const sortedWidgets = [...widgets].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    return (
      <div className="min-h-screen relative">
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

        {/* Background */}
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
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${background})` }}
          />
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-900 to-black" />
        )}

        {backgroundAudio && (
          <audio autoPlay loop>
            <source src={backgroundAudio} type="audio/mpeg" />
          </audio>
        )}

        <div className="absolute inset-0 bg-black/50 z-10"></div>

        <div className="relative z-20 flex items-center justify-center p-4 min-h-screen">
          <div className="w-full max-w-md">
            {layoutStructure.map((section) => {
              if (section.type === 'bio') {
                return (
                  <div
                    key={section.id}
                    className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center mb-6"
                  >
                    <Avatar name={name} avatar={avatar} />
                    <h1 className="text-2xl font-bold text-white mt-3 mb-1">{name || `@${username}`}</h1>
                    {bio && <p className="text-gray-200 mb-4 px-2">{bio}</p>}

                    <div className="text-gray-400 text-sm mb-4 flex justify-center gap-4">
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {profileViews.toLocaleString()}
                      </span>
                      {links.length > 0 && (
                        <span className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a2 2 0 00-2.828 0l-6 6a2 2 0 002.828 2.828l6-6a2 2 0 000-2.828z" />
                          </svg>
                          {links.length}
                        </span>
                      )}
                    </div>

                    {badges.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <Badges badges={badges} />
                      </div>
                    )}
                  </div>
                );
              }

              if (section.type === 'links' && sortedLinks.length > 0) {
                return <Links key={section.id} links={sortedLinks} />;
              }

              if (section.type === 'widget') {
                const widget = widgets.find(w => w.id === section.widgetId);
                if (!widget) return null;

                return (
                  <div
                    key={section.id}
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-left mb-6"
                  >
                    {widget.title && <h3 className="text-white font-medium mb-2">{widget.title}</h3>}
                    {widget.type === 'youtube' && widget.url ? (
                      <div className="aspect-video bg-gray-900/50 rounded-lg overflow-hidden">
                        <iframe
                          src={`https://www.youtube.com/embed/${getYouTubeId(widget.url)}`}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        ></iframe>
                      </div>
                    ) : widget.type === 'spotify' && widget.url ? (
                      <div className="aspect-video bg-gray-900/50 rounded-lg overflow-hidden">
                        <iframe
                          src={`https://open.spotify.com/embed/${getSpotifyId(widget.url)}`}
                          frameBorder="0"
                          allowTransparency
                          allow="encrypted-media"
                          className="w-full h-full"
                        ></iframe>
                      </div>
                    ) : widget.type === 'twitter' && widget.url ? (
                      <div className="bg-gray-900/50 rounded-lg p-3">
                        <a
                          href={widget.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
                        >
                          <span>🐦</span> View on Twitter
                        </a>
                      </div>
                    ) : widget.type === 'custom' && widget.content ? (
                      <div
                        className="text-gray-300 text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: widget.content }}
                      />
                    ) : null}
                  </div>
                );
              }

              if (section.type === 'spacer') {
                return <div key={section.id} style={{ height: `${section.height}px` }} />;
              }

              if (section.type === 'custom' && section.content) {
                return (
                  <div
                    key={section.id}
                    className="bg-white/5 p-4 rounded-lg mb-6"
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                );
              }

              return null;
            })}

            <div className="text-center text-gray-500 text-xs mt-8 pt-6 border-t border-white/5">
              <p className="mb-1">thebiolink.lol</p>
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
  } catch (error: any) {
    console.error('UserPage error:', { username, clientId, error: error.message });
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-500/10 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Oops</h1>
            <p className="text-gray-400 mb-6">
              Something went wrong.<br />
              <span className="text-gray-300">Try again or go home.</span>
            </p>
          </div>
          <a
            href="/"
            className="inline-block w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 rounded-xl transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }
}

// --- Metadata ---
export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  try {
    const userData = await getUserByUsernameForMetadata(username);
    if (!userData || userData.isBanned) {
      return { title: 'User Not Found | thebiolink.lol' };
    }
    return {
      title: `${userData.name || username} | thebiolink.lol`,
      description: userData.bio?.substring(0, 160) || `Check out ${userData.name || username}'s BioLink`,
      openGraph: {
        title: `${userData.name || username} | thebiolink.lol`,
        description: userData.bio?.substring(0, 160) || `Check out ${userData.name || username}'s BioLink`,
        images: userData.avatar ? [userData.avatar] : [],
        url: `https://thebiolink.lol/${username}`,
        siteName: 'thebiolink.lol',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${userData.name || username} | thebiolink.lol`,
        description: userData.bio?.substring(0, 160) || `Check out ${userData.name || username}'s BioLink`,
        images: userData.avatar ? [userData.avatar] : [],
      },
    };
  } catch (error: any) {
    console.error('Metadata error:', { username, error: error.message });
    return { title: 'User Not Found | thebiolink.lol' };
  }
}
