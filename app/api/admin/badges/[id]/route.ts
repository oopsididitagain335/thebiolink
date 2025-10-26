// app/api/admin/badges/[id]/route.ts
import { NextRequest } from 'next/server';
import { deleteBadgeById } from '@/lib/storage';

export async function DELETE(request: NextRequest, context: any) {
  try {
    const { id } = context.params;

    if (!id) {
      return Response.json({ error: 'Badge ID is required' }, { status: 400 });
    }

    await deleteBadgeById(id);
    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Delete badge error:', error);
    return Response.json(
      { error: error.message || 'Failed to delete badge' },
      { status: 500 }
    );
  }
}
