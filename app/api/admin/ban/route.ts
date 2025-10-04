// app/api/admin/ban/route.ts
import { NextRequest } from 'next/server';
import { banUser, unbanUser } from '@/lib/storage';

function getIP(req: NextRequest): string | undefined {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip')?.trim() ||
    undefined
  );
}

export async function POST(req: NextRequest) {
  try {
    const { userId, action } = await req.json();

    if (!userId || !action || !['ban', 'unban'].includes(action)) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    const ipAddress = getIP(req);

    if (action === 'ban') {
      await banUser(userId, ipAddress);
    } else {
      await unbanUser(userId);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Ban action failed:', error);
    return Response.json({ error: 'Action failed' }, { status: 500 });
  }
}
