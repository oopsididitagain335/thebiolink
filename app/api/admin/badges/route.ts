// app/api/admin/badges/route.ts
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getUserById, createBadge, getAllBadges } from '@/lib/storage'; // ✅ Now imports correctly

export async function GET() {
  const sessionId = (await cookies()).get('biolink_session')?.value;
  if (!sessionId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await getUserById(sessionId);
    if (!user || user.email !== 'lyharry31@gmail.com') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const badges = await getAllBadges();
    return Response.json(badges);
  } catch (error) {
    console.error('Admin GET Badges Error:', error);
    return Response.json({ error: 'Failed to fetch badges' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const sessionId = (await cookies()).get('biolink_session')?.value;
  if (!sessionId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await getUserById(sessionId);
    if (!user || user.email !== 'lyharry31@gmail.com') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, icon } = await request.json();

    if (!name || !icon) {
      return Response.json({ error: 'Name and icon are required' }, { status: 400 });
    }

    const badge = await createBadge(name, icon);
    return Response.json(badge);
  } catch (error) {
    console.error('Admin POST Create Badge Error:', error);
    return Response.json({ error: 'Failed to create badge' }, { status: 500 });
  }
}
