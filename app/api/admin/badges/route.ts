// app/api/admin/badges/route.ts
import { NextRequest } from 'next/server';
import { connectToDB } from '@/lib/db';
import { getServerSession } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDB();
    const Badge = (await import('@/models/Badge')).default;
    const badges = await Badge.find({}).select('name icon').lean();
    const safeBadges = badges.map(b => ({
      ...b,
      id: b._id.toString(),
    }));
    return Response.json(safeBadges);
  } catch (error) {
    console.error('Fetch badges error:', error);
    return Response.json({ error: 'Failed to fetch badges' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, icon } = await req.json();
    if (!name || !icon) {
      return Response.json({ error: 'Name and icon required' }, { status: 400 });
    }

    await connectToDB();
    const Badge = (await import('@/models/Badge')).default;

    const newBadge = new Badge({ name, icon });
    await newBadge.save();

    return Response.json({
      id: newBadge._id.toString(),
      name: newBadge.name,
      icon: newBadge.icon,
    });
  } catch (error) {
    console.error('Create badge error:', error);
    return Response.json({ error: 'Failed to create badge' }, { status: 500 });
  }
}
