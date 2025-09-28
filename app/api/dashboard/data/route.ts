import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getUserById, connectToDatabase } from '@/lib/storage';
import { ObjectId } from 'mongodb';

export async function GET() {
  const sessionId = (await cookies()).get('biolink_session')?.value;
  if (!sessionId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let userId: string;
    try {
      userId = new ObjectId(sessionId).toString();
    } catch {
      return Response.json({ error: 'Invalid session' }, { status: 401 });
    }

    const user = await getUserById(userId);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // --- Fetch user's links from the database ---
    const { db } = await connectToDatabase();
    const linksCollection = db.collection('links');
    const linksCursor = linksCollection.find({ userId: new ObjectId(user._id) });
    const links = await linksCursor.toArray();

    return Response.json({
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        background: user.background,
        backgroundVideo: user.backgroundVideo,
        backgroundAudio: user.backgroundAudio,
        email: user.email,
        isBanned: user.isBanned,
        badges: user.badges || [],
        links: user.links || [],
      },
      links: links
        .map(link => ({
          id: link._id.toString(),
          url: link.url,
          title: link.title,
          icon: link.icon,
          position: link.position,
        }))
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)), // sort by position
    });
  } catch (error: any) {
    console.error('Dashboard Data Fetch Error:', error);
    return Response.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
