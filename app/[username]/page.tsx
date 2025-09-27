// app/[username]/page.tsx
import { notFound } from 'next/navigation';
import { getUserByUsername, incrementViewCount } from '@/lib/storage';
import BioCard from '@/components/BioCard';
import LinkCard from '@/components/LinkCard';

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
  backgroundVideo?: string;
  backgroundAudio?: string;
  links: Link[];
  badges: Array<{
    id: string;
    name: string;
    icon: string;
    awardedAt: string;
  }>;
}

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function UserPage({ params }: PageProps) {
  const { username } = await params;
  
  try {
    // ✅ Increment view count
    await incrementViewCount(username);
    
    const userData = await getUserByUsername(username);
    
    if (!userData) {
      notFound();
    }

    const { 
      name = '', 
      avatar = '', 
      bio = '', 
      background = '', 
      backgroundVideo = '', 
      backgroundAudio = '', 
      links = [], 
      badges = [] 
    } = userData as UserData;

    return (
      <div className="min-h-screen relative">
        {/* Background Media */}
        {backgroundVideo ? (
          <video
            src={backgroundVideo}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 z-0 w-full h-full object-cover"
          />
        ) : background ? (
          <div 
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url(${background})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
        ) : backgroundAudio ? (
          <audio
            src={backgroundAudio}
            autoPlay
            muted
            loop
            className="hidden"
          />
        ) : null}
        
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-black/70 z-10"></div>
        
        <div className="relative z-20 flex items-center justify-center p-4 min-h-screen">
          <div className="w-full max-w-md">
            <BioCard 
              name={name} 
              avatar={avatar} 
              bio={bio} 
              badges={badges} // ✅ Pass badges to BioCard
            />
            
            <div className="mt-6 space-y-3">
              {links
                .filter((link: Link) => link.url && link.title)
                .map((link: Link) => (
                  <LinkCard 
                    key={link.id}
                    url={link.url}
                    title={link.title}
                    icon={link.icon}
                  />
                ))}
            </div>
            
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
