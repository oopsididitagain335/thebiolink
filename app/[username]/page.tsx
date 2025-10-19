'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
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

export default function UserPage() {
  const params = useParams<{ username: string }>();
  const { username } = params;
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const announcementRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/links/${username}`);
        if (!res.ok) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setUserData(data);
      } catch (err) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    if (username) fetchProfile();
  }, [username]);

  useEffect(() => {
    if (userData) {
      announcementRef.current = setTimeout(() => setShowAnnouncement(false), 15000);
    }
    return () => {
      if (announcementRef.current) clearTimeout(announcementRef.current);
    };
  }, [userData]);

  useEffect(() => {
    if (userData?.customCSS) {
      const style = document.createElement('style');
      style.textContent = userData.customCSS;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style); // Cleanup without returning the removed element
      };
    }
    return () => {}; // Return empty cleanup if no customCSS
  }, [userData?.customCSS]);

  useEffect(() => {
    if (userData?.customJS) {
      const script = document.createElement('script');
      script.textContent = userData.customJS;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script); // Cleanup without returning the removed element
      };
    }
    return () => {}; // Return empty cleanup if no customJS
  }, [userData?.customJS]);

  useEffect(() => {
    if (userData?.analyticsCode) {
      const script = document.createElement('script');
      script.textContent = userData.analyticsCode;
      document.head.appendChild(script);
      return () => {
        document.head.removeChild(script); // Cleanup without returning the removed element
      };
    }
    return () => {}; // Return empty cleanup if no analyticsCode
  }, [userData?.analyticsCode]);

  if (loading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
  }

  if (notFound || !userData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 text-white">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Profile Not Found</h1>
          <p>No BioLink exists for @{username}</p>
        </div>
      </div>
    );
  }

  if (userData.isBanned) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-500 mb-4">BANNED</h1>
        </div>
      </div>
    );
  }

  const pageBg = userData.pageBackground || '';
  const isVideoBg = /\.(mp4|webm)$/i.test(pageBg);

  return (
    <div className="min-h-screen bg-black text-white relative">
      {isVideoBg ? (
        <video autoPlay muted loop playsInline className="fixed top-0 left-0 w-full h-full object-cover z-[-1]">
          <source src={pageBg} type="video/mp4" />
        </video>
      ) : pageBg ? (
        <div className="fixed top-0 left-0 w-full h-full bg-cover bg-center z-[-1]" style={{ backgroundImage: `url(${pageBg})` }} />
      ) : (
        <div className="fixed top-0 left-0 w-full h-full bg-gray-900 z-[-1]" />
      )}

      {showAnnouncement && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-amber-500/90 text-black px-4 py-2 rounded-lg z-50 max-w-md text-center">
          <p className="font-medium">Nothing is showing because we’ve reset everything. Build your page from scratch!</p>
        </div>
      )}

      <div className="relative max-w-2xl mx-auto px-4 py-12">
        {userData.profileBanner && (
          <div
            className="w-full h-32 md:h-48 rounded-xl mb-6 overflow-hidden"
            style={{
              backgroundImage: `url(${userData.profileBanner})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}

        <div className="space-y-6">
          {userData.layoutStructure.map((section) => (
            <BlockRenderer
              key={section.id}
              section={section}
              user={userData}
              links={userData.links}
              widgets={userData.widgets}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
