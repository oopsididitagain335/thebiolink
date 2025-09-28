'use client'; // Marks the Header as a Client Component

import Link from 'next/link';

function Header() {
  return (
    <div className="flex justify-between items-center mb-20">
      <div className="flex items-center space-x-4">
        <span className="text-3xl font-bold">thebiolink.lol</span>
      </div>
      <div className="space-x-6">
        <a href="#help-center" className="text-gray-400 hover:text-white text-lg">Help Center</a>
        <a href="https://discord.gg/29yDsapcXh" className="text-gray-400 hover:text-white text-lg">Discord</a>
        <a href="#" onClick={(e) => { e.preventDefault(); alert('Coming Soon'); }} className="text-gray-400 hover:text-white text-lg">Pricing</a>
        <Link href="/auth/login" className="text-gray-400 hover:text-white text-lg">Login</a>
        <Link
          href="/auth/signup"
          className="bg-purple-600 px-5 py-3 rounded-full hover:bg-purple-700 transition-colors text-lg"
        >
          Sign Up Free
        </Link>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-900 to-black text-white p-8 relative overflow-hidden">
      {/* Background Layers */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20">
        <div className="absolute w-72 h-72 bg-purple-500 rounded-full -top-32 -left-32 transform rotate-12"></div>
        <div className="absolute w-96 h-96 bg-indigo-500 rounded-lg -bottom-40 right-20 transform -rotate-6"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-6xl mx-auto">
        <div className="bg-gray-800/80 p-10 rounded-2xl shadow-lg border border-indigo-700 mb-20">
          <h1 className="text-6xl font-extrabold mb-6 text-shadow-md">Everything you want, right here.</h1>
          <p className="text-2xl text-gray-300 mb-10 leading-relaxed max-w-3xl mx-auto">
            thebiolink.lol is your go-to for modern, feature-rich biolinks and fast, secure file hosting. Everything you need — right here.
          </p>
          <div className="flex justify-center gap-6">
            <Link
              href="/auth/signup"
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-10 py-5 rounded-xl font-semibold text-xl hover:shadow-xl transition-all"
            >
              Create Your BioLink
            </Link>
            <Link
              href="/auth/login"
              className="bg-gray-800 text-white px-10 py-5 rounded-xl font-semibold text-xl hover:bg-gray-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Help Center Section */}
      <div id="help-center" className="relative z-10 text-center max-w-6xl mx-auto mt-20 p-8 bg-gray-800/80 rounded-2xl shadow-lg border border-indigo-700">
        <h2 className="text-4xl font-bold mb-6">Help Center</h2>
        <p className="text-gray-300 mb-6 text-lg max-w-4xl mx-auto">Welcome to the thebiolink.lol Help Center! We're here to assist you with any questions or issues you might encounter while using our platform.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          <div className="p-6 bg-gray-700/80 rounded-xl">
            <h3 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h3>
            <ul className="text-gray-300 space-y-3 text-lg">
              <li>How do I create a BioLink? - Visit the signup page and follow the setup guide.</li>
              <li>Can I customize my BioLink? - Yes, go to the customize section in your dashboard.</li>
              <li>What is the pricing? - Check back soon for pricing details!</li>
            </ul>
          </div>
          <div className="p-6 bg-gray-700/80 rounded-xl">
            <h3 className="text-2xl font-semibold mb-4">Support Options</h3>
            <ul className="text-gray-300 space-y-3 text-lg">
              <li><a href="https://discord.gg/29yDsapcXh" className="text-indigo-400 hover:underline">Join our Discord for community support</a></li>
              <li>Email us at support@thebiolink.lol for direct assistance.</li>
              <li>Check status updates at thebiolink.lol/status.</li>
            </ul>
          </div>
        </div>
        <p className="text-gray-300 mt-6 text-lg max-w-3xl mx-auto">Our support team is available 24/7 to help you. If you need immediate assistance, please join our Discord server.</p>
        <a href="#" className="text-indigo-400 hover:underline mt-6 inline-block text-lg">Contact Us</a>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center text-gray-500 mt-20 text-lg">
        <p>Copyright © 2024 thebiolink.lol</p>
      </div>
    </div>
  );
}
