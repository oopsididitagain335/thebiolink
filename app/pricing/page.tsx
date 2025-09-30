// app/pricing/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth"; // your NextAuth config
import Link from "next/link";

export default async function PricingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  const plans = [
    { id: "free", name: "Free", price: 0, description: "Forever free, no card needed" },
    { id: "basic", name: "Basic", price: 5, description: "Great for individuals" },
    { id: "premium", name: "Premium", price: 15, description: "Advanced features" },
    { id: "fwiend", name: "Fwiend", price: 60, description: "Support the project ❤️" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black pt-20 p-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-white text-center mb-12">Choose Your Plan</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 text-center"
            >
              <h2 className="text-2xl font-bold text-white">{plan.name}</h2>
              <p className="text-gray-400 mt-2">{plan.description}</p>
              <div className="mt-4 text-3xl font-bold text-white">
                {plan.price === 0 ? "Free" : `$${plan.price}/mo`}
              </div>
              <div className="mt-6">
                {plan.id === "free" ? (
                  <form action="/api/subscribe" method="POST">
                    <input type="hidden" name="plan" value="free" />
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-500"
                    >
                      Use Free Plan
                    </button>
                  </form>
                ) : (
                  <form action="/api/checkout" method="POST">
                    <input type="hidden" name="plan" value={plan.id} />
                    <button
                      type="submit"
                      className="w-full bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-500"
                    >
                      Subscribe
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
