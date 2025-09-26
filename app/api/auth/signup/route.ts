// app/api/badge/create-checkout-session/route.ts
import { NextRequest } from 'next/server';
import Stripe from 'stripe';

// Use the API version supported by your Stripe library version
// Check your Stripe library documentation or node_modules/@types/stripe/package.json for the latest version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // Update this to the correct version, likely the one shown in the error or the latest stable
  apiVersion: '2025-02-24.acacia', // <-- Changed this line
  // apiVersion: '2024-12-18.acacia', // <-- Or another version supported by your library
  // apiVersion: '2024-11-20.acacia', // <-- This was the old, incompatible version
});

export async function POST(request: NextRequest) {
  const { option } = await request.json();
  const userId = request.headers.get('user-id'); // Consider using Authorization header or session cookies

  if (!userId || !option) {
    return Response.json({ error: 'User ID and option are required' }, { status: 400 });
  }

  // Map the selected option to a Stripe Price ID
  const priceIdMap: { [key: string]: string } = {
    'Common Star': process.env.STRIPE_PRICE_COMMON_STAR_ID!, // Ensure these env vars are set
    'Common Heart': process.env.STRIPE_PRICE_COMMON_HEART_ID!,
    'Common Lightning': process.env.STRIPE_PRICE_COMMON_LIGHTNING_ID!,
    'Uncommon Shield': process.env.STRIPE_PRICE_UNCOMMON_SHIELD_ID!,
    'Uncommon Crown': process.env.STRIPE_PRICE_UNCOMMON_CROWN_ID!,
    'Rare Diamond': process.env.STRIPE_PRICE_RARE_DIAMOND_ID!,
    'Rare Unicorn': process.env.STRIPE_PRICE_RARE_UNICORN_ID!,
    'Rare Phoenix': process.env.STRIPE_PRICE_RARE_PHOENIX_ID!,
  };

  const priceId = priceIdMap[option];

  if (!priceId) {
    return Response.json({ error: 'Invalid option selected' }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?success=true`, // Ensure NEXT_PUBLIC_BASE_URL is set
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?canceled=true`,
      metadata: {
        userId: userId, // Pass user ID to Stripe metadata for webhook processing
        badgeOption: option, // Pass the selected option
      },
    });

    // Return the session ID (or session.url if you prefer redirecting client-side)
    return Response.json({ sessionId: session.id, checkoutUrl: session.url }); // Include session.url if needed for client redirect
  } catch (error: any) {
    console.error('Stripe checkout session creation error:', error);
    return Response.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
