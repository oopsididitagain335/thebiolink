// lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectDB } from './storage';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { compare } from 'bcryptjs';
import { getServerSession as getNextAuthServerSession } from 'next-auth';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const db = await connectDB();
        const user = await db.collection('users').findOne({ email: credentials.email });
        if (!user || !user.password) {
          return null;
        }
        const isValid = await compare(credentials.password, user.password);
        if (!isValid) {
          return null;
        }
        return {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          name: user.name || '',
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.name = token.name;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/signin', // Customize if needed
  },
};

export async function getServerSession() {
  return await getNextAuthServerSession(authOptions);
}

// Optional: Keep custom getCurrentUser if used elsewhere (e.g., for non-NextAuth paths)
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('biolink_session')?.value;
  if (!sessionCookie || !ObjectId.isValid(sessionCookie)) {
    return null;
  }
  try {
    const db = await connectDB();
    const user = await db.collection('users').findOne({
      _id: new ObjectId(sessionCookie)
    });
    if (!user) return null;
    return {
      _id: user._id.toString(),
      email: user.email,
      username: user.username,
      name: user.name || '',
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}
