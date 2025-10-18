// app/api/dashboard/update/route.ts
import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateUserProfile, saveUserLinks, saveUserWidgets, updateUserXP } from '@/lib/storage';

// ✅ FIX: DOMPurify in Node.js — use with JSDOM or ensure v3+
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

interface LayoutSection {
  id: string;
  type: 'bio' | 'links' | 'widget' | 'spacer' | 'custom' | 'form' | 'ecommerce' | 'tab' | 'column' | 'api' | 'calendar' | 'page';
  widgetId?: string;
  height?: number;
  content?: string;
  children?: LayoutSection[];
  pagePath?: string;
  styling?: { [key: string]: string };
}

interface Challenge {
  id: string;
  xp: number;
}

interface User {
  _id: string;
  email: any;
  username: any;
  name: any;
  avatar: any;
  plan: string;
}

// ✅ REAL CHALLENGES WITH XP
const CHALLENGES: Record<string, { xp: number }> = {
  updateProfile: { xp: 50 },
  addLink: { xp: 20 },
  addWidget: { xp: 30 },
  completeProfile: { xp: 100 },
};

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser() as User;
  if (!user || !user._id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { profile, links, widgets, challengeId } = await request.json();

    // ✅ Handle challenge completion
    if (challengeId && CHALLENGES[challengeId]) {
      const xpAward = CHALLENGES[challengeId].xp;
      await updateUserXP(user._id, xpAward);
      return Response.json({ success: true, xpAward });
    }

    let totalXP = 0;

    // ✅ Auto-award XP for meaningful updates
    if (profile && typeof profile === 'object') {
      const validThemes = ['indigo', 'purple', 'green', 'red', 'halloween'];
      const theme = validThemes.includes(profile.theme) ? profile.theme : 'indigo';
      const name = (profile.name || '').trim().substring(0, 100);
      const username = (profile.username || '').trim().toLowerCase();
      const bio = (profile.bio || '').trim().substring(0, 500);
      const avatar = (profile.avatar || '').trim();
      const profileBanner = (profile.profileBanner || '').trim();
      const pageBackground = (profile.pageBackground || '').trim();
      const location = profile.location ? profile.location.trim().substring(0, 100) : '';

      // ✅ Sanitize safely in Node.js
      const customCSS = DOMPurify.sanitize(profile.customCSS || '');
      const customJS = user.plan === 'premium' ? DOMPurify.sanitize(profile.customJS || '', { ALLOWED_TAGS: [] }) : '';
      const analyticsCode = DOMPurify.sanitize(profile.analyticsCode || '');

      const seoMeta = {
        title: (profile.seoMeta?.title || '').trim(),
        description: (profile.seoMeta?.description || '').trim(),
        keywords: (profile.seoMeta?.keywords || '').trim(),
      };

      const sanitizeLayout = (section: any): LayoutSection | null => {
        if (!['bio', 'links', 'widget', 'spacer', 'custom', 'form', 'ecommerce', 'tab', 'column', 'api', 'calendar', 'page'].includes(section.type)) return null;
        return {
          id: String(section.id || Date.now()),
          type: section.type,
          widgetId: section.widgetId,
          height: typeof section.height === 'number' ? section.height : undefined,
          content: DOMPurify.sanitize(section.content || ''),
          pagePath: section.pagePath,
          styling: typeof section.styling === 'object' ? section.styling : {},
          children: Array.isArray(section.children)
            ? section.children.map(sanitizeLayout).filter(Boolean) as LayoutSection[]
            : undefined,
        };
      };

      const layoutStructure = (profile.layoutStructure || [])
        .map(sanitizeLayout)
        .filter(Boolean) as LayoutSection[];

      const updateData = {
        name,
        username,
        bio,
        avatar,
        profileBanner,
        pageBackground,
        location,
        theme,
        layoutStructure,
        customCSS,
        customJS,
        seoMeta,
        analyticsCode,
        discordId: profile.discordId,
      };

      await updateUserProfile(user._id, updateData);
      totalXP += 10; // base XP for saving
    }

    if (Array.isArray(links) && links.length > 0) {
      await saveUserLinks(user._id, links);
      totalXP += 5;
    }

    if (Array.isArray(widgets) && widgets.length > 0) {
      await saveUserWidgets(user._id, widgets);
      totalXP += 5;
    }

    if (totalXP > 0) {
      await updateUserXP(user._id, totalXP);
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Update error:', error);
    return Response.json({ error: error.message || 'Update failed' }, { status: 400 });
  }
}
