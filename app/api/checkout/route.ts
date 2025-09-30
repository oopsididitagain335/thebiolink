// app/api/checkout/route.ts
import { NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getUserByEmail, updateUserPlan } from '@/lib/db';

const VALID_PRICES = [5, 15, 60];
const PLAN_NAMES: Record<number, string> = {
  5: 'basic',
  15: 'premium',
  60: 'fwiend',
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const email = (formData.get('email') as string)?.trim();
    const rawPrice = formData.get('price');
    const priceNum = rawPrice ? parseInt(rawPrice as string, 10) : null;

    if (!email || !priceNum || !VALID_PRICES.includes(priceNum)) {
      const url = new URL('/pricing', process.env.NEXTAUTH_URL || 'http://localhost:3000');
      url.searchParams.set('error', 'Invalid request');
      return Response.redirect(url, 303);
    }

    // ✅ Validate: user must exist (free account)
    const user = await getUserByEmail(email);
    if (!user) {
      const url = new URL('/pricing', process.env.NEXTAUTH_URL || 'http://localhost:3000');
      url.searchParams.set('error', 'No account found with that email. Sign up first!');
      return Response.redirect(url, 303);
    }

    // Optional: prevent upgrading already paid users
    if (user.plan !== 'free') {
      const url = new URL('/pricing', process.env.NEXTAUTH_URL || 'http://localhost:3000');
      url.searchParams.set('error', 'You already have an active subscription!');
      return Response.redirect(url, 303);
    }

    const planName = PLAN_NAMES[priceNum];

    // Create product
    const product = await stripe.products.create({
      name: `${planName.charAt(0).toUpperCase() + planName.slice(1)} Plan`,
      description: `BioLink ${planName} subscription`,
    });

    // Create GBP price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: priceNum * 100,
      currency: 'gbp',
      recurring: { interval: 'month' },
    });

    // Create checkout session — pre-fill email
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email, // 👈 pre-fill email in Stripe
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: `${process.env.NEXTAUTH_URL}/api/checkout-success?session_id={CHECKOUT_SESSION_ID}&email=${encodeURIComponent(email)}&plan=${planName}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing`,
    });

    return Response.redirect(checkoutSession.url!, 303);

  } catch (error: any) {
    console.error('Checkout error:', error);
    const url = new URL('/pricing', process.env.NEXTAUTH_URL || 'http://localhost:3000');
    url.searchParams.set('error', 'Failed to start checkout. Please try again.');
    return Response.redirect(url, 303);
  }
}
