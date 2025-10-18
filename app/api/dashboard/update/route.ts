// app/api/dashboard/update/route.ts
import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateUserProfile, saveUserLinks, saveUserWidgets, updateUserXP } from '@/lib/storage';
import DOMPurify from 'dompurify';

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user._id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { profile, links, widgets, challengeId } = await request.json();

    if (challengeId) {
      // Handle challenge completion
      const xpAward = CHALLENGES.find(c => c.id === challengeId)?.xp || 0;
      await updateUserXP(user._id, xpAward);
      return Response.json({ success: true, xpAward });
    }

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
      const customCSS = DOMPurify.sanitize(profile.customCSS || '');
      const customJS = user.plan === 'premium' ? DOMPurify.sanitize(profile.customJS || '', { ALLOWED_TAGS: [] }) : ''; // No tags for JS
      const seoMeta = {
        title: (profile.seoMeta?.title || '').trim(),
        description: (profile.seoMeta?.description || '').trim(),
        keywords: (profile.seoMeta?.keywords || '').trim(),
      };
      const analyticsCode = DOMPurify.sanitize(profile.analyticsCode || '');

      // Validate layoutStructure recursively
      const sanitizeLayout = (section: any): LayoutSection | null => {
        if (!['bio', 'links', 'widget', 'spacer', 'custom', 'form', 'ecommerce', 'tab', 'column', 'api', 'calendar', 'page'].includes(section.type)) return null;
        const cleanSection: LayoutSection = {
          id: section.id,
          type: section.type,
          widgetId: section.widgetId,
          height: section.height,
          content: DOMPurify.sanitize(section.content || ''),
          pagePath: section.pagePath,
          styling: section.styling || {},
        };
        if (section.children) {
          cleanSection.children = section.children.map(sanitizeLayout).filter(Boolean) as LayoutSection[];
        }
        return cleanSection;
      };

      const layoutStructure = (profile.layoutStructure || []).map(sanitizeLayout).filter(Boolean);

      // 🔒 SECURITY: Do NOT allow email or plan changes from frontend
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

      // Award XP for update
      await updateUserXP(user._id, 100);
    }

    if (Array.isArray(links)) {
      await saveUserLinks(user._id, links);
    }

    if (Array.isArray(widgets)) {
      await saveUserWidgets(user._id, widgets);
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Update error:', error);
    return Response.json(
      { error: error.message || 'Update failed' },
      { status: 400 }
    );
  }
}
