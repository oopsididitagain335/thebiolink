// app/api/checkout/route.ts
import { NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe';

const ALLOWED_PRICES = [5, 15, 60]; // GBP

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const email = (formData.get('email') as string)?.trim();
    const priceNum = Number(formData.get('price'));

    // Validate
    if (!email || !ALLOWED_PRICES.includes(priceNum)) {
      return Response.redirect(new URL('/pricing?error=Invalid+request', process.env.SITE_URL), 303);
    }

    // Create one-time product & price
    const product = await stripe.products.create({
      name: `BioLink Plan (£${priceNum}/mo)`,
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: priceNum * 100, // pence
      currency: 'gbp',
      recurring: { interval: 'month' },
    });

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: `${process.env.SITE_URL}/success`,
      cancel_url: `${process.env.SITE_URL}/pricing`,
    });

    // Redirect to Stripe
    return Response.redirect(session.url!, 303);

  } catch (err) {
    console.error(err);
    return Response.redirect(new URL('/pricing?error=Checkout+failed', process.env.SITE_URL), 303);
  }
}
