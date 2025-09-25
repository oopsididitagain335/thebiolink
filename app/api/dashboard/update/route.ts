// PUT update user data
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
    // Update profile
    await updateUserProfile(sessionId, profile);
    
    // Update links
    await saveUserLinks(sessionId, links);
    
    return Response.json({ 
      success: true,
      newUrl: profile.username ? `/dashboard` : undefined
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
