// app/[username]/ClientProfile.tsx
'use client';

import { useEffect } from 'react';
import LazyLoadImage from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

interface Badge {
  id: string;
  name: string;
  icon: string;
  awardedAt?: string;
  earnedAt?: string;
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
  height?: number;
  content?: string;
  children?: LayoutSection[];
  pagePath?: string;
  styling?: React.CSSProperties;
}

interface ClientProfileProps {
  username: string;
  name: string;
  avatar: string;
  profileBanner: string;
  pageBackground: string;
  bio: string;
  location: string;
  visibleBadges: Badge[];
  profileViews: number;
  links: LinkItem[];
  widgets: WidgetItem[];
  layoutStructure: LayoutSection[];
  theme: string;
  glow: string;
  hasBanner: boolean;
  hasPageBackground: boolean;
  hasVideoBackground: boolean;
  profileUrl: string;
  specialTag: string | null;
  xp: number;
  level: number;
  loginStreak: number;
  customCSS?: string;
  customJS?: string;
  seoMeta: { title: string; description: string; keywords: string };
  analyticsCode?: string;
}

export default function ClientProfile(props: ClientProfileProps) {
  // Inject custom CSS if present
  useEffect(() => {
    if (props.customCSS) {
      const style = document.createElement('style');
      style.textContent = props.customCSS;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [props.customCSS]);

  // Inject custom JS if present (use with caution)
  useEffect(() => {
    if (props.customJS) {
      const script = document.createElement('script');
      script.textContent = props.customJS;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    }
  }, [props.customJS]);

  // Inject analytics if present
  useEffect(() => {
    if (props.analyticsCode) {
      const script = document.createElement('script');
      script.textContent = props.analyticsCode;
      document.head.appendChild(script);
      return () => {
        document.head.removeChild(script);
      };
    }
  }, [props.analyticsCode]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      {props.hasVideoBackground ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="fixed top-0 left-0 w-full h-full object-cover z-[-1]"
        >
          <source src={props.pageBackground} type="video/mp4" />
        </video>
      ) : props.hasPageBackground ? (
        <div
          className="fixed top-0 left-0 w-full h-full bg-cover bg-center z-[-1]"
          style={{ backgroundImage: `url(${props.pageBackground})` }}
        />
      ) : (
        <div className="fixed top-0 left-0 w-full h-full bg-gray-900 z-[-1]" />
      )}

      <div className="relative max-w-2xl mx-auto px-4 py-12">
        {/* Banner */}
        {props.hasBanner && (
          <div
            className="w-full h-32 md:h-48 rounded-xl mb-6 overflow-hidden"
            style={{ backgroundImage: `url(${props.profileBanner})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
        )}

        {/* Avatar & Badges */}
        <div className="text-center mb-6">
          {props.avatar ? (
            <LazyLoadImage
              src={props.avatar}
              alt={props.name}
              effect="blur"
              className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-white/30"
            />
          ) : (
            <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl text-white font-bold">
                {props.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <h1 className="text-2xl font-bold">{props.name || props.username}</h1>
          {props.location && <p className="text-gray-400 text-sm mt-1">{props.location}</p>}
          {props.specialTag && (
            <span className="inline-block mt-2 px-3 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full border border-amber-500/30">
              {props.specialTag}
            </span>
          )}

          {/* Badges */}
          {props.visibleBadges.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {props.visibleBadges.map((badge) => (
                <img
                  key={badge.id}
                  src={badge.icon}
                  alt={badge.name}
                  title={badge.name}
                  className="w-6 h-6 rounded-full border border-white/20"
                />
              ))}
            </div>
          )}
        </div>

        {/* Bio */}
        {props.bio && <p className="text-center text-gray-300 mb-6">{props.bio}</p>}

        {/* Stats */}
        <div className="flex justify-center gap-4 text-sm text-gray-400 mb-8">
          <span>Level {props.level}</span>
          <span>•</span>
          <span>{props.profileViews} views</span>
          <span>•</span>
          <span>{props.loginStreak} day streak</span>
        </div>

        {/* Links */}
        <div className="space-y-3">
          {props.links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`block w-full text-center py-3 rounded-xl font-medium transition-all ${props.glow} bg-white/5 hover:bg-white/10 border border-white/10`}
            >
              {link.title}
            </a>
          ))}
        </div>

        {/* TODO: Render widgets & layoutStructure as needed */}
      </div>
    </div>
  );
}
