// app/api/checkout-success/route.ts
import { NextRequest } from 'next/server';
import { updateUserPlan } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const plan = searchParams.get('plan');

  if (!email || !plan || !['basic', 'premium', 'fwiend'].includes(plan)) {
    return Response.redirect(new URL('/pricing?error=Invalid request', process.env.NEXTAUTH_URL!), 303);
  }

  try {
    // ✅ Activate plan immediately (simulate payment success)
    await updateUserPlan(email, plan);

    // Redirect to dashboard or success page
    const url = new URL('/dashboard', process.env.NEXTAUTH_URL!);
    url.searchParams.set('success', 'true');
    url.searchParams.set('plan', plan);
    return Response.redirect(url, 303);
  } catch (error) {
    console.error('Checkout success error:', error);
    const url = new URL('/pricing?error=Activation failed', process.env.NEXTAUTH_URL!);
    return Response.redirect(url, 303);
  }
}
