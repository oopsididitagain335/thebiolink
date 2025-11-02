// app/api/webhooks/stripe/route.ts
import { NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe';
import { updateUserPlan } from '@/lib/db';
import { buffer } from 'micro';
import { headers } from 'next/headers';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  const buf = await buffer(req);
  const sig = headers().get('Stripe-Signature');

  if (!sig) {
    return Response.json({ error: 'No signature' }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return Response.json({ error: err.message }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Only proceed if it’s a subscription checkout
    if (session.mode !== 'subscription') return Response.json({ received: true });

    const email = session.customer_details?.email;
    const plan = session.metadata?.plan;

    if (email && plan && ['basic', 'premium', 'fwiend'].includes(plan)) {
      try {
        await updateUserPlan(email, plan);
      } catch (dbErr) {
        console.error('Failed to update user plan:', dbErr);
        return Response.json({ error: 'DB update failed' }, { status: 500 });
      }
    }
  }

  return Response.json({ received: true });
}
