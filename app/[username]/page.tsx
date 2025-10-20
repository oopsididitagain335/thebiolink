// app/[username]/page.tsx
import { notFound } from 'next/navigation';
import BlockRenderer from '@/components/BlockRenderer';

// --- Interfaces ---
interface Badge {
  id: string;
  name: string;
  icon: string;
  hidden?: boolean;
}

interface LinkItem {
  id: string;
  url: string;
  title: string;
  icon?: string;
  position: number;
}

interface WidgetItem {
  id: string;
  type: 'spotify' | 'youtube' | 'twitter' | 'custom' | 'form' | 'ecommerce' | 'api' | 'calendar';
  title?: string;
  content?: string;
  url?: string;
  position: number;
}

interface LayoutSection {
  id: string;
  type: string;
  widgetId?: string;
  content?: string;
  styling?: { [key: string]: string };
  visibleLinks?: string[];
}

interface UserData {
  name: string;
  username: string;
  avatar: string;
  profileBanner: string;
  pageBackground: string;
  bio: string;
  location: string;
  badges: Badge[];
  isBanned: boolean;
  profileViews: number;
  links: LinkItem[];
  widgets: WidgetItem[];
  layoutStructure: LayoutSection[];
  theme: string;
  xp: number;
  level: number;
  loginStreak: number;
  customCSS?: string;
  customJS?: string;
  analyticsCode?: string;
}

// Optional: force dynamic rendering (ISR can also be added if needed)
export const dynamic = 'force-dynamic';

interface UserPageProps {
  params: {
    username: string;
  };
}

export default async function UserPage({ params }: UserPageProps) {
  const { username } = params;

  // Fetch user data
  let userData: UserData | null = null;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/links/${username}`, {
      next: { revalidate: 60 }, // ISR
    });

    if (!res.ok) throw new Error('Not found');

    userData = await res.json();
  } catch (e) {
    notFound();
  }

  // Show banned message
  if (userData!.isBanned) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-500">Account Banned</h1>
        </div>
      </div>
    );
  }

  const pageBg = userData!.pageBackground || '';
  const isVideoBg = /\.(mp4|webm|ogg)$/i.test(pageBg);

  return (
    <div className="min-h-screen bg-black text-gray-100 relative">
      {/* Background */}
      {isVideoBg ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="fixed top-0 left-0 w-full h-full object-cover z-[-1]"
        >
          <source src={pageBg} type="video/mp4" />
        </video>
      ) : pageBg ? (
        <div
          className="fixed top-0 left-0 w-full h-full bg-cover bg-center z-[-1]"
          style={{ backgroundImage: `url(${pageBg})` }}
        />
      ) : (
        <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-br from-gray-900 to-black z-[-1]" />
      )}

      {/* Profile Banner */}
      {userData!.profileBanner && (
        <div
          className="w-full h-40 md:h-56 rounded-b-2xl overflow-hidden"
          style={{
            backgroundImage: `url(${userData!.profileBanner})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      {/* Content */}
      <div className="relative max-w-2xl mx-auto px-4 py-8 md:py-12">
        {userData!.layoutStructure.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p>This profile is empty.</p>
          </div>
        ) : (
          userData!.layoutStructure.map((section) => (
            <BlockRenderer
              key={section.id}
              section={section}
              user={userData!}
              links={userData!.links}
              widgets={userData!.widgets}
            />
          ))
        )}
      </div>

      {/* Custom CSS & Analytics */}
      {userData!.customCSS && (
        <style id="custom-css" dangerouslySetInnerHTML={{ __html: userData!.customCSS }} />
      )}
      {userData!.analyticsCode && (
        <script id="analytics" dangerouslySetInnerHTML={{ __html: userData!.analyticsCode }} />
      )}
    </div>
  );
}
