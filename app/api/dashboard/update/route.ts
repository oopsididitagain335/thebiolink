// app/api/dashboard/update/route.ts
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { updateUserProfile, saveUserLinks } from '@/lib/storage';
import { ObjectId } from 'mongodb';

export async function PUT(request: NextRequest) {
  const sessionId = (await cookies()).get('biolink_session')?.value;
  if (!sessionId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { profile, links } = await request.json();

    // Validate profile
    if (profile) {
      await updateUserProfile(sessionId, profile);
    }

    // Validate and save links
    if (Array.isArray(links)) {
      // Ensure all links have required fields
      const validatedLinks = links
        .filter(link => link.url && link.title) // Only save valid links
        .map((link, index) => ({
          id: link.id || new ObjectId().toString(),
          url: link.url.trim(),
          title: link.title.trim(),
          icon: link.icon?.trim() || '',
          position: index
        }));
      
      await saveUserLinks(sessionId, validatedLinks);
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Update error:', error);
    return Response.json({ error: error.message || 'Failed to update data' }, { status: 400 });
  }
}
