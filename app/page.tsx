import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-900 to-black flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border-4 border-gray-700">
        {/* Phone screen effect with subtle glassmorphism */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-sm"></div>
        
        {/* Content container */}
        <div className="relative z-10 p-6 flex flex-col items-center min-h-[600px]">
          {/* Profile picture placeholder */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center mb-6 mt-8">
            <span className="text-4xl font-bold text-white">B</span>
          </div>

          {/* Username and bio */}
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">@TheBioLink</h1>
          <p className="text-lg text-gray-300 text-center mb-6 max-w-xs">
            Connect all your socials in one place. Free, fast, and privacy-first.
          </p>

          {/* Action buttons */}
          <div className="flex flex-col gap-4 w-full max-w-xs mb-8">
            <Link
              href="/auth/signup"
              className="btn-primary bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-full font-semibold text-lg hover:shadow-lg hover:from-indigo-600 hover:to-purple-700 transition-all text-center"
            >
              Create Your BioLink
            </Link>
            <Link
              href="/auth/login"
              className="bg-gray-700 text-white px-6 py-3 rounded-full font-semibold text-lg hover:bg-gray-600 transition-colors text-center"
            >
              Sign In
            </Link>
          </div>

          {/* Social link examples */}
          <div className="w-full max-w-xs space-y-4 mb-8">
            <a
              href="#"
              className="flex items-center justify-center gap-2 bg-gray-900/50 backdrop-blur-sm text-white px-4 py-2 rounded-full hover:bg-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Follow on X
            </a>
            <a
              href="#"
              className="flex items-center justify-center gap-2 bg-gray-900/50 backdrop-blur-sm text-white px-4 py-2 rounded-full hover:bg-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              Instagram
            </a>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
            <div className="bg-gray-900/50 backdrop-blur-sm p-4 rounded-xl text-center">
              <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Lightning Fast</h3>
              <p className="text-sm text-gray-400">Built with Next.js</p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm p-4 rounded-xl text-center">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Secure & Private</h3>
              <p className="text-sm text-gray-400">Your data stays yours</p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm p-4 rounded-xl text-center">
              <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Free Forever</h3>
              <p className="text-sm text-gray-400">No hidden fees</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-center text-gray-500 py-4 text-sm bg-gray-900/50">
          <p>
            Already have a BioLink? Visit <span className="font-mono text-indigo-400">thebiolink.lol/youruser</span>
          </p>
        </div>
      </div>
    </div>
  );
}
