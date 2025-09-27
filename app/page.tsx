import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-12">
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-bold">thebiolink.lol</span>
          <span className="text-sm text-gray-400">Username</span>
        </div>
        <div className="space-x-4">
          <a href="#" className="text-gray-400 hover:text-white">Help Center</a>
          <a href="#" className="text-gray-400 hover:text-white">Discord</a>
          <a href="#" className="text-gray-400 hover:text-white">Pricing</a>
          <a href="#" className="text-gray-400 hover:text-white">Login</a>
          <Link
            href="/auth/signup"
            className="bg-purple-600 px-4 py-2 rounded-full hover:bg-purple-700 transition-colors"
          >
            Sign Up Free
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="text-center max-w-6xl mx-auto">
        <h1 className="text-5xl font-extrabold mb-4">Everything you want, right here.</h1>
        <p className="text-xl text-gray-300 mb-8">
          thebiolink.lol is your go-to for modern, feature-rich biolinks and fast, secure file hosting. Everything you need — right here.
        </p>
        <div className="flex justify-center gap-4 mb-12">
          <Link
            href="/auth/signup"
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all"
          >
            Create Your BioLink
          </Link>
          <Link
            href="/auth/login"
            className="bg-gray-800 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-700 transition-colors"
          >
            Sign In
          </Link>
        </div>

        {/* Phone Mockups */}
        <div className="flex justify-center gap-8">
          {/* Phone 1 */}
          <div className="bg-gray-800 rounded-2xl p-4 shadow-lg w-64 h-[450px] flex flex-col items-center justify-center relative">
            <div className="bg-purple-900/50 rounded-lg p-4 w-full h-full">
              <p className="text-sm text-gray-400">Welcome back, @thebiolink.lol</p>
              <div className="space-y-2 mt-4">
                <p className="text-sm text-gray-300">Account Overview</p>
                <p className="text-sm text-gray-300">Username</p>
                <p className="text-sm text-gray-300">Alias</p>
                <p className="text-sm text-gray-300">Views</p>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-400">Profile Views in last 12 hours</p>
                <div className="h-20 bg-purple-500/20 rounded flex items-center justify-center">
                  <span className="text-gray-500">Graph Placeholder</span>
                </div>
              </div>
            </div>
            {/* Phone bezel effect */}
            <div className="absolute inset-0 border-4 border-gray-700 rounded-2xl"></div>
          </div>

          {/* Phone 2 */}
          <div className="bg-gray-800 rounded-2xl p-4 shadow-lg w-64 h-[450px] flex flex-col items-center justify-center relative">
            <div className="bg-purple-900/50 rounded-lg p-4 w-full h-full">
              <p className="text-sm text-gray-400">Azrez</p>
              <div className="space-y-2 mt-4">
                <p className="text-sm text-gray-300">My Portfolio</p>
                <p className="text-sm text-gray-300">My Store</p>
                <p className="text-sm text-gray-300">My Discord</p>
              </div>
              <div className="mt-4 flex justify-center">
                <span className="text-gray-500">Image Placeholder</span>
              </div>
            </div>
            {/* Phone bezel effect */}
            <div className="absolute inset-0 border-4 border-gray-700 rounded-2xl"></div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-gray-500 mt-12 text-sm">
        <p>Copyright © 2025 thebiolink.lol</p>
      </div>
    </div>
  );
}
