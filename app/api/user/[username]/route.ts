import { NextRequest } from 'next/server';
import { getUserByUsername } from '@/lib/storage';

export const dynamic = 'force-dynamic';

// Explicitly define the route context type
interface RouteContext {
  params: {
    username: string;
  };
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { username } = context.params;

  if (!username) {
    return Response.json({ error: 'Username is required' }, { status: 400 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip')?.trim() ||
             '0.0.0.0';

  const userData = await getUserByUsername(username, ip);

  if (!userData) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  // Remove sensitive fields
  const { password, email, ...safeData } = userData as Record<string, unknown>;

  return Response.json(safeData);
}
