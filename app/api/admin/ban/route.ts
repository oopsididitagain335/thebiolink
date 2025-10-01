// app/api/admin/ban/route.ts
import { NextRequest } from 'next/server';
import { banUser, unbanUser } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const { userId, action } = await req.json();
    if (!userId || !action || !['ban', 'unban'].includes(action)) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    if (action === 'ban') {
      await banUser(userId);
    } else {
      await unbanUser(userId);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Ban action failed:', error);
    return Response.json({ error: 'Action failed' }, { status: 500 });
  }
}
