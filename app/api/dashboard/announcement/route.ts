import { NextRequest, NextResponse } from 'next/server';
import { getUserById, getLatestAnnouncement, sendAnnouncement } from '@/lib/storage';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session-token')?.value;
    console.log('Announcement GET - Session token:', sessionToken ? 'Present' : 'Missing'); // Debug log
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserById(sessionToken);
    console.log('Announcement GET - User:', user ? user.email : 'Not found'); // Debug log
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
    console.log('Announcement POST - Session token:', sessionToken ? 'Present' : 'Missing'); // Debug log
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserById(sessionToken);
    console.log('Announcement POST - User email:', user ? user.email : 'Not found'); // Debug log
    console.log('Announcement POST - User badges:', user ? user.badges.map(b => b.name) : 'No badges'); // Debug log
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = user.email === 'lyharry31@gmail.com' || user.badges.some((b) => b.name === 'Owner');
    console.log('Announcement POST - Is admin:', isAdmin); // Debug log
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Only admin can send announcements' }, { status: 403 });
    }

    const { text } = await req.json();
    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Invalid announcement text' }, { status: 400 });
    }

    await sendAnnouncement(text.trim(), user._id);
    console.log('Announcement POST - Saved successfully'); // Debug log
    return NextResponse.json({ message: 'Announcement sent' }, { status: 200 });
  } catch (error) {
    console.error('Error sending announcement:', error);
    return NextResponse.json({ error: 'Failed to send announcement' }, { status: 500 });
  }
}
