// app/api/news/[id]/route.ts
import { NextRequest } from 'next/server';
import { getNewsPostById, updateNewsPostById, deleteNewsPostById } from '@/lib/storage';

export async function GET(_request: NextRequest, context: any) {
  try {
    const { id } = context.params;

    if (!id) {
      return Response.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const post = await getNewsPostById(id);
    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    return Response.json(post);
  } catch (error: any) {
    console.error('Error fetching news post:', error);
    return Response.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  try {
    const { id } = context.params;
    const { title, content, imageUrl } = await request.json();

    if (!id) {
      return Response.json({ error: 'Post ID is required' }, { status: 400 });
    }
    if (!title?.trim() || !content?.trim()) {
      return Response.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const updatedPost = await updateNewsPostById(id, { title, content, imageUrl });
    if (!updatedPost) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    return Response.json(updatedPost);
  } catch (error: any) {
    console.error('Error updating news post:', error);
    return Response.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  try {
    const { id } = context.params;

    if (!id) {
      return Response.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const success = await deleteNewsPostById(id);
    if (!success) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting news post:', error);
    return Response.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
