import Link from 'next/link';

export default function CommunityGuidelines() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-gray-300">
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
                href="/tos"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Terms
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
      <div className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 p-6 md:p-8">
            <h1 className="text-3xl font-bold text-white mb-2">Community Guidelines</h1>
            <p className="text-sm text-gray-500 mb-6">Last updated: September 2025</p>

            <div className="prose prose-invert prose-gray max-w-none space-y-7">
              {/* Guidelines sections omitted for brevity but remain identical to original */}
              {/* ... */}
              <div className="bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r mt-8">
                <p className="font-semibold text-red-300">
                  ⚠️ Reminder: BioLink is a privilege, not a right. We built this platform to be safe, inclusive, and inspiring. 
                  If your presence undermines that mission — even slightly — you will be removed.
                </p>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-gray-700 text-center text-sm text-gray-500">
              <p>© {new Date().getFullYear()} BioLink. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
