// app/api/stripe/create-checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // Remove this line
// import { authOptions } from '@/lib/auth'; // Remove this line
import { getUserById, getSubscriptionByUserId, createOrUpdateSubscription } from '@/lib/storage'; // Import necessary functions
import { cookies } from 'next/headers'; // Import cookies from next/headers
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(req: NextRequest) {
  try {
    // --- Get session ID from cookies instead of NextAuth session ---
    const sessionId = (await cookies()).get('biolink_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // --- Validate session ID format (optional but good practice) ---
    // Assuming your session ID is the user ID string from MongoDB
    // You might want to verify the session ID against a sessions collection/database table
    // For now, we'll assume the cookie value *is* the user ID string.
    let userId;
    try {
      // Attempt to validate the session ID as an ObjectId string if using MongoDB
      // If session IDs are stored differently, adjust validation accordingly
      userId = sessionId; // Or validate sessionId format here if needed
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId } = await req.json();

    // Optional: Fetch user data to get email for Stripe
    const user = await getUserById(userId);

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    // Optional: Check if user already has an active subscription
    // const existingSubscription = await getSubscriptionByUserId(userId);
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
      meta {
        userId: userId, // Pass user ID for webhook handling (if you add webhooks later)
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
