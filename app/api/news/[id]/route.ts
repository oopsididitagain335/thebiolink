// app/api/news/[id]/route.ts
import { NextRequest } from 'next/server';
import { getNewsPostById, updateNewsPostById, deleteNewsPostById } from '@/lib/storage';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const post = await getNewsPostById(params.id);
    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }
    return Response.json(post);
  } catch (error) {
    console.error('Error fetching news post:', error);
    return Response.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { title, content, imageUrl } = await request.json();
    if (!title?.trim() || !content?.trim()) {
      return Response.json({ error: 'Title and content required' }, { status: 400 });
    }

    const updated = await updateNewsPostById(params.id, {
      title,
      content,
      imageUrl: imageUrl?.trim() || undefined,
    });

    if (!updated) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    return Response.json(updated);
  } catch (error) {
    console.error('Error updating news post:', error);
    return Response.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await deleteNewsPostById(params.id);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting news post:', error);
    return Response.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
