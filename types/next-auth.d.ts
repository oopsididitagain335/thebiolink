// types/next-auth.d.ts
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    id: string;
    username: string;
    name?: string | null;
    email?: string | null;
    image?: string | null; // ✅ Add this
  }

  interface Session {
    user: {
      id: string;
      username: string;
      name?: string | null;
      email?: string | null;
      image?: string | null; // ✅ Add this
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    name?: string | null;
    email?: string | null;
    picture?: string | null; // ✅ Add this (NextAuth uses 'picture' in token)
  }
}
