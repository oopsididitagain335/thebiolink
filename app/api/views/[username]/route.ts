import { NextRequest } from 'next/server';
import { getViewCount } from '@/lib/storage';

export async function GET(request: NextRequest, context: { params: { username: string } }) {
  const { username } = context.params;

  try {
    const count = await getViewCount(username);
    return new Response(JSON.stringify({ count }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching view count:', error); // Add logging for debugging
    return new Response(JSON.stringify({ count: 0 }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
