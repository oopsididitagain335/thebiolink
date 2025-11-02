// app/api/checkout/route.ts
import { NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe';

const ALLOWED_PRICES = [5, 15, 60]; // GBP

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const email = (formData.get('email') as string)?.trim();
    const priceNum = Number(formData.get('price'));

    if (!email || !ALLOWED_PRICES.includes(priceNum)) {
      return Response.redirect(new URL('/pricing?error=Invalid+request', process.env.SITE_URL), 303);
    }

    // Keep your dynamic product & price creation — this is fine
    const product = await stripe.products.create({
      name: `BioLink Plan (£${priceNum}/mo)`,
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: priceNum * 100, // pence
      currency: 'gbp',
      recurring: { interval: 'month' },
    });

    // Map price to plan name for webhook
    let plan: 'basic' | 'premium' | 'fwiend';
    if (priceNum === 5) plan = 'basic';
    else if (priceNum === 15) plan = 'premium';
    else plan = 'fwiend';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: `${process.env.SITE_URL}/success`,
      cancel_url: `${process.env.SITE_URL}/pricing`,
      metadata: { plan, price_id: price.id }, // send plan to webhook
    });

    return Response.redirect(session.url!, 303);
  } catch (err) {
    console.error(err);
    return Response.redirect(new URL('/pricing?error=Checkout+failed', process.env.SITE_URL), 303);
  }
}
