// app/api/dashboard/update/route.ts
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { updateUserProfile, saveUserLinks, saveUserWidgets } from '@/lib/storage';
import { z } from 'zod';

const ProfileUpdateSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  username: z.string().regex(/^[a-zA-Z0-9_-]{3,30}$/).trim().toLowerCase(),
  avatar: z.string().url().optional().or(z.literal('')),
  bio: z.string().max(500).optional().or(z.literal('')),
  background: z.string().url().optional().or(z.literal('')),
  layout: z.string().optional(),
});

const LinkSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  title: z.string().min(1).max(100),
  icon: z.string().optional().or(z.literal('')),
  position: z.number().int().min(0),
});

const WidgetSchema = z.object({
  id: z.string(),
  type: z.enum(['spotify', 'youtube', 'twitter', 'custom']),
  title: z.string().optional(),
  content: z.string().optional(),
  position: z.number().int().min(0),
});

const LinksUpdateSchema = z.array(LinkSchema).max(50);
const WidgetsUpdateSchema = z.array(WidgetSchema).max(20);

export async function PUT(request: NextRequest) {
  const sessionId = (await cookies()).get('biolink_session')?.value;
  if (!sessionId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { profile, links, widgets } = body;

    if (profile) {
      const validatedProfile = ProfileUpdateSchema.parse(profile);
      await updateUserProfile(sessionId, validatedProfile);
    }

    if (Array.isArray(links)) {
      const validatedLinks = LinksUpdateSchema.parse(links);
      await saveUserLinks(sessionId, validatedLinks);
    }

    if (Array.isArray(widgets)) {
      const validatedWidgets = WidgetsUpdateSchema.parse(widgets);
      await saveUserWidgets(sessionId, validatedWidgets);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Update error:', error);
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Validation failed' }, { status: 400 });
    }
    return Response.json({ error: 'Failed to update data' }, { status: 400 });
  }
}
