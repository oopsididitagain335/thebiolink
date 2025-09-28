import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 bg-gray-900/80 backdrop-blur-md z-50 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-white">BioLink</span>
            </div>
            <div className="flex items-center space-x-4">
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
      <div className="min-h-screen flex items-center justify-center pt-20 px-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 mb-6">
              <span className="text-2xl font-bold text-white">B</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight">
              The BioLink
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              Create your perfect link-in-bio page in seconds. Free, open-source, and privacy-focused.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl"
              >
                Create Your BioLink
              </Link>
              <Link
                href="/auth/login"
                className="bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-600 transition-all shadow-lg hover:shadow-xl"
              >
                Sign In
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
            <div className="card p-6 text-center bg-gray-800/50 rounded-xl border border-gray-700/50 shadow-lg hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Lightning Fast</h3>
              <p className="text-gray-400 text-sm">Built with Next.js for optimal performance</p>
            </div>
            <div className="card p-6 text-center bg-gray-800/50 rounded-xl border border-gray-700/50 shadow-lg hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Secure & Private</h3>
              <p className="text-gray-400 text-sm">Your data is yours alone</p>
            </div>
            <div className="card p-6 text-center bg-gray-800/50 rounded-xl border border-gray-700/50 shadow-lg hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-pink-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Free Forever</h3>
              <p className="text-gray-400 text-sm">No hidden fees or premium features</p>
            </div>
          </div>

          <div className="text-center text-gray-500">
            <p className="text-sm">
              Already have a BioLink? Visit{' '}
              <Link href="/youruser" className="font-mono text-indigo-400 hover:text-indigo-300 transition-colors">
                thebiolink.lol/youruser
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
