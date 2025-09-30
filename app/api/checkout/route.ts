// app/api/checkout/route.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getUserByEmail, updateUserPlan } from '@/lib/db';

// Valid monthly prices in GBP
const VALID_PRICES = [5, 15, 60];
const PLAN_NAMES: Record<number, string> = {
  5: 'basic',
  15: 'premium',
  60: 'fwiend',
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  const formData = await req.formData();
  const rawPrice = formData.get('price');
  const priceNum = rawPrice ? parseInt(rawPrice as string, 10) : null;

  if (!priceNum || !VALID_PRICES.includes(priceNum)) {
    return new Response('Invalid price', { status: 400 });
  }

  const planName = PLAN_NAMES[priceNum];
  const user = await getUserByEmail(session.user.email);
  if (!user) return new Response('User not found', { status: 404 });

  // Create product dynamically
  const product = await stripe.products.create({
    name: `${planName.charAt(0).toUpperCase() + planName.slice(1)} Plan`,
    description: `BioLink ${planName} subscription`,
  });

  // Create recurring price in GBP (pence)
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: priceNum * 100, // Stripe uses smallest currency unit (pence for GBP)
    currency: 'gbp',             // ← Changed to GBP
    recurring: { interval: 'month' },
  });

  // Create checkout session
  const sessionObj = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: session.user.email,
    line_items: [{ price: price.id, quantity: 1 }],
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true&plan=${planName}`,
    cancel_url: `${process.env.NEXTAUTH_URL}/pricing`,
  });

  // ⚠️ Activate plan immediately (no webhook)
  await updateUserPlan(session.user.email, planName, sessionObj.customer as string | null);

  return new Response(null, {
    status: 303,
    headers: { Location: sessionObj.url! },
  });
}
