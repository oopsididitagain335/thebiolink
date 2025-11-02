// app/api/webhooks/stripe/route.ts
import { NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe';
import { updateUserPlan } from '@/lib/db';
import { headers } from 'next/headers';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  const body = await req.text(); // ✅ Get raw body as string
  const buf = Buffer.from(body); // ✅ Convert to Buffer for Stripe
  const sig = headers().get('Stripe-Signature');

  if (!sig) {
    return new Response('No signature', { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    if (session.mode !== 'subscription') return new Response(null, { status: 200 });

    const email = session.customer_details?.email;
    const plan = session.metadata?.plan;

    if (email && plan && ['basic', 'premium', 'fwiend'].includes(plan)) {
      try {
        await updateUserPlan(email, plan);
      } catch (dbErr) {
        console.error('Failed to update user plan:', dbErr);
        return new Response('DB update failed', { status: 500 });
      }
    }
  }

  return new Response(null, { status: 200 });
}
