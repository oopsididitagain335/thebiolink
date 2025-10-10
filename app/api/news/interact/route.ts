// app/api/news/interact/route.ts
import { NextRequest } from 'next/server';
import { addNewsInteraction } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const { postId, email, type, content } = await request.json();

    if (!postId || !email || !['like', 'comment'].includes(type)) {
      return Response.json({ error: 'Invalid input' }, { status: 400 });
    }

    if (type === 'comment' && !content?.trim()) {
      return Response.json({ error: 'Comment content is required' }, { status: 400 });
    }

    const updatedPost = await addNewsInteraction(postId, email, type, content);
    return Response.json(updatedPost);
  } catch (error: any) {
    return Response.json({ error: error.message || 'Action failed' }, { status: 400 });
  }
}
