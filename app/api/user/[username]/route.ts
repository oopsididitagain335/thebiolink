import { NextRequest } from 'next/server';
import { getUserByUsername } from '@/lib/storage';

export const dynamic = 'force-dynamic'; // Ensures no caching for accurate view counts

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;

    if (!username) {
      return Response.json({ error: 'Username is required' }, { status: 400 });
    }

    // Extract real client IP safely
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip')?.trim() || 
               '0.0.0.0';

    const userData = await getUserByUsername(username, ip);

    if (!userData) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Sanitize sensitive data before sending to client
    const { password, email, ...safeUserData } = userData as Record<string, any>;

    return Response.json(safeUserData);
  } catch (error) {
    console.error('API Error in /api/user/[username]:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
