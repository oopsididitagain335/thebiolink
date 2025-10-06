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
              <Link href="/" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Home
              </Link>
              <Link href="/auth/login" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Login
              </Link>
              <Link href="/auth/signup" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
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
            <p className="text-sm text-gray-500 mb-8">Last updated: September 2025</p>

            <div className="prose prose-invert prose-gray max-w-none space-y-6">
              <section>
                <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
                <p>
                  By using <strong>BioLink</strong> (thebiolink.lol), you agree to these Terms of Service (“Terms”) and our Community Guidelines.
                  If you do not agree, you may not use our platform.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">2. Eligibility</h2>
                <p>
                  You must be at least 13 years old to use BioLink. If you are under the age of majority in your jurisdiction, you must have parental consent to use our services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">3. User Content</h2>
                <p>
                  You are responsible for any content you post on your BioLink profile. You must not post or link to content that is illegal, hateful, pornographic, violent, or violates intellectual property laws.
                </p>
                <p>
                  BioLink reserves the right to remove any content that violates these Terms or our Community Guidelines, without notice.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">4. Prohibited Use</h2>
                <ul className="list-disc ml-6 space-y-2">
                  <li>Do not impersonate others or create fake profiles.</li>
                  <li>Do not use BioLink for spam, scams, or malicious redirections.</li>
                  <li>Do not exploit or abuse vulnerabilities in our system.</li>
                  <li>Do not distribute malware or attempt to hack any service.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">5. Termination</h2>
                <p>
                  We may suspend or terminate your account at any time, with or without cause, and without prior notice.
                  You may delete your account at any time by contacting us on Discord or through platform settings.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">6. Disclaimer of Warranties</h2>
                <p>
                  BioLink is provided “as is” without warranty of any kind. We do not guarantee uninterrupted service, error-free performance, or permanent data storage.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">7. Limitation of Liability</h2>
                <p>
                  In no event shall BioLink, its creators, or affiliates be liable for any damages arising from your use or inability to use the service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">8. Modifications</h2>
                <p>
                  We may modify these Terms at any time. Continued use of the platform after changes constitutes acceptance of the updated Terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">9. Contact</h2>
                <p>
                  For questions or issues, please reach out on our{' '}
                  <Link
                    href="https://discord.gg/29yDsapcXh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 underline"
                  >
                    Discord server
                  </Link>.
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
