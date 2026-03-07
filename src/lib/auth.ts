import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { IS_DEMO, DEMO_USER } from '@/lib/demo-data';

async function getPrisma() {
  if (IS_DEMO) return null;
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || 'demo',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'demo',
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Demo mode: accept any credentials
        if (IS_DEMO) {
          return {
            id: DEMO_USER.id,
            email: DEMO_USER.email,
            name: DEMO_USER.name,
            role: DEMO_USER.role,
            image: DEMO_USER.image,
          };
        }

        const prisma = await getPrisma();
        if (!prisma) return null;

        const bcrypt = await import('bcryptjs');

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (IS_DEMO) return true;
      if (account?.provider === 'google') {
        return profile?.email?.endsWith('@logosofia.org.br') ?? false;
      }
      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id;
      }

      if (IS_DEMO) {
        token.id = DEMO_USER.id;
        token.role = DEMO_USER.role;
        return token;
      }

      // On Google sign-in, upsert user and account in DB
      if (account?.provider === 'google' && profile?.email) {
        const prisma = await getPrisma();
        if (!prisma) return token;

        let dbUser = await prisma.user.findUnique({
          where: { email: profile.email },
        });

        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              email: profile.email,
              name: profile.name || profile.email.split('@')[0],
              image: (profile as { picture?: string }).picture || null,
              role: 'VIEWER',
            },
          });
        } else if (!dbUser.image && (profile as { picture?: string }).picture) {
          dbUser = await prisma.user.update({
            where: { id: dbUser.id },
            data: { image: (profile as { picture?: string }).picture },
          });
        }

        // Upsert OAuth account link
        await prisma.account.upsert({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
          update: {
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
          },
          create: {
            userId: dbUser.id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
          },
        });

        token.id = dbUser.id;
        token.role = dbUser.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET || 'demo-secret-not-for-production-use',
});
