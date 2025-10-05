// app/api/admin/badges/route.ts
import { NextRequest } from 'next/server';
import { getAllBadges, createBadge } from '@/lib/storage';
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
