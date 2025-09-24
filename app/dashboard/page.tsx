// app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers'; // ✅ Import from next/headers
import { getUserById } from '@/lib/storage';

export default async function Dashboard() {
  // ✅ Await cookies() - it's a Promise in Next.js 15
  const sessionId = (await cookies()).get('biolink_session')?.value;
  
  if (!sessionId) {
    redirect('/auth/login');
  }
  
  const user = await getUserById(sessionId);
  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Welcome, {user.name}!
          </h1>
          <p className="text-gray-600 mb-4">
            Your BioLink: <span className="font-mono text-indigo-600">
              {user.username}.thebiolink.lol
            </span>
          </p>
          
          {!user.isEmailVerified && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <p className="text-yellow-700">
                ⚠️ Please verify your email to unlock all features
              </p>
            </div>
          )}
        </div>
        
        {/* Add your dashboard content here */}
        <div className="text-center py-12 text-gray-600">
          Dashboard content coming soon...
        </div>
      </div>
    </div>
  );
}
