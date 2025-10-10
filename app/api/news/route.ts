// app/api/news/route.ts
import { NextRequest } from 'next/server';
import { createNewsPost, getAllNewsPosts, getUserById } from '@/lib/storage';
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
  const authUser = await getCurrentUser();
  if (!authUser) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const fullUser = await getUserById(authUser._id);
  if (!fullUser) {
    return Response.json({ error: 'User not found' }, { status: 403 });
  }

  try {
    const { title, content, imageUrl } = await request.json();
    if (!title?.trim() || !content?.trim()) {
      return Response.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const post = await createNewsPost(title, content, imageUrl, fullUser._id, fullUser.name);
    return Response.json(post);
  } catch (error: any) {
    return Response.json({ error: error.message || 'Failed to create news post' }, { status: 500 });
  }
}
