import { NextRequest, NextResponse } from 'next/server';
import { getUserByUsername } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  context: { params: { username: string } }
) {
  const { username } = context.params;

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0';

  const userData = await getUserByUsername(username, ip);

  if (!userData) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(userData);
}
