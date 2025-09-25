import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getUserById } from '@/lib/storage';

export async function GET() {
  const sessionId = (await cookies()).get('biolink_session')?.value;
  if (!sessionId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const user = await getUserById(sessionId);
  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }
  
  const database = (await import('@/lib/storage')).connectDB();
  const links = await database.collection('links').find({ userId: user._id }).toArray();
  
  return Response.json({
    user: {
      _id: user._id.toString(),
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      isEmailVerified: user.isEmailVerified
    },
    links: links.map((link: any) => ({
      id: link._id.toString(),
      url: link.url,
      title: link.title,
      icon: link.icon
    }))
  });
}
