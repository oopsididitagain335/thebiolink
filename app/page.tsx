import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-white px-8 py-6 text-center border-b">
          <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-white font-bold">B</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">The BioLink</h1>
          <p className="text-gray-600 text-sm">
            Create your perfect link-in-bio page in seconds
          </p>
        </div>
        
        {/* Main Content */}
        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <Link 
              href="/auth/signup" 
              className="block w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:opacity-90 transition-opacity text-center"
            >
              Create Your BioLink
            </Link>
            
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-2">
                Already have an account?
              </p>
              <Link 
                href="/auth/login" 
                className="text-indigo-600 font-medium hover:underline"
              >
                Sign in to your dashboard
              </Link>
            </div>
          </div>
          
          {/* Footer */}
          <div className="pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-500 text-xs">
              Free, open-source, and privacy-focused
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
