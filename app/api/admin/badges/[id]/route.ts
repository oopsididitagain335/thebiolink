// app/api/admin/badges/[id]/route.ts
import { NextRequest } from 'next/server';
import { deleteBadgeById } from '@/lib/storage';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return Response.json({ error: 'Badge ID required' }, { status: 400 });
    }

    await deleteBadgeById(id);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to delete badge:', error);
    return Response.json({ error: 'Failed to delete badge' }, { status: 500 });
  }
}
