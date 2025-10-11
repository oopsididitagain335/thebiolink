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

        if (!email) {
          // Discord didn't return email (shouldn't happen with 'email' scope)
          return null;
        }

        let dbUser = await db.collection('users').findOne({ email });

        if (!dbUser) {
          // Generate a strong random password (for future email login)
          const tempPassword = Array.from({ length: 32 }, () =>
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()'.charAt(
              Math.floor(Math.random() * 70)
            )
          ).join('');

          const passwordHash = await hash(tempPassword, 12);

          // Sanitize username: use global_name if available, else discord username
          const displayName = profile.global_name || profile.username || 'User';
          let username = displayName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
          if (username.length < 3) username = `user_${Date.now().toString(36)}`;

          // Ensure username is unique
          let baseUsername = username;
          let counter = 1;
          while (await db.collection('users').findOne({ username })) {
            username = `${baseUsername}_${counter}`;
            counter++;
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

        token.id = dbUser._id.toString();
        token.username = dbUser.username;
        token.name = dbUser.name;
        token.email = dbUser.email;
        token.picture = dbUser.avatar;
        token.provider = 'discord';
      } else if (user) {
        // Credentials login
        token.id = user.id;
        token.username = user.username;
        token.name = user.name ?? null;
        token.email = user.email ?? null;
        token.picture = user.image ?? null;
        token.provider = 'credentials';
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.name = token.name ?? null;
        session.user.email = token.email ?? null;
        session.user.image = token.picture ?? null;
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

// Optional: Keep your custom cookie-based session if needed elsewhere
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
