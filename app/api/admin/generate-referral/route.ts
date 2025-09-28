// app/api/admin/generate-referral/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserById } from '@/lib/storage';

interface Badge {
  name: string;
}

interface User {
  email: string;
  badges: Badge[];
}

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session-token')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserById(sessionToken) as User | null;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin =
      user.email === 'lyharry31@gmail.com' ||
      user.badges.some((b: Badge) => b.name === 'Owner');

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Just return the link format — no DB change needed
    const link = `https://www.thebiolink.lol/auth/signup?ref=${userId}`;
    return NextResponse.json({ link }, { status: 200 });
  } catch (error) {
    console.error('Generate referral error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
