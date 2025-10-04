// app/api/settings/route.ts
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextRequest } from 'next/server';
import { updateUserPlan, updateUserPassword } from '@/lib/db';
import { hash } from 'bcryptjs';

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
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
      // Downgrade to free (no Stripe cancel needed if you don't use webhooks)
      await updateUserPlan(session.user.email, 'free');
      return Response.json({ success: true });
    }

    if (action === 'update_email') {
      // Optional: update email
      return Response.json({ success: true });
    }

    return new Response('Invalid action', { status: 400 });
  } catch (error) {
    console.error('Settings error:', error);
    return new Response('Internal error', { status: 500 });
  }
}
