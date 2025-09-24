import { notFound } from 'next/navigation';
import { getUserByUsername } from '@/lib/storage';
import BioCard from '@/components/BioCard';
import LinkCard from '@/components/LinkCard';

// ✅ Correct type for page props
interface PageProps {
  params: Promise<{ username: string }>;
}

// ✅ Use async component + await params
export default async function UserPage({ params }: PageProps) {
  // Await the params (required in Next.js 15+)
  const { username } = await params;
  
  const user = await getUserByUsername(username);
  
  if (!user) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <BioCard 
          name={user.name} 
          avatar={user.avatar} 
          bio={user.bio} 
        />
        
        <div className="mt-6 space-y-3">
          {user.links.map((link: any) => (
            <LinkCard 
              key={link.id}
              url={link.url}
              title={link.title}
              icon={link.icon}
            />
          ))}
        </div>
        
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Powered by The BioLink</p>
          <a 
            href="/" 
            className="text-indigo-600 hover:underline"
          >
            Create your own
          </a>
        </div>
      </div>
    </div>
  );
}

// ✅ Metadata function must also be async
export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  const user = await getUserByUsername(username);
  
  if (!user) {
    return { title: 'User Not Found | The BioLink' };
  }
  
  return {
    title: `${user.name} | The BioLink`,
    description: user.bio || `Check out ${user.name}'s links`,
  };
}
