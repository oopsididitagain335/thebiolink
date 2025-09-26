// app/api/stripe/create-checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // Adjust path if necessary
import { getUserById, getSubscriptionByUserId, createOrUpdateSubscription } from '@/lib/storage'; // Import necessary functions
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId } = await req.json();

    // Optional: Fetch user data to get email for Stripe
    const user = await getUserById(session.user.id);

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    // Optional: Check if user already has an active subscription
    // const existingSubscription = await getSubscriptionByUserId(session.user.id);
    // if (existingSubscription && existingSubscription.status === 'active') {
    //   return NextResponse.json({ error: 'User already has an active subscription' }, { status: 400 });
    // }

    // Create a Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId, // Use the dynamic price ID passed from the frontend
          quantity: 1,
        },
      ],
      mode: 'subscription', // Ensure it's a subscription
      success_url: `${req.nextUrl.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`, // Redirect after success
      cancel_url: `${req.nextUrl.origin}/dashboard`, // Redirect if cancelled
      customer_email: user?.email, // Pre-fill email if available
      metadata: {
        userId: session.user.id, // Pass user ID for webhook handling (if you add webhooks later)
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
