'use client'; // Marks the Header as a Client Component

import Link from 'next/link';

function Header() {
  return (
    <div className="flex justify-between items-center py-8 px-6 mb-24 border-b border-indigo-800 bg-gray-900/50 backdrop-blur-sm">
      <div className="flex items-center space-x-6">
        <span className="text-4xl font-bold text-indigo-400">thebiolink.lol</span>
      </div>
      <div className="space-x-8">
        <a href="#help-center" className="text-gray-300 hover:text-white text-xl font-medium transition-colors">Help Center</a>
        <a href="https://discord.gg/29yDsapcXh" className="text-gray-300 hover:text-white text-xl font-medium transition-colors">Discord</a>
        <a href="#" onClick={(e) => { e.preventDefault(); alert('Coming Soon'); }} className="text-gray-300 hover:text-white text-xl font-medium transition-colors">Pricing</a>
        <Link href="/auth/login" className="text-gray-300 hover:text-white text-xl font-medium transition-colors">Login</a>
        <Link
          href="/auth/signup"
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-full text-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
        >
          Sign Up Free
        </Link>
      </div>
    </div>
  );
}

export default function Page() {
  const currentDateTime = new Date().toLocaleString('en-GB', { timeZone: 'Europe/London', hour12: true, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-black text-white p-6 relative overflow-hidden">
      {/* Background Layers */}
      <div className="absolute top-0 left-0 w-full h-full opacity-15">
        <div className="absolute w-80 h-80 bg-purple-500/50 rounded-full -top-40 -left-40 blur-md"></div>
        <div className="absolute w-96 h-96 bg-indigo-600/50 rounded-lg -bottom-60 right-20 blur-md transform -rotate-12"></div>
        <div className="absolute w-60 h-60 bg-purple-700/30 rounded-full top-1/2 left-1/4 transform -translate-y-1/2 blur-sm"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-7xl mx-auto">
        <div className="bg-gray-800/70 p-12 rounded-3xl shadow-2xl border-2 border-indigo-800/50 mb-24">
          <h1 className="text-7xl font-extrabold mb-8 text-indigo-300 drop-shadow-lg">Everything you want, right here.</h1>
          <p className="text-2xl text-gray-200 mb-12 leading-relaxed max-w-4xl mx-auto">
            thebiolink.lol crafts your perfect link-in-bio experience with modern, feature-rich biolinks and secure file hosting. All you need, in one place.
          </p>
          <div className="flex justify-center gap-8">
            <Link
              href="/auth/signup"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-12 py-6 rounded-2xl font-bold text-2xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Create Your BioLink
            </Link>
            <Link
              href="/auth/login"
              className="bg-gray-700 text-white px-12 py-6 rounded-2xl font-bold text-2xl hover:bg-gray-600 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-1"
            >
              Sign In
            </Link>
          </div>
          <p className="text-gray-400 mt-8 text-lg">Current Time: {currentDateTime} BST</p>
        </div>
      </div>

      {/* Help Center Section */}
      <div id="help-center" className="relative z-10 text-center max-w-6xl mx-auto mt-24 p-10 bg-gray-800/70 rounded-3xl shadow-2xl border-2 border-indigo-800/50">
        <h2 className="text-5xl font-bold mb-8 text-indigo-300 drop-shadow-md">Help Center</h2>
        <p className="text-gray-200 mb-8 text-xl max-w-5xl mx-auto">Welcome to the thebiolink.lol Help Center! Our dedicated team is here to support you with any questions or challenges you face while using our platform.</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-8">
          <div className="p-8 bg-gray-700/60 rounded-2xl shadow-inner">
            <h3 className="text-3xl font-semibold mb-6 text-indigo-400">Frequently Asked Questions</h3>
            <ul className="text-gray-200 space-y-4 text-lg">
              <li className="flex items-start"><span className="font-medium text-indigo-300 w-1/4">How do I create a BioLink?</span> Visit the signup page and follow the setup guide.</li>
              <li className="flex items-start"><span className="font-medium text-indigo-300 w-1/4">Can I customize my BioLink?</span> Yes, go to the customize section in your dashboard.</li>
              <li className="flex items-start"><span className="font-medium text-indigo-300 w-1/4">What is the pricing?</span> Check back soon for pricing details!</li>
            </ul>
          </div>
          <div className="p-8 bg-gray-700/60 rounded-2xl shadow-inner">
            <h3 className="text-3xl font-semibold mb-6 text-indigo-400">Support Options</h3>
            <ul className="text-gray-200 space-y-4 text-lg">
              <li className="flex items-start"><span className="font-medium text-indigo-300 w-1/4">Community Support</span> <a href="https://discord.gg/29yDsapcXh" className="text-indigo-400 hover:underline">Join our Discord</a></li>
              <li className="flex items-start"><span className="font-medium text-indigo-300 w-1/4">Direct Assistance</span> Email us at support@thebiolink.lol.</li>
              <li className="flex items-start"><span className="font-medium text-indigo-300 w-1/4">Status Updates</span> Check status at status.thebiolink.lol.</li>
            </ul>
          </div>
        </div>
        <p className="text-gray-200 mt-8 text-xl max-w-4xl mx-auto">Our support team is available 24/7. For immediate help, connect with us on Discord.</p>
        <a href="#" className="text-indigo-400 hover:underline mt-8 inline-block text-xl font-medium">Contact Us</a>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center text-gray-500 mt-24 text-xl">
        <p>Copyright © 2024 thebiolink.lol</p>
      </div>
    </div>
  );
}
