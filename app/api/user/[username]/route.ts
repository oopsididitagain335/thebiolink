import { NextRequest } from 'next/server';
import { getUserByUsername } from '@/lib/storage';

export const dynamic = 'force-dynamic';

// Define the exact expected context type
interface Context {
  params: {
    username: string;
  };
}

export async function GET(request: NextRequest, context: Context) {
  const { username } = context.params;

  if (!username) {
    return Response.json({ error: 'Username is required' }, { status: 400 });
  }

  // Safely extract client IP
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    '0.0.0.0';

  let userData;
  try {
    userData = await getUserByUsername(username, ip);
  } catch (err) {
    console.error('Database error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }

  if (!userData) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  // Strip sensitive fields (adjust based on your actual user object)
  const { password, email, apiKey, ...safeUser } = userData as Record<string, unknown>;

  return Response.json(safeUser);
}
