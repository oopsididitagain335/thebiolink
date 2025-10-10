// app/api/news/route.ts
import { NextRequest } from 'next/server';
import { createNewsPost, getAllNewsPosts } from '@/lib/storage';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const posts = await getAllNewsPosts();
    return Response.json(posts);
  } catch (error: any) {
    return Response.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.plan !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { title, content } = await request.json();
    if (!title?.trim() || !content?.trim()) {
      return Response.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const post = await createNewsPost(title, content, user._id, user.name);
    return Response.json(post);
  } catch (error: any) {
    return Response.json({ error: 'Failed to create news post' }, { status: 500 });
  }
}
