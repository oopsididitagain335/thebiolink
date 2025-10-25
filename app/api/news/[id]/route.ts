// app/api/news/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getNewsPostById } from '@/lib/storage';

export async function GET(request: NextRequest) {
  // Extract 'id' from the URL path: /api/news/abc123 → 'abc123'
  const url = new URL(request.url);
  const pathname = url.pathname; // e.g., "/api/news/68e9af3b2e68623c68033f68"
  const id = pathname.split('/').pop(); // gets last segment

  if (!id || id === 'news') {
    return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
  }

  try {
    const post = await getNewsPostById(id);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    return NextResponse.json(post);
  } catch (error) {
    console.error('Error in /api/news/[id]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
