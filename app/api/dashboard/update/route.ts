import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { updateUserProfile, saveUserLinks } from '@/lib/storage';

export async function PUT(request: NextRequest) {
  const sessionId = (await cookies()).get('biolink_session')?.value;
  if (!sessionId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { profile, links } = await request.json(); // ✅ AWAIT request.json()

    if (profile) {
      await updateUserProfile(sessionId, profile);
    }

    if (Array.isArray(links)) {
      // ✅ Don't regenerate IDs on save - keep existing ones
      const validatedLinks = links
        .filter(link => link.url?.trim() && link.title?.trim())
        .map((link, index) => ({
          id: link.id, // ← Keep original ID
          url: link.url.trim(),
          title: link.title.trim(),
          icon: link.icon?.trim() || '',
          position: index
        }));
      
      await saveUserLinks(sessionId, validatedLinks);
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Save error:', error);
    return Response.json({ error: error.message }, { status: 400 });
  }
}
