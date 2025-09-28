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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-900 to-black text-white p-6 relative overflow-hidden">
      {/* Background Layers */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20">
        <div className="absolute w-64 h-64 bg-purple-500 rounded-full -top-20 -left-20 transform rotate-12"></div>
        <div className="absolute w-80 h-80 bg-indigo-500 rounded-lg -bottom-20 right-10 transform -rotate-6"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-5xl mx-auto">
        <div className="bg-gray-800/80 p-8 rounded-xl shadow-lg border border-indigo-700">
          <h1 className="text-5xl font-extrabold mb-4 text-shadow-md">Everything you want, right here.</h1>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            thebiolink.lol is your go-to for modern, feature-rich biolinks and fast, secure file hosting. Everything you need — right here.
          </p>
          <div className="flex justify-center gap-4 mb-8">
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
        </div>
      </div>

      {/* Help Center Section */}
      <div id="help-center" className="relative z-10 text-center max-w-4xl mx-auto mt-16 p-6 bg-gray-800/80 rounded-xl shadow-lg border border-indigo-700">
        <h2 className="text-3xl font-bold mb-4">Help Center</h2>
        <p className="text-gray-300 mb-4">Welcome to the thebiolink.lol Help Center! We're here to assist you with any questions or issues you might encounter while using our platform.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="p-4 bg-gray-700/80 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Frequently Asked Questions</h3>
            <ul className="text-gray-300 space-y-2">
              <li>How do I create a BioLink? - Visit the signup page and follow the setup guide.</li>
              <li>Can I customize my BioLink? - Yes, go to the customize section in your dashboard.</li>
              <li>What is the pricing? - Check back soon for pricing details!</li>
            </ul>
          </div>
          <div className="p-4 bg-gray-700/80 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Support Options</h3>
            <ul className="text-gray-300 space-y-2">
              <li><a href="https://discord.gg/29yDsapcXh" className="text-indigo-400 hover:underline">Join our Discord for community support</a></li>
              <li>Email us at support@thebiolink.lol for direct assistance.</li>
              <li>Check status updates at thebiolink.lol/status.</li>
            </ul>
          </div>
        </div>
        <p className="text-gray-300 mt-4">Our support team is available 24/7 to help you. If you need immediate assistance, please join our Discord server.</p>
        <a href="#" className="text-indigo-400 hover:underline mt-4 inline-block">Contact Us</a>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center text-gray-500 mt-12 text-sm">
        <p>Copyright © 2024 thebiolink.lol</p>
      </div>
    </div>
  );
}
