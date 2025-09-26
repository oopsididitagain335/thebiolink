// app/api/links/[username]/route.ts
import { NextRequest } from 'next/server';
import { getUserByUsername } from '@/lib/storage';
import { z } from 'zod';

const ProfileUpdateSchema = z.object({
  name: z.string().min(1).max(50),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  avatar: z.string().url().optional().or(z.literal('')),
  bio: z.string().max(200).optional(),
  background: z.string().url().optional().or(z.literal('')),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const userData = await getUserByUsername(username);

  if (!userData) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  return Response.json({
    user: {
      name: userData.name,
      avatar: userData.avatar,
      bio: userData.bio,
      background: userData.background,
      badgeOption: userData.badgeOption,
    },
    links: userData.links || [],
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const sessionCookie = request.headers.get('Cookie')?.split('biolink_session=')[1]?.split(';')[0];

  if (!sessionCookie) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsedProfile = ProfileUpdateSchema.safeParse(body.profile);

    if (!parsedProfile.success) {
      return Response.json({ error: 'Invalid input', details: parsedProfile.error.flatten() }, { status: 400 });
    }

    const { name, username: newUsername, avatar, bio, background } = parsedProfile.data;

    if (newUsername !== username) {
      const existingUser = await getUserByUsername(newUsername);
      if (existingUser && existingUser._id.toString() !== sessionCookie) {
        return Response.json({ error: 'Username already taken' }, { status: 400 });
      }
    }

    const updatedUser = await updateUserProfile(sessionCookie, {
      name,
      username: newUsername,
      avatar,
      bio,
      background,
    });

    return Response.json({ user: updatedUser });
  } catch (error) {
    console.error('Update error:', error);
    return Response.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
