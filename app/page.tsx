'use client'; // Marks the Header as a Client Component

import Link from 'next/link';

function Header() {
  return (
    <div className="flex justify-between items-center mb-12">
      <div className="flex items-center space-x-2">
        <span className="text-2xl font-bold">thebiolink.lol</span>
      </div>
      <div className="space-x-4">
        <a href="#help-center" className="text-gray-400 hover:text-white">Help Center</a>
        <a href="https://discord.gg/29yDsapcXh" className="text-gray-400 hover:text-white">Discord</a>
        <a href="#" onClick={(e) => { e.preventDefault(); alert('Coming Soon'); }} className="text-gray-400 hover:text-white">Pricing</a>
        <Link href="/auth/login" className="text-gray-400 hover:text-white">Login</Link>
        <Link
          href="/auth/signup"
          className="bg-purple-600 px-4 py-2 rounded-full hover:bg-purple-700 transition-colors"
        >
          Sign Up Free
        </Link>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-900 to-black text-white p-6">
      {/* Header */}
      <Header />

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
          <div className="bg-gray-800 rounded-xl p-4 shadow-2xl w-56 h-[600px] flex flex-col items-center justify-center relative transform hover:scale-105 transition-transform duration-300">
            <div className="bg-black rounded-[40px] p-4 w-full h-full border-[6px] border-gray-700 overflow-hidden">
              <div className="bg-purple-900/50 rounded-[30px] p-6 w-full h-full">
                <p className="text-sm text-gray-400">Welcome back, @thebiolink.lol</p>
                <div className="space-y-2 mt-6">
                  <p className="text-sm text-gray-300">Account Overview</p>
                  <p className="text-sm text-gray-300">Username</p>
                  <p className="text-sm text-gray-300">Alias</p>
                  <p className="text-sm text-gray-300">Views</p>
                </div>
                <div className="mt-6">
                  <p className="text-sm text-gray-400">Profile Views in last 12 hours</p>
                  <div className="h-24 bg-purple-500/20 rounded flex items-center justify-center">
                    <span className="text-gray-500">Graph Placeholder</span>
                  </div>
                </div>
              </div>
              {/* Phone notch */}
              <div className="absolute top-2 left-1/2 w-20 h-6 bg-gray-700 rounded-b-2xl transform -translate-x-1/2"></div>
              {/* Camera and speaker */}
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
                <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
              </div>
              {/* Phone bezel effect */}
              <div className="absolute inset-0 border-[3px] border-gray-600 rounded-[40px]"></div>
            </div>
          </div>

          {/* Phone 2 */}
          <div className="bg-gray-800 rounded-xl p-4 shadow-2xl w-56 h-[600px] flex flex-col items-center justify-center relative transform hover:scale-105 transition-transform duration-300">
            <div className="bg-black rounded-[40px] p-4 w-full h-full border-[6px] border-gray-700 overflow-hidden">
              <div className="bg-purple-900/50 rounded-[30px] p-6 w-full h-full">
                <p className="text-sm text-gray-400">Azrez</p>
                <div className="space-y-2 mt-6">
                  <p className="text-sm text-gray-300">My Portfolio</p>
                  <p className="text-sm text-gray-300">My Store</p>
                  <p className="text-sm text-gray-300">My Discord</p>
                </div>
                <div className="mt-6 flex justify-center">
                  <span className="text-gray-500">Image Placeholder</span>
                </div>
              </div>
              {/* Phone notch */}
              <div className="absolute top-2 left-1/2 w-20 h-6 bg-gray-700 rounded-b-2xl transform -translate-x-1/2"></div>
              {/* Camera and speaker */}
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
                <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
              </div>
              {/* Phone bezel effect */}
              <div className="absolute inset-0 border-[3px] border-gray-600 rounded-[40px]"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Help Center Section */}
      <div id="help-center" className="text-center max-w-4xl mx-auto mt-16 p-6 bg-gray-800 rounded-xl">
        <h2 className="text-3xl font-bold mb-4">Help Center</h2>
        <p className="text-gray-300 mb-4">Welcome to the thebiolink.lol Help Center! We're here to assist you with any questions or issues you might encounter while using our platform.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="p-4 bg-gray-700 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Frequently Asked Questions</h3>
            <ul className="text-gray-300 space-y-2">
              <li>How do I create a BioLink? - Visit the signup page and follow the setup guide.</li>
              <li>Can I customize my BioLink? - Yes, go to the customize section in your dashboard.</li>
              <li>What is the pricing? - Check back soon for pricing details!</li>
            </ul>
          </div>
          <div className="p-4 bg-gray-700 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Support Options</h3>
            <ul className="text-gray-300 space-y-2">
              <li><a href="https://discord.gg/29yDsapcXh" className="text-indigo-400 hover:underline">Join our Discord for community support</a></li>
              <li>Email us at support@thebiolink.lol for direct assistance.</li>
              <li>Check status updates at status.thebiolink.lol.</li>
            </ul>
          </div>
        </div>
        <p className="text-gray-300 mt-4">Our support team is available 24/7 to help you. If you need immediate assistance, please join our Discord server.</p>
        <a href="#" className="text-indigo-400 hover:underline mt-4 inline-block">Contact Us</a>
      </div>

      {/* Footer */}
      <div className="text-center text-gray-500 mt-12 text-sm">
        <p>Copyright © 2024 thebiolink.lol</p>
      </div>
    </div>
  );
}
