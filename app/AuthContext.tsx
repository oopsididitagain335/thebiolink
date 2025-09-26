'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  avatar: string;
  bio: string;
  isEmailVerified: boolean;
  badgeOption: string | null;
  badgePaid: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Ensure this runs only on the client
    if (typeof window === 'undefined') return;

    const fetchUser = async () => {
      try {
        const res = await fetch('/api/dashboard/data', {
          credentials: 'include', // Ensure cookies are sent with the request
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user || null);
        } else {
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    // Check for session cookie
    const token = document.cookie
      ?.split('; ')
      .find((row) => row.startsWith('biolink_session='))
      ?.split('=')[1];

    if (token) {
      fetchUser();
    } else {
      setLoading(false);
      router.push('/auth/login');
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
