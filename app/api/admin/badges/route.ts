// app/api/admin/badges/route.ts
import { NextRequest } from 'next/server';
import { getAllBadges, createBadge, deleteBadgeById } from '@/lib/storage';

export async function GET() {
  try {
    const badges = await getAllBadges();
    return Response.json(badges);
  } catch (error) {
    console.error('Failed to fetch badges:', error);
    return Response.json({ error: 'Failed to fetch badges' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, icon } = await req.json();
    if (!name || !icon) {
      return Response.json({ error: 'Name and icon are required' }, { status: 400 });
    }

    const newBadge = await createBadge(name, icon);
    return Response.json(newBadge);
  } catch (error) {
    console.error('Failed to create badge:', error);
    return Response.json({ error: 'Failed to create badge' }, { status: 500 });
  }
}

// Add DELETE support for badge deletion
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
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
