// app/community-guidelines/page.tsx
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
                href="/discovery"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Discover
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
              <section>
                <h2 className="text-xl font-semibold text-white mb-3">Our Zero-Tolerance Policy</h2>
                <p>
                  BioLink exists to empower creators, artists, streamers, and professionals to share their work — not to spread hate, fear, or harm. 
                </p>
                <p className="mt-3 font-medium text-red-400">
                  We enforce a <strong>zero-tolerance policy</strong>. Even a <em>hint</em> of hate speech, discrimination, or targeted harassment is grounds for immediate account suspension or permanent ban — without warning.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">1. What Is Absolutely Prohibited</h2>
                <p>You may <strong>not</strong> use your BioLink profile to promote, reference, imply, or link to any of the following:</p>
                <ul className="list-disc pl-5 space-y-2 mt-3">
                  <li>
                    <strong>Hate speech</strong> — including but not limited to content that attacks, dehumanizes, or incites violence against individuals or groups based on race, ethnicity, religion, gender, sexual orientation, disability, or nationality.
                  </li>
                  <li>
                    <strong>Harassment or bullying</strong> — including doxxing, threats, slurs, or coordinated abuse.
                  </li>
                  <li>
                    <strong>Violent or extremist content</strong> — including terrorist propaganda, militia recruitment, or glorification of mass violence.
                  </li>
                  <li>
                    <strong>Sexually explicit or nude content</strong> — including in avatars, backgrounds, or linked pages.
                  </li>
                  <li>
                    <strong>Illegal activity</strong> — including drug sales, weapons trafficking, or fraud.
                  </li>
                  <li>
                    <strong>Misinformation that causes real-world harm</strong> — such as false medical claims or election interference.
                  </li>
                  <li>
                    <strong>Impersonation</strong> — pretending to be another person, brand, or official entity without authorization.
                  </li>
                  <li>
                    <strong>Spam, phishing, or malware</strong> — including deceptive links or fake giveaways.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">2. Subtle Violations Are Still Violations</h2>
                <p>We do not require explicit slurs to take action. The following are also prohibited:</p>
                <ul className="list-disc pl-5 space-y-2 mt-3">
                  <li>Use of coded language, dog whistles, or symbols associated with hate groups (e.g., certain numbers, emojis, or historical references)</li>
                  <li>“Jokes” that demean protected groups</li>
                  <li>Profiles that link to platforms or communities known for hate, even if the BioLink itself appears neutral</li>
                  <li>Avatars, banners, or bios that use offensive stereotypes or caricatures</li>
                  <li>Usernames that contain slurs, even partially or misspelled</li>
                </ul>
                <p className="mt-3">
                  <strong>Intent does not override impact.</strong> If your content makes others feel unsafe or unwelcome, it violates these guidelines.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">3. Our Enforcement Authority</h2>
                <p>BioLink reserves the right to:</p>
                <ul className="list-disc pl-5 space-y-2 mt-3">
                  <li><strong>Remove or edit</strong> any part of your profile (bio, links, avatar, username) at any time</li>
                  <li><strong>Suspend or permanently ban</strong> your account without notice</li>
                  <li><strong>Block IP addresses</strong> associated with abusive behavior</li>
                  <li><strong>Report illegal content</strong> to law enforcement when required by law</li>
                </ul>
                <p className="mt-3">
                  Enforcement decisions are final. We are not obligated to provide explanations, though we may do so at our discretion.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">4. What We Encourage</h2>
                <p>BioLink thrives when users:</p>
                <ul className="list-disc pl-5 space-y-2 mt-3">
                  <li>Showcase their creativity, work, or passion</li>
                  <li>Link to positive, constructive, and legal content</li>
                  <li>Use inclusive and respectful language</li>
                  <li>Report violations they encounter via Discord</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">5. Reporting Violations</h2>
                <p>
                  If you see a profile that violates these guidelines, report it immediately in our{' '}
                  <Link
                    href="https://discord.gg/29yDsapcXh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 underline"
                  >
                    Discord server
                  </Link>
                  . Include the full BioLink URL (e.g., <code className="text-indigo-300">thebiolink.lol/username</code>).
                </p>
                <p className="mt-2">
                  False or malicious reports may result in your own account being reviewed.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">6. Changes to These Guidelines</h2>
                <p>
                  We may update these guidelines at any time. Continued use of BioLink constitutes acceptance of the current version.
                </p>
              </section>

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
