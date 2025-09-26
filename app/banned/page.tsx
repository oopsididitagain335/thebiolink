// app/banned/page.tsx
export default function BannedPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        <div className="w-24 h-24 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">Account Suspended</h1>
        <p className="text-gray-400 mb-6">
          Your account has been suspended due to violation of our terms of service.
        </p>
        
        <div className="bg-gray-900/50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-300">
            If you believe this is an error, please contact support.
          </p>
        </div>
        
        <a 
          href="mailto:support@thebiolink.lol" 
          className="text-indigo-400 hover:text-indigo-300 font-medium"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
}
