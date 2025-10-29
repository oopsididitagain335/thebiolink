// lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import DiscordProvider from 'next-auth/providers/discord';
import { connectDB } from './storage';
import { ObjectId } from 'mongodb';
import { compare, hash } from 'bcryptjs';
import { getServerSession as getNextAuthServerSession } from 'next-auth';

// Extend Discord profile type
interface DiscordProfileExtended {
  id: string;
  username: string;
  global_name?: string | null;
  email?: string | null;
  image?: string | null;
}

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
        if (user.isBanned) throw new Error('Account has been banned');

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
      if (account && user) {
        token.id = user.id;
        token.username = user.username;
        token.name = user.name ?? null;
        token.email = user.email ?? null;
        token.picture = user.image ?? null;

        if (account.provider === 'discord' && profile) {
          const db = await connectDB();
          const discordProfile = profile as DiscordProfileExtended;
          const email = discordProfile.email;

          if (!email) return token;

          let dbUser = await db.collection('users').findOne({ email });

          if (!dbUser) {
            const randomPassword = Array.from({ length: 32 }, () =>
              'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()'.charAt(
                Math.floor(Math.random() * 70)
              )
            ).join('');
            const passwordHash = await hash(randomPassword, 12);

            const displayName = discordProfile.global_name || discordProfile.username || 'User';
            let username = displayName
              .toLowerCase()
              .replace(/\s+/g, '_')
              .replace(/[^a-z0-9_]/g, '');
            if (username.length < 3) {
              username = `user_${Date.now().toString(36).slice(-6)}`;
            }

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
              avatar: discordProfile.image || '',
              bio: '',
              passwordHash,
              badges: [],
              isEmailVerified: true,
              isBanned: false,
              createdAt: new Date(),
              profileViews: 0,
              plan: 'free',
              theme: 'indigo',
              xp: 0,
              level: 1,
              loginStreak: 1,
              lastLogin: new Date(),
              loginHistory: [new Date()],
              lastMonthlyBadge: '',
              layoutStructure: [
                { id: 'bio', type: 'bio' },
                { id: 'spacer-1', type: 'spacer', height: 24 },
                { id: 'links', type: 'links' },
              ],
              customCSS: '',
              customJS: '',
              seoMeta: { title: '', description: '', keywords: '' },
              analyticsCode: '',
            };

            await db.collection('users').insertOne(newUser);

            token.id = newUser._id.toString();
            token.username = newUser.username;
            token.name = newUser.name;
            token.email = newUser.email;
            token.picture = newUser.avatar;
          } else {
            token.id = dbUser._id.toString();
            token.username = dbUser.username;
            token.name = dbUser.name;
            token.email = dbUser.email;
            token.picture = dbUser.avatar;
          }
        }
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
  pages: { signIn: '/auth/login' },
};

export async function getServerSession() {
  return await getNextAuthServerSession(authOptions);
}
