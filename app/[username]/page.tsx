// app/[username]/page.tsx
import { notFound } from 'next/navigation';
import BlockRenderer from '@/components/BlockRenderer';

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
  type: string;
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
  styling?: any;
  visibleLinks?: string[];
  height?: number;
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

export default async function UserPage({ params }: { params: { username: string } }) {
  let userData: UserData | null = null;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/links/${params.username}`, {
      next: { revalidate: 60 }, // ISR
    });
    if (!res.ok) throw new Error('Not found');
    userData = await res.json();
  } catch (e) {
    notFound();
  }

  if (userData.isBanned) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-500">Account Banned</h1>
        </div>
      </div>
    );
  }

  const pageBg = userData.pageBackground || '';
  const isVideoBg = /\.(mp4|webm)$/i.test(pageBg);

  // Inject custom code safely (only on client)
  if (typeof window !== 'undefined') {
    if (userData.customCSS) {
      let style = document.getElementById('custom-css') as HTMLStyleElement;
      if (!style) {
        style = document.createElement('style');
        style.id = 'custom-css';
        document.head.appendChild(style);
      }
      style.textContent = userData.customCSS;
    }
    if (userData.customJS) {
      let script = document.getElementById('custom-js') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.id = 'custom-js';
        document.body.appendChild(script);
      }
      script.textContent = userData.customJS;
    }
    if (userData.analyticsCode) {
      let analytics = document.getElementById('custom-analytics') as HTMLScriptElement;
      if (!analytics) {
        analytics = document.createElement('script');
        analytics.id = 'custom-analytics';
        document.head.appendChild(analytics);
      }
      analytics.textContent = userData.analyticsCode;
    }
  }

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
      {userData.profileBanner && (
        <div
          className="w-full h-40 md:h-56 rounded-b-2xl overflow-hidden"
          style={{
            backgroundImage: `url(${userData.profileBanner})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      {/* Content */}
      <div className="relative max-w-2xl mx-auto px-4 py-8 md:py-12">
        {userData.layoutStructure.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">This profile is a blank canvas.</p>
            <p className="mt-2 text-sm">The owner can build it from their dashboard.</p>
          </div>
        ) : (
          userData.layoutStructure.map((section) => (
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
    </div>
  );
}
