import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero Section */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 mb-6">
            <span className="text-2xl font-bold text-white">BL</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Your Links, 
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Simplified</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Create a beautiful, customizable link-in-bio page that converts. 
            Connect your audience to everything that matters in one place.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/auth/signup" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Get Started Free
            </Link>
            
            <Link 
              href="/auth/login" 
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 dark:border-gray-700">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Lightning Fast</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Optimized for performance with instant loading times and smooth user experience.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 dark:border-gray-700">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Secure & Private</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Your data stays with you. We never sell or share your information with third parties.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 dark:border-gray-700">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Free Forever</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              All core features are completely free. No hidden fees, no premium lockouts.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to get started?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Join thousands of creators who've already simplified their online presence.
            </p>
            <Link 
              href="/auth/signup"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg inline-block transition-all duration-200 transform hover:scale-105"
            >
              Create Your BioLink Now
            </Link>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center text-gray-500 dark:text-gray-400">
          <p className="text-sm">
            Have a BioLink? Visit{' '}
            <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-blue-600 dark:text-blue-400 font-mono">
              thebiolink.lol/yourusername
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
