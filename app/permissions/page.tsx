'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PermissionsPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowModal(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleAccept = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-indigo-900/20 flex items-center justify-center p-4">
      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-2xl max-w-md w-full p-6 md:p-8 shadow-2xl">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-indigo-900/40 flex items-center justify-center mx-auto mb-5">
                <svg
                  className="w-8 h-8 text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a2 2 0 00-2-2H6a2 2 0 00-2 2v4h16z"
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-white mb-4">Discord Permissions</h2>

              <p className="text-gray-300 mb-5">
                To personalize your BioLink profile, this app requests:
              </p>

              <div className="bg-gray-900/60 rounded-lg p-4 text-left mb-6 text-sm space-y-3">
                <div className="flex items-start">
                  <span className="text-indigo-400 mr-2 mt-0.5">•</span>
                  <span className="text-gray-200">
                    Your <strong>display name</strong> and <strong>profile picture</strong>
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="text-indigo-400 mr-2 mt-0.5">•</span>
                  <span className="text-gray-200">
                    Your <strong>online status</strong> (online, idle, etc.)
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="text-indigo-400 mr-2 mt-0.5">•</span>
                  <span className="text-gray-200">
                    Your <strong>country</strong> and <strong>language preferences</strong>
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="text-indigo-400 mr-2 mt-0.5">•</span>
                  <span className="text-gray-200">
                    Display names of your <strong>linked accounts</strong> (e.g., Xbox, Steam)
                  </span>
                </div>
              </div>

              <p className="text-gray-500 text-xs mb-6">
                🔒 We never post messages, access DMs, or view your servers.  
                You can revoke access anytime in Discord settings.
              </p>

              <button
                onClick={handleAccept}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
              >
                OK, Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
