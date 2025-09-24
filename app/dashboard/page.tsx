// app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getUserById } from '@/lib/storage';

export default async function Dashboard() {
  const sessionId = cookies().get('biolink_session')?.value;
  if (!sessionId) redirect('/auth/login');
  
  const user = await getUserById(sessionId);
  if (!user) redirect('/auth/login');
  
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
        
        {/* Dashboard content here */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
            {/* Profile form */}
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Link Manager</h2>
            {/* Link manager */}
          </div>
        </div>
      </div>
    </div>
  );
}
