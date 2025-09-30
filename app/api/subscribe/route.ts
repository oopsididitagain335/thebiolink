// app/api/subscribe/route.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { updateUserPlan } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  const formData = await req.formData();
  const plan = formData.get('plan');
  if (plan !== 'free') {
    return new Response('Invalid plan', { status: 400 });
  }

  await updateUserPlan(session.user.email, 'free');
  return new Response(null, { status: 303, headers: { Location: '/dashboard' } });
}
