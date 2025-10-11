// lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import DiscordProvider from 'next-auth/providers/discord';
import { connectDB } from './storage';
import { ObjectId } from 'mongodb';
import { compare, hash } from 'bcryptjs';
import { getServerSession as getNextAuthServerSession } from 'next-auth';
import { cookies } from 'next/headers';

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

        if (!user || !user.passwordHash) return null;

        const isValid = await compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          name: user.name ?? null,
          image: user.avatar ?? null,
        };
      },
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'identify email',
        },
      },
    }),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (account?.provider === 'discord' && profile) {
        const db = await connectDB();
        const email = profile.email as string;

        if (!email) return null; // Should not happen with 'email' scope

        let dbUser = await db.collection('users').findOne({ email });

        if (!dbUser) {
          // Generate random password so user can log in via email later
          const randomPassword = Array.from({ length: 32 }, () =>
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()'.charAt(
              Math.floor(Math.random() * 70)
            )
          ).join('');
          const passwordHash = await hash(randomPassword, 12);

          // Create username from Discord name
          const displayName = profile.global_name || profile.username || 'User';
          let username = displayName
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '');
          if (username.length < 3) username = `user_${Date.now().toString(36).slice(-6)}`;

          // Ensure unique username
          let base = username;
          let counter = 1;
          while (await db.collection('users').findOne({ username })) {
            username = `${base}_${counter++}`;
          }

          const newUser = {
            _id: new ObjectId(),
            email,
            username,
            name: displayName,
            avatar: profile.image || '',
            bio: '',
            passwordHash,
            badges: [],
            isEmailVerified: true,
            isBanned: false,
            createdAt: new Date(),
            profileViews: 0,
            plan: 'free',
            layoutStructure: [
              { id: 'bio', type: 'bio' },
              { id: 'spacer-1', type: 'spacer', height: 20 },
              { id: 'links', type: 'links' }
            ],
          };

          await db.collection('users').insertOne(newUser);
          dbUser = newUser;
        }

        return {
          id: dbUser._id.toString(),
          username: dbUser.username,
          name: dbUser.name,
          email: dbUser.email,
          picture: dbUser.avatar,
        };
      }

      if (user) {
        return {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          picture: user.image,
        };
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: '/auth/signin',
  },
};

export async function getServerSession() {
  return await getNextAuthServerSession(authOptions);
}

// Keep your custom cookie utility (optional)
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
      avatar: user.avatar ?? null,
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}
