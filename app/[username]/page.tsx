export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { headers } from 'next/headers';
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
  name: string;
  avatar?: string;
  bio?: string;
  background?: string;
  backgroundVideo?: string;
  backgroundAudio?: string;
  badges: Badge[];
  links: Link[];
  widgets?: Widget[];
  layoutStructure?: LayoutSection[];
  isBanned: boolean;
  profileViews: number;
}

interface MetadataUser {
  name: string;
  avatar?: string;
  bio?: string;
  isBanned: boolean;
  links: { url: string; title: string }[];
}

// Helpers
function getYouTubeId(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.*?v=))([^&?# ]{11})/);
  return match ? match[1] : '';
}

function getSpotifyId(url: string): string {
  const match = url.match(/spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/);
  return match ? `${match[1]}/${match[2]}` : '';
}

function getSpecialProfileTag(username: string): string | null {
  switch (username.toLowerCase()) {
    case 'xsetnews':
      return 'Biggest Sponsored Member';
    case 'ceosolace':
      return 'Founder of BioLinkHQ';
    default:
      return null;
  }
}

function getWidgetIcon(type: string): JSX.Element | null {
  switch (type) {
    case 'youtube':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-red-500">
          <path d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM10 15V9l5.2 3-5.2 3z" />
        </svg>
      );
    case 'spotify':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-500">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm0 22c-5.52 0-10-4.48-10-10S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10zm5.34-10.2c-.38 0-.6-.26-.68-.66-.34-1.6-1.1-2.88-2.3-3.78-1.34-.98-3-.98-4.32 0-1.2.9-1.96 2.18-2.3 3.78-.08.4-.3.66-.68.66-.46 0-.76-.36-.68-.82.4-1.92 1.34-3.5 2.78-4.62C7.46 6.18 9.24 6 10.98 6c1.76 0 3.54.18 4.92 1.44 1.44 1.12 2.38 2.7 2.78 4.62.08.46-.22.82-.68.82zm-1.3 2.3c-.3 0-.52-.2-.58-.5-.3-1.22-.9-2.22-1.88-2.92-.98-.7-2.14-.7-3.12 0-.98.7-1.58 1.7-1.88 2.92-.06.3-.28.5-.58.5-.38 0-.64-.3-.58-.68.34-1.54 1.08-2.8 2.24-3.68.98-.74 2.1-.74 3.08 0 .98.74 1.72 1.94 2.1 3.42l.14.26c.06.38-.2.68-.58.68zm-1.08 2.14c-.24 0-.42-.16-.48-.4-.22-.96-.7-1.74-1.5-2.3-.8-.56-1.74-.56-2.54 0-.8.56-1.28 1.34-1.5 2.3-.06.24-.24.4-.48.4-.3 0-.5-.24-.48-.54.28-1.22.86-2.22 1.8-2.92.8-.6 1.72-.6 2.52 0 .8.6 1.38 1.5 1.68 2.66l.1.26c.02.3-.18.54-.48.54z" />
        </svg>
      );
    case 'twitter':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-400">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'custom':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
        </svg>
      );
    default:
      return null;
  }
}

