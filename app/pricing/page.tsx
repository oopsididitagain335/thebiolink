// app/pricing/page.tsx
import Link from 'next/link';

const PLANS = [
  { id: 'free', name: 'Free', price: 0, description: 'Forever free. No card needed.' },
  { id: 'basic', name: 'Basic', price: 5, description: 'Perfect for creators & small projects.' },
  { id: 'premium', name: 'Premium', price: 15, description: 'Advanced analytics & customization.' },
  { id: 'fwiend', name: 'Fwiend', price: 60, description: 'Support the project ❤️' },
];

export default async function PricingPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const sp = (await searchParams) || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 bg-gray-900/80 backdrop-blur-md z-50 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-white">BioLink</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Home
              </Link>
              <Link
                href="/discovery"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Discovery
              </Link>
              <Link
                href="/auth/login"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Signup
              </Link>
              <Link
                href="https://discord.gg/29yDsapcXh"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Discord
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-20 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Error Banner */}
          {sp.error && (
            <div className="mb-6 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-center">
              ❌ {sp.error}
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
                  <form
                    action={plan.id === 'free' ? '/api/subscribe' : '/api/checkout'}
                    method="POST"
                  >
                    <input type="hidden" name="plan" value={plan.id} />
                    {plan.id !== 'free' && (
                      <input type="hidden" name="price" value={plan.price} />
                    )}
                    <div className="mb-3">
                      <input
                        type="email"
                        name="email"
                        placeholder="Your BioLink email"
                        required
                        className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className={`w-full py-2.5 rounded-lg font-medium transition ${
                        plan.id === 'free'
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                          : 'bg-purple-600 hover:bg-purple-500 text-white'
                      }`}
                    >
                      {plan.id === 'free'
                        ? 'Use Free Plan'
                        : `Subscribe for £${plan.price}/mo`}
                    </button>
                  </form>
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
    </div>
  );
}
