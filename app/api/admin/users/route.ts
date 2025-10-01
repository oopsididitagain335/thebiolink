// app/api/admin/users/route.ts
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
    const User = (await import('@/models/User')).default;

    // ✅ Populate badges if using refs, or ensure they're embedded
    const users = await User.find({}).select('email username name isBanned badges').lean();

    // Ensure badges is always an array
    const safeUsers = users.map(user => ({
      ...user,
      id: user._id.toString(),
      badges: Array.isArray(user.badges) ? user.badges : [],
    }));

    return Response.json(safeUsers);
  } catch (error) {
    console.error('Fetch users error:', error);
    return Response.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// Add badge to user
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId, badge } = await req.json();
    if (!userId || !badge?.id) {
      return Response.json({ error: 'Invalid input' }, { status: 400 });
    }

    await connectToDB();
    const User = (await import('@/models/User')).default;

    const user = await User.findById(userId);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent duplicate badges
    const badgeExists = user.badges.some((b: any) => b.id === badge.id);
    if (badgeExists) {
      return Response.json({ error: 'Badge already awarded' }, { status: 400 });
    }

    user.badges.push({
      id: badge.id,
      name: badge.name,
      icon: badge.icon,
      awardedAt: new Date().toISOString(),
    });

    await user.save();

    // ✅ Return updated user (or just success)
    return Response.json({ success: true });
  } catch (error) {
    console.error('Add badge error:', error);
    return Response.json({ error: 'Failed to add badge' }, { status: 500 });
  }
}

// Remove badge
export async function DELETE(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId, badgeId } = await req.json();
    if (!userId || !badgeId) {
      return Response.json({ error: 'Invalid input' }, { status: 400 });
    }

    await connectToDB();
    const User = (await import('@/models/User')).default;

    const user = await User.findById(userId);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    user.badges = user.badges.filter((b: any) => b.id !== badgeId);
    await user.save();

    return Response.json({ success: true });
  } catch (error) {
    console.error('Remove badge error:', error);
    return Response.json({ error: 'Failed to remove badge' }, { status: 500 });
  }
}
