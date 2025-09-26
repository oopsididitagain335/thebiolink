// app/api/badge/create-checkout-session/route.ts
import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { getUserById } from '@/lib/storage';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia', // Updated to the correct API version
});

export async function POST(request: NextRequest) {
  const headersList = headers();
  // Explicitly cast headersList to access the get method
  const userId = (headersList as any).get('user-id') as string | null;

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

  const PRICES: Record<string, number> = {
    Common: 200,
    Uncommon: 225,
    Rare: 250,
  };

  let price = PRICES[option] || 200; // Simplified price logic with fallback

  try {
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
            unit_amount: price,
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
  } catch (error) {
    return Response.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
