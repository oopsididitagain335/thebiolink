// app/api/badge/create-checkout-session/route.ts
import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { getUserById } from '@/lib/storage';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(request: NextRequest) {
  const headersList = headers();
  const userId = headersList.get('user-id');

  if (!userId) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const user = await getUserById(userId);
  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  const { option } = await request.json();

  if (!option) {
    return Response.json({ error: 'Badge option is required' }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `Custom Badge: ${option}`,
            description: 'One-time purchase for a custom badge on your profile',
          },
          unit_amount: 200, // £2.00 in pence
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?badge_success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?badge_cancelled=true`,
    metadata: {
      userId: userId,
      option: option,
    },
  });

  return Response.json({ sessionId: session.id });
}
