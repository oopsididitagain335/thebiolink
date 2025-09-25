import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { updateUserProfile, saveUserLinks } from '@/lib/storage';

export async function PUT(request: NextRequest) {
  const sessionId = (await cookies()).get('biolink_session')?.value;
  if (!sessionId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { profile, links } = await request.json();
  
  try {
    await updateUserProfile(sessionId, profile);
    await saveUserLinks(sessionId, links);
    
    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
