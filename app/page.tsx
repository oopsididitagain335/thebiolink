import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl text-white font-bold">B</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">The BioLink</h1>
          <p className="text-gray-600 mb-8">
            Create your perfect link-in-bio page in seconds
          </p>
          
          <div className="space-y-4">
            <Link 
              href="/dashboard" 
              className="block w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Create Your BioLink
            </Link>
            
            <p className="text-sm text-gray-500">
              Already have one? Visit <span className="font-mono">yourname.thebiolink.lol</span>
            </p>
          </div>
        </div>
        
        <div className="bg-gray-50 px-8 py-6 text-center border-t">
          <p className="text-gray-600 text-sm">
            Free, open-source, and privacy-focused
          </p>
        </div>
      </div>
    </div>
  );
}
