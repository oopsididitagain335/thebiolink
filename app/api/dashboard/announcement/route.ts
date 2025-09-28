import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'next-auth/react';
import { getLatestAnnouncement, sendAnnouncement } from '@/lib/storage';

export async function GET(req: NextRequest) {
  try {
    const announcement = await getLatestAnnouncement();
    return NextResponse.json(announcement || {});
  } catch (error) {
    console.error('Error fetching announcement:', error);
    return NextResponse.json({ error: 'Failed to fetch announcement' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession({ req });
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.email !== 'lyharry31@gmail.com') {
      return NextResponse.json({ error: 'Forbidden: Only admin can send announcements' }, { status: 403 });
    }

    const { text } = await req.json();
    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Invalid announcement text' }, { status: 400 });
    }

    await sendAnnouncement(text.trim(), session.user.id);
    return NextResponse.json({ message: 'Announcement sent' }, { status: 200 });
  } catch (error) {
    console.error('Error sending announcement:', error);
    return NextResponse.json({ error: 'Failed to send announcement' }, { status: 500 });
  }
}
