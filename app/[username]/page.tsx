import { notFound } from 'next/navigation';
import { getUserByUsername } from '@/lib/storage';
import BioCard from '@/components/BioCard';
import LinkCard from '@/components/LinkCard';

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function UserPage({ params }: PageProps) {
  const { username } = await params;
  const userData = await getUserByUsername(username);
  
  if (!userData) {
    notFound();
  }

  const { name = '', avatar = '', bio = '', links = [] } = userData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4 transition-colors duration-200">
      <div className="w-full max-w-md">
        <BioCard name={name} avatar={avatar} bio={bio} />
        <div className="mt-6 space-y-3">
          {links
            .filter(link => link.url && link.title) // Only show valid links
            .map((link: any) => (
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
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
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
}
