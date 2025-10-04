// app/api/settings/route.ts
import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth'; // ✅ Import from lib/auth.ts
import { updateUserPlan, updateUserPassword } from '@/lib/db';
import { hash } from 'bcryptjs';

export async function PUT(req: NextRequest) {
  const session = await getServerSession(); // ✅ No need to pass authOptions in v4 if exported correctly
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { action, ...data } = await req.json();

  try {
    if (action === 'update_password') {
      if (!data.password || data.password.length < 8) {
        return new Response('Password must be at least 8 characters', { status: 400 });
      }
      const hashed = await hash(data.password, 12);
      await updateUserPassword(session.user.email, hashed);
      return Response.json({ success: true });
    }

    if (action === 'cancel_subscription') {
      await updateUserPlan(session.user.email, 'free');
      return Response.json({ success: true });
    }

    if (action === 'update_email') {
      // Optional: update email in DB
      return Response.json({ success: true });
    }

    if (action === 'claim_weekly_badge') {
      return Response.json({ message: 'Badge claimed!' });
    }

    return new Response('Invalid action', { status: 400 });
  } catch (error) {
    console.error('Settings error:', error);
    return new Response('Internal error', { status: 500 });
  }
}
