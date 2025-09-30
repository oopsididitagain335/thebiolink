// app/pricing/page.tsx
import { getServerSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

const PLANS = [
  { id: 'free', name: 'Free', price: 0, description: 'Forever free. No card needed.' },
  { id: 'basic', name: 'Basic', price: 5, description: 'Perfect for creators & small projects.' },
  { id: 'premium', name: 'Premium', price: 15, description: 'Advanced analytics & customization.' },
  { id: 'fwiend', name: 'Fwiend', price: 60, description: 'Support the project ❤️' },
];

export default async function PricingPage({ searchParams }: { searchParams?: { login?: string; error?: string } }) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    redirect('/auth/login?redirectTo=/pricing');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black pt-20 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Login Feedback Banner */}
        {searchParams?.login === 'success' && (
          <div className="mb-6 p-3 bg-green-900/30 border border-green-700 rounded-lg text-green-300 text-center">
            ✅ Logged in successfully! Choose your plan below.
          </div>
        )}
        {searchParams?.login === 'failed' && (
          <div className="mb-6 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-center">
            ❌ {searchParams.error || 'Login failed. Please try again.'}
          </div>
        )}

        <h1 className="text-4xl font-bold text-white text-center mb-12">Choose Your Plan</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 text-center"
            >
              <h2 className="text-2xl font-bold text-white">{plan.name}</h2>
              <p className="text-gray-400 mt-2 text-sm">{plan.description}</p>
              <div className="mt-4 text-3xl font-bold text-white">
                {plan.price === 0 ? 'Free' : `£${plan.price}/mo`}
              </div>
              <div className="mt-6">
                {plan.id === 'free' ? (
                  <form action="/api/subscribe" method="POST">
                    <input type="hidden" name="plan" value="free" />
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg font-medium transition"
                    >
                      Use Free Plan
                    </button>
                  </form>
                ) : (
                  <form action="/api/checkout" method="POST">
                    <input type="hidden" name="plan" value={plan.id} />
                    <input type="hidden" name="price" value={plan.price} />
                    <button
                      type="submit"
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2.5 rounded-lg font-medium transition"
                    >
                      Subscribe
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>
            Already have a BioLink? Visit{' '}
            <span className="font-mono text-indigo-400">thebiolink.lol/youruser</span>
          </p>
        </div>
      </div>
    </div>
  );
}
