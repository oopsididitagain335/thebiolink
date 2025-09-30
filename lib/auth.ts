// lib/auth.ts
import { getServerSession } from 'next-auth';
import { NextAuthOptions } from 'next-auth';

// Minimal auth config (no real providers needed for session checking)
const authOptions: NextAuthOptions = {
  providers: [],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: { signIn: '/auth/login' },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.email = user.email;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email as string;
      }
      return session;
    },
  },
};

// Re-export for API routes and pages
export { authOptions, getServerSession };
