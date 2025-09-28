// app/api/admin/award-badge/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserById, addUserBadge } from '@/lib/storage';

// Define types inline (or move to a shared types file)
interface Badge {
  name: string;
  // Add other properties if your badge objects have them (e.g., id, awardedAt)
}

interface User {
  id: string;
  email: string;
  badges: Badge[];
  // Add other user properties as needed
}

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session-token')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserById(sessionToken);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Now TypeScript knows `b` is of type `Badge`
    const isAdmin =
      user.email === 'lyharry31@gmail.com' ||
      user.badges.some((b: Badge) => b.name === 'Owner');

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only admin can award badges' },
        { status: 403 }
      );
    }

    const { userId, badge } = await req.json();
    if (!userId || !badge) {
      return NextResponse.json(
        { error: 'Missing userId or badge' },
        { status: 400 }
      );
    }

    await addUserBadge(userId, badge);
    return NextResponse.json(
      { message: 'Badge awarded successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error awarding badge:', error);
    return NextResponse.json(
      { error: 'Failed to award badge' },
      { status: 500 }
    );
  }
}
