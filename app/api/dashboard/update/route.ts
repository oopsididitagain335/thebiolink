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
    // ✅ AWAIT request.json()
    const body = await request.json();
    const { profile, links } = body;

    // Validate session ID is a valid ObjectId
    let userId: string;
    try {
      userId = new ObjectId(sessionId).toString();
    } catch {
      return Response.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Update profile if provided
    if (profile) {
      await updateUserProfile(userId, profile);
    }

    // Save links if provided
    if (Array.isArray(links)) {
      const validatedLinks = links
        .filter(link => link.url?.trim() && link.title?.trim())
        .map((link, index) => ({
          id: link.id || new ObjectId().toString(),
          url: link.url.trim(),
          title: link.title.trim(),
          icon: link.icon?.trim() || '',
          position: index
        }));
      
      await saveUserLinks(userId, validatedLinks);
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Update error:', error);
    return Response.json({ 
      error: error.message || 'Failed to update data',
      details: error.toString()
    }, { status: 400 });
  }
}
