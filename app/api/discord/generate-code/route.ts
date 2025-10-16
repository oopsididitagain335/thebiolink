// app/api/discord/generate-code/route.ts
import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { createDiscordLinkCode } from '@/lib/storage';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const code = await createDiscordLinkCode(session.user.id);
    return Response.json({ code });
  } catch (error) {
    console.error('Code generation error:', error);
    return Response.json({ error: 'Failed to generate code' }, { status: 500 });
  }
}
