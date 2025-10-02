// app/api/dashboard/update/route.ts
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { updateUserProfile, saveUserLinks, saveUserWidgets } from '@/lib/storage';

export async function PUT(request: NextRequest) {
  const sessionId = (await cookies()).get('biolink_session')?.value;
  if (!sessionId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // ✅ Save profile (only if provided)
    if (body.profile) {
      await updateUserProfile(sessionId, body.profile);
    }

    // ✅ Save links (only if provided)
    if (Array.isArray(body.links)) {
      await saveUserLinks(sessionId, body.links);
    }

    // ✅ Save widgets (only if provided)
    if (Array.isArray(body.widgets)) {
      await saveUserWidgets(sessionId, body.widgets);
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Update error:', error.message || error);
    return Response.json({ error: error.message || 'Update failed' }, { status: 400 });
  }
}
