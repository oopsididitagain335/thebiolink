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
    const { profile, links, widgets } = await request.json();

    if (profile) {
      await updateUserProfile(sessionId, profile);
    }

    if (Array.isArray(links)) {
      await saveUserLinks(sessionId, links);
    }

    if (Array.isArray(widgets)) {
      await saveUserWidgets(sessionId, widgets);
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Update error:', error.message);
    return Response.json({ error: error.message || 'Failed to update data' }, { status: 400 });
  }
}
