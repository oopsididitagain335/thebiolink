import { NextRequest } from 'next/server';
import { getUserByUsername } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0';
  const userData = await getUserByUsername(params.username, ip);

  if (!userData) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  return Response.json(userData);
}
