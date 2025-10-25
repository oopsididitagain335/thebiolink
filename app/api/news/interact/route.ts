// app/api/news/interact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { addNewsInteraction } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const { postId, email, type, content } = await request.json();

    if (!postId || !email || !['like', 'comment'].includes(type)) {
      return NextResponse.json({ error: 'Invalid input: postId, email, and valid type are required' }, { status: 400 });
    }

    if (type === 'comment' && !content?.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    const updatedPost = await addNewsInteraction(postId, email, type, content);
    return NextResponse.json(updatedPost);
  } catch (error: any) {
    console.error('Error in /api/news/interact:', error);
    return NextResponse.json({ error: error.message || 'Action failed' }, { status: 400 });
  }
}
