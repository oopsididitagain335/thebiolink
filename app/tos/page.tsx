// app/tos/page.tsx
import Link from 'next/link';

export default function TermsOfService() {
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
                href="/discovery"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Discover
              </Link>
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
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 p-6 md:p-8">
            <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
            <p className="text-sm text-gray-500 mb-8">Last updated: June 2024</p>

            <div className="prose prose-invert prose-gray max-w-none space-y-6">
              <section>
                <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance</h2>
                <p>
                  By creating an account or using BioLink (<code className="text-indigo-300">thebiolink.lol</code>), you agree to these Terms of Service. If you do not agree, do not use the service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">2. Account Registration</h2>
                <p>
                  To use BioLink, you must provide a valid email address. You are responsible for maintaining the confidentiality of your account credentials.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">3. Data Collection</h2>
                <p>
                  We collect the following information:
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li><strong>Email address</strong> — used for account identification and communication</li>
                  <li><strong>IP address</strong> — stored in hashed form for security and abuse prevention</li>
                  <li><strong>Password</strong> — stored securely using bcrypt hashing (never in plain text)</li>
                </ul>
                <p className="mt-3">
                  We do not sell your data. All data is used solely to operate and secure the BioLink platform.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">4. Profile Content & Moderation</h2>
                <p>
                  You may customize your BioLink profile with a username, name, bio, avatar, background, and links. However:
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>All content must comply with our community guidelines</li>
                  <li>We reserve the right to <strong>edit, hide, or delete</strong> any profile or content at our sole discretion</li>
                  <li>We may <strong>ban or suspend accounts</strong> without notice for violations, suspicious activity, or policy breaches</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">5. Prohibited Use</h2>
                <p>You may not use BioLink to:</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Promote hate, violence, harassment, or illegal activity</li>
                  <li>Impersonate others or misrepresent your identity</li>
                  <li>Distribute spam, malware, or phishing content</li>
                  <li>Infringe on copyrights, trademarks, or other intellectual property</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">6. No Warranty</h2>
                <p>
                  BioLink is provided “as is.” We do not guarantee uptime, data accuracy, or protection against unauthorized access. Use at your own risk.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">7. Changes & Termination</h2>
                <p>
                  We may update these terms or discontinue the service at any time. Continued use after changes implies acceptance. We may terminate any account without notice.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">8. Contact</h2>
                <p>
                  For questions or concerns, join our{' '}
                  <Link
                    href="https://discord.gg/29yDsapcXh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 underline"
                  >
                    Discord server
                  </Link>
                  .
                </p>
              </section>
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
