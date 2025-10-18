import { NextRequest } from 'next/server';
import { getUserByUsernameForMetadata, saveUserLinks, updateUserProfile } from '@/lib/storage';
import { z } from 'zod';

const ProfileUpdateSchema = z.object({
  name: z.string().min(1).max(50),
  avatar: z.string().url().optional(),
  bio: z.string().max(200).optional(),
});

const LinksUpdateSchema = z.array(
  z.object({
    id: z.string(),
    url: z.string().url(),
    title: z.string().min(1),
    icon: z.string().optional(),
    position: z.number().int().min(0)
  })
).max(20);

interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon?: string;
  position?: number;
}

interface UserMetadata {
  name: string;
  avatar: string;
  bio: string;
  isBanned: boolean;
  level: number;
  links: LinkItem[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const data = await getUserByUsernameForMetadata(username) as UserMetadata;

  if (!data) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  return Response.json({
    name: data.name,
    avatar: data.avatar,
    bio: data.bio,
    links: data.links
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const body = await request.json();

  try {
    if (body.profile) {
      const profileData = ProfileUpdateSchema.parse(body.profile);
      await updateUserProfile(body.userId, profileData);
    }

    if (body.links) {
      const linksData = LinksUpdateSchema.parse(body.links);
      await saveUserLinks(body.userId, linksData);
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({
      error: error instanceof z.ZodError
        ? 'Validation failed'
        : 'Failed to update data'
    }, { status: 400 });
  }
}
