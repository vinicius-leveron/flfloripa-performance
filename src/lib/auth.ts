import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { getSupabase } from '@/lib/supabase';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })]
      : []),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const supabase = getSupabase();
        const bcrypt = await import('bcryptjs');

        const { data: user, error } = await supabase
          .from('users')
          .select('id, email, name, password_hash, role, image')
          .eq('email', credentials.email as string)
          .single();

        if (error || !user || !user.password_hash) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password_hash
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

      // On Google sign-in, upsert user and account in DB
      if (account?.provider === 'google' && profile?.email) {
        const supabase = getSupabase();
        const now = new Date().toISOString();

        // Try to find existing user
        const { data: existingUser } = await supabase
          .from('users')
          .select('id, role, image')
          .eq('email', profile.email)
          .single();

        let dbUser: { id: string; role: string; image: string | null } | null = existingUser;

        if (!dbUser) {
          // Create new user
          const { data: newUser } = await supabase
            .from('users')
            .insert({
              id: crypto.randomUUID(),
              email: profile.email,
              name: profile.name || profile.email.split('@')[0],
              image: (profile as { picture?: string }).picture || null,
              role: 'VIEWER',
              created_at: now,
              updated_at: now,
            })
            .select('id, role, image')
            .single();
          dbUser = newUser;
        } else if (!dbUser.image && (profile as { picture?: string }).picture) {
          // Update user image
          await supabase
            .from('users')
            .update({
              image: (profile as { picture?: string }).picture,
              updated_at: now,
            })
            .eq('id', dbUser.id);
        }

        if (dbUser) {
          // Upsert OAuth account link
          const { data: existingAccount } = await supabase
            .from('accounts')
            .select('id')
            .eq('provider', account.provider)
            .eq('provider_account_id', account.providerAccountId)
            .single();

          if (existingAccount) {
            await supabase
              .from('accounts')
              .update({
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
              })
              .eq('id', existingAccount.id);
          } else {
            await supabase
              .from('accounts')
              .insert({
                id: crypto.randomUUID(),
                user_id: dbUser.id,
                type: account.type,
                provider: account.provider,
                provider_account_id: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              });
          }

          token.id = dbUser.id;
          token.role = dbUser.role;
        }
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
  secret: process.env.NEXTAUTH_SECRET,
});