export default async function UserPage({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = await params;
  const { username } = resolvedParams;

  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             headersList.get('x-real-ip') ||
             '0.0.0.0';

  try {
    const userData = await getUserByUsername(username, ip);

    if (!userData) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black p-4">
          <div className="max-w-md w-full bg-gray-800/70 backdrop-blur-lg rounded-3xl shadow-xl p-8 text-center border border-gray-700">
            <div className="w-20 h-20 mx-auto mb-5 flex items-center justify-center bg-indigo-700/20 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m2 0a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2h2m2-4v4m0 0v4m0-4h4m-4 0H7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">BioLink Not Found</h1>
            <p className="text-gray-300 mb-6">
              We couldn’t find a profile for <span className="font-medium">{username}</span>. Maybe it’s time to create your own BioLink!
            </p>
            <a
              href="/"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-semibold transition-colors shadow-md"
            >
              Create Yours
            </a>
          </div>
        </div>
      );
    }

    if (userData.isBanned) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black p-4">
          <div className="max-w-md w-full bg-gray-800/70 backdrop-blur-lg rounded-3xl shadow-xl p-8 text-center border border-gray-700">
            <div className="w-20 h-20 mx-auto mb-5 flex items-center justify-center bg-red-700/20 rounded-full animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 6L6 18M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Account Suspended</h1>
            <p className="text-gray-300 mb-6">
              This BioLink has been suspended for violating our terms of service. 
              If you believe this is a mistake, please <a href="/support" className="text-red-400 hover:underline">contact support</a>.
            </p>
            <a
              href="/"
              className="inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl font-semibold transition-colors shadow-md"
            >
              Explore Other BioLinks
            </a>
          </div>
        </div>
      );
    }

    const {
      name = '',
      avatar = '',
      bio = '',
      background = '',
      backgroundVideo = '',
      backgroundAudio = '',
      badges = [],
      links = [],
      widgets = [],
      layoutStructure = [
        { id: 'bio', type: 'bio' },
        { id: 'spacer-1', type: 'spacer', height: 20 },
        { id: 'links', type: 'links' }
      ],
      profileViews = 0,
    } = userData;

    const isValidBackground = background && /\.(gif|png|jpg|jpeg|webp)$/i.test(background);
    const isValidBackgroundVideo = backgroundVideo && /\.(mp4|webm|ogg)$/i.test(backgroundVideo);

    const sortedLinks = [...links].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    const sortedWidgets = [...widgets].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    return (
      <div className="min-h-screen relative">
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

        <div className="absolute inset-0 bg-black/60 z-10"></div>

        <div className="relative z-20 flex items-center justify-center p-4 min-h-screen">
          <div className="w-full max-w-md">
            {layoutStructure.map((section) => {
              if (section.type === 'bio') {
                return (
                  <div key={section.id} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center mb-6 shadow-xl">
                    <Avatar name={name} avatar={avatar} />
                    <h1 className="text-2xl font-bold text-white mt-3 mb-1">{name}</h1>
                    {bio && <p className="text-gray-200 mb-4 px-2">{bio}</p>}

                    <div className="text-gray-300 text-sm mb-4 flex justify-center gap-4">
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {profileViews.toLocaleString()}
                      </span>
                      {links.length > 0 && (
                        <span className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a2 2 0 00-2.828 0l-6 6a2 2 0 002.828 2.828l6-6a2 2 0 000-2.828z" />
                          </svg>
                          {links.length}
                        </span>
                      )}
                    </div>

                    {badges.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/20">
                        <Badges badges={badges} />
                      </div>
                    )}

                    {(() => {
                      const specialTag = getSpecialProfileTag(username);
                      if (specialTag) {
                        return (
                          <div className="mt-4 pt-4 border-t border-white/20 animate-pulse">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg">
                              🏆 {specialTag}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                );
              }

              if (section.type === 'links' && sortedLinks.length > 0) {
                return <Links key={section.id} links={sortedLinks} />;
              }

              if (section.type === 'widget') {
                const widget = sortedWidgets.find(w => w.id === section.widgetId);
                if (!widget) return null;

                return (
                  <div
                    key={section.id}
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-left mb-6"
                  >
                    {widget.title ? (
                      <h3 className="flex items-center gap-2 text-white font-medium mb-2">
                        {getWidgetIcon(widget.type)}
                        {widget.title}
                      </h3>
                    ) : getWidgetIcon(widget.type) ? (
                      <div className="flex justify-start mb-2">
                        {getWidgetIcon(widget.type)}
                      </div>
                    ) : null}
                    {widget.type === 'youtube' && widget.url ? (
                      <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                        <iframe
                          src={`https://www.youtube.com/embed/  ${getYouTubeId(widget.url)}`}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        ></iframe>
                      </div>
                    ) : widget.type === 'spotify' && widget.url ? (
                      <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                        <iframe
                          src={`https://open.spotify.com/embed/  ${getSpotifyId(widget.url)}`}
                          frameBorder="0"
                          allowTransparency
                          allow="encrypted-media"
                          className="w-full h-full"
                        ></iframe>
                      </div>
                    ) : widget.type === 'twitter' && widget.url ? (
                      <div className="bg-gray-800 rounded-lg p-4">
                        <a href={widget.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                          View Twitter Feed
                        </a>
                      </div>
                    ) : widget.type === 'custom' && widget.content ? (
                      <div
                        className="text-gray-300 text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: widget.content }}
                      />
                    ) : (
                      <div className="text-gray-400 text-sm italic">
                        Widget content not available
                      </div>
                    )}
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

            <div className="text-center text-gray-400 text-xs mt-8 pt-6 border-t border-white/10">
              <p className="mb-1">Powered by The BioLink</p>
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
    console.error('UserPage error:', { username, error: error.message });
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-xl p-8 text-center border border-gray-700">
          <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
          <p className="text-gray-400 mb-6">Failed to load this profile.</p>
          <a href="/" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors">
            Go Home
          </a>
        </div>
      </div>
    );
  }
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = await params;
  const { username } = resolvedParams;
  try {
    const userData = await getUserByUsernameForMetadata(username) as MetadataUser | null;
    if (!userData || userData.isBanned) {
      return { title: 'User Not Found | The BioLink' };
    }
    return {
      title: `${userData.name || username} | The BioLink`,
      description: userData.bio?.substring(0, 160) || `Check out ${userData.name || username}'s BioLink`,
      openGraph: {
        title: `${userData.name || username} | The BioLink`,
        description: userData.bio?.substring(0, 160) || `Check out ${userData.name || username}'s BioLink`,
        images: userData.avatar ? [userData.avatar] : [],
        url: `https://thebiolink.lol/  ${username}`,
        siteName: 'The BioLink',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${userData.name || username} | The BioLink`,
        description: userData.bio?.substring(0, 160) || `Check out ${userData.name || username}'s BioLink`,
        images: userData.avatar ? [userData.avatar] : [],
      },
    };
  } catch (error: any) {
    console.error('Metadata error:', { username, error: error.message });
    return { title: 'User Not Found | The BioLink' };
  }
} 
