// app/api/news/route.ts
import { NextRequest } from 'next/server';
import { getAllNewsPosts, createNewsPost } from '@/lib/storage';

export async function GET() {
  try {
    const posts = await getAllNewsPosts();
    return Response.json(posts);
  } catch (error) {
    console.error('Failed to fetch news:', error);
    return Response.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, content, imageUrl } = await req.json();
    if (!title?.trim() || !content?.trim()) {
      return Response.json({ error: 'Title and content required' }, { status: 400 });
    }

    // Pass arguments individually (not as object)
    const newPost = await createNewsPost(
      title.trim(),
      content.trim(),
      imageUrl?.trim() || '',
      '000000000000000000000000', // Temporary authorId (use real admin ID in production)
      'Admin'
    );

    return Response.json(newPost);
  } catch (error) {
    console.error('Failed to create news post:', error);
    return Response.json({ error: 'Failed to publish news' }, { status: 500 });
  }
}
