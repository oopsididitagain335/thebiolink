// app/api/checkout/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe"; // see below
import { getUserByEmail, updateUserPlan } from "@/lib/db"; // your DB functions

const PRICE_IDS = {
  basic: process.env.STRIPE_PRICE_BASIC!,
  premium: process.env.STRIPE_PRICE_PREMIUM!,
  fwiend: process.env.STRIPE_PRICE_FWIEND!,
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return new Response("Unauthorized", { status: 401 });
  }

  const formData = await req.formData();
  const plan = formData.get("plan") as string;

  if (!["basic", "premium", "fwiend"].includes(plan)) {
    return new Response("Invalid plan", { status: 400 });
  }

  const user = await getUserByEmail(session.user.email);
  if (!user) return new Response("User not found", { status: 404 });

  const priceId = PRICE_IDS[plan];
  if (!priceId) return new Response("Plan not configured", { status: 500 });

  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    customer_email: session.user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${process.env.NEXTAUTH_URL}/pricing?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
    metadata: {
      userId: user._id.toString(),
      plan,
    },
  });

  return new Response(JSON.stringify({ url: checkoutSession.url }), {
    status: 303,
    headers: { Location: checkoutSession.url! },
  });
}
