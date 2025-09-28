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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 text-white p-6 overflow-hidden">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="text-center max-w-6xl mx-auto relative">
        {/* Animated Orb Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ top: '20%', left: '10%' }}></div>
          <div className="absolute w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-2xl animate-pulse delay-1000" style={{ bottom: '20%', right: '10%' }}></div>
        </div>

        <h1 className="text-6xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-400 drop-shadow-lg">
          Unleash Your Digital Hub
        </h1>
        <p className="text-xl text-gray-200 mb-10 max-w-2xl mx-auto">
          thebiolink.lol transforms your online presence with cutting-edge biolinks and secure file hosting. Your all-in-one solution starts here.
        </p>
        <div className="flex justify-center gap-6 mb-16">
          <Link
            href="/auth/signup"
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-10 py-4 rounded-2xl font-semibold text-lg hover:shadow-2xl hover:from-indigo-600 hover:to-purple-700 transition-all transform hover:scale-105"
          >
            Create Your BioLink
          </Link>
          <Link
            href="/auth/login"
            className="bg-gray-800 text-white px-10 py-4 rounded-2xl font-semibold text-lg hover:bg-gray-700 transition-colors transform hover:scale-105"
          >
            Sign In
          </Link>
        </div>

        {/* Unique Design Element */}
        <div className="relative w-full max-w-4xl mx-auto mb-16">
          <div className="absolute w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full opacity-50 animate-spin-slow" style={{ top: '-10%', left: '10%' }}></div>
          <div className="absolute w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full opacity-30 animate-spin-slow delay-2000" style={{ bottom: '-10%', right: '10%' }}></div>
          <div className="relative z-10 bg-gray-800/50 backdrop-blur-md p-8 rounded-3xl border-2 border-indigo-500/20 shadow-xl">
            <h2 className="text-3xl font-bold text-indigo-300 mb-4">What Makes Us Unique</h2>
            <ul className="text-gray-300 space-y-4 text-left">
              <li className="flex items-center gap-3"><span className="text-indigo-400">✨</span> Fully customizable biolink pages</li>
              <li className="flex items-center gap-3"><span className="text-purple-400">🔒</span> End-to-end encrypted file hosting</li>
              <li className="flex items-center gap-3"><span className="text-indigo-400">⚡</span> Lightning-fast performance</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Help Center Section */}
      <div id="help-center" className="text-center max-w-4xl mx-auto mt-16 p-6 bg-gray-800/80 rounded-2xl border-2 border-indigo-500/20 backdrop-blur-md">
        <h2 className="text-3xl font-bold mb-4 text-indigo-300">Help Center</h2>
        <p className="text-gray-300 mb-4">Welcome to the thebiolink.lol Help Center! We're here to assist you with any questions or issues you might encounter while using our platform.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="p-4 bg-gray-700/50 rounded-lg backdrop-blur-sm">
            <h3 className="text-xl font-semibold mb-2 text-indigo-400">Frequently Asked Questions</h3>
            <ul className="text-gray-300 space-y-2">
              <li>How do I create a BioLink? - Visit the signup page and follow the setup guide.</li>
              <li>Can I customize my BioLink? - Yes, go to the customize section in your dashboard.</li>
              <li>What is the pricing? - Check back soon for pricing details!</li>
            </ul>
          </div>
          <div className="p-4 bg-gray-700/50 rounded-lg backdrop-blur-sm">
            <h3 className="text-xl font-semibold mb-2 text-purple-400">Support Options</h3>
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
        <p>Copyright © 2025 thebiolink.lol</p>
      </div>
    </div>
  );
}

// Custom CSS for animations
<style jsx>{`
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .animate-spin-slow {
    animation: spin-slow 20s linear infinite;
  }
`}</style>
