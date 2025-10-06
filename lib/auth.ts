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

        if (!user || !user.password) return null;

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          name: user.name ?? null, // ensure consistent typing
        };
      },
    }),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.name = user.name ?? null;
        token.email = user.email ?? null;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.name = token.name ?? null; // ✅ FIXED
        session.user.email = token.email ?? null;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: '/auth/signin', // your custom sign-in page
  },
};

export async function getServerSession() {
  return await getNextAuthServerSession(authOptions);
}

// Optional utility for reading user from custom cookie
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('biolink_session')?.value;

  if (!sessionCookie || !ObjectId.isValid(sessionCookie)) {
    return null;
  }

  try {
    const db = await connectDB();
    const user = await db.collection('users').findOne({
      _id: new ObjectId(sessionCookie),
    });

    if (!user) return null;

    return {
      _id: user._id.toString(),
      email: user.email,
      username: user.username,
      name: user.name ?? null,
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}
