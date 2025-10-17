// app/[username]/page.tsx
import { headers } from 'next/headers';
import { getUserByUsername } from '@/lib/storage';
import UserPageClient from './UserPageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 🧠 Server Component — handles fetching + metadata
export default async function UserPage({ params }: { params: { username: string } }) {
  const { username } = params;
  const headersList = headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0';

  try {
    const userData = await getUserByUsername(username, ip);
    return <UserPageClient username={username} userData={userData} />;
  } catch (err) {
    console.error('Error loading user:', err);
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-white">
        <div className="bg-gray-900/70 rounded-xl p-8 border border-gray-700">
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-4">Unable to load this profile.</p>
          <a href="/" className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-4 py-2">
            Go Home
          </a>
        </div>
      </div>
    );
  }
}

// === Metadata generation (SERVER ONLY) ===
async function getUserByUsernameForMetadata(username: string) {
  try {
    const user = await getUserByUsername(username, '0.0.0.0');
    if (!user) return null;
    return {
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      isBanned: user.isBanned,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { username: string } }) {
  const { username } = params;
  const userData = await getUserByUsernameForMetadata(username);

  if (!userData || userData.isBanned) {
    return { title: 'Banned | The BioLink' };
  }

  return {
    title: `${userData.name || username} | The BioLink`,
    description:
      userData.bio?.substring(0, 160) ||
      `Check out ${userData.name || username}'s BioLink`,
    openGraph: {
      title: `${userData.name || username} | The BioLink`,
      description:
        userData.bio?.substring(0, 160) ||
        `Check out ${userData.name || username}'s BioLink`,
      images: userData.avatar ? [userData.avatar] : [],
      url: `https://thebiolink.lol/${username}`,
      siteName: 'The BioLink',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${userData.name || username} | The BioLink`,
      description:
        userData.bio?.substring(0, 160) ||
        `Check out ${userData.name || username}'s BioLink`,
      images: userData.avatar ? [userData.avatar] : [],
    },
  };
}
