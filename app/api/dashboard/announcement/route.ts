// app/api/dashboard/announcement/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserById, getLatestAnnouncement, sendAnnouncement } from '@/lib/storage';

// Optional: Add types for better safety
interface Badge {
  name: string;
}

interface User {
  _id: string;
  email: string;
  badges: Badge[];
}

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session-token')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserById(sessionToken);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const announcement = await getLatestAnnouncement();
    return NextResponse.json(announcement || {});
  } catch (error) {
    console.error('Error fetching announcement:', error);
    return NextResponse.json({ error: 'Failed to fetch announcement' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session-token')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Use getUserById — NOT getUserByEmail
    const user = await getUserById(sessionToken) as User | null;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin =
      user.email === 'lyharry31@gmail.com' ||
      user.badges.some((b: Badge) => b.name === 'Owner');

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only admin can send announcements' },
        { status: 403 }
      );
    }

    const { text } = await req.json();
    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Invalid announcement text' }, { status: 400 });
    }

    await sendAnnouncement(text.trim(), user._id);
    return NextResponse.json({ message: 'Announcement sent' }, { status: 200 });
  } catch (error) {
    console.error('Error sending announcement:', error);
    return NextResponse.json({ error: 'Failed to send announcement' }, { status: 500 });
  }
}
