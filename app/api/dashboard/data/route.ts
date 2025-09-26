// app/api/dashboard/data/route.ts
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getUserById } from '@/lib/storage';
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

    // --- Fetch user's links ---
    const database = (await import('@/lib/storage')).connectDB();
    const linksCollection = (await database).collection('links');
    const linksCursor = linksCollection.find({ userId: new ObjectId(user._id) });
    const links = await linksCursor.toArray();

    return Response.json({
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        background: user.background, // ✅ Include background
        isEmailVerified: user.isEmailVerified,
        email: user.email, // ✅ Include email for admin check
        badges: user.badges || [] // ✅ Include badges
      },
      links: links.map((link: any) => ({
        id: link._id.toString(),
        url: link.url,
        title: link.title,
        icon: link.icon,
        position: link.position
      })).sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0)) // Sort by position
    });
  } catch (error: any) {
    console.error('Dashboard Data Fetch Error:', error);
    return Response.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
