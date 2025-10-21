import NextAuth, { NextAuthOptions, User } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from './prisma';
import { JWT } from 'next-auth/jwt';
import { AdapterUser } from 'next-auth/adapters';

type SessionUser = (User | AdapterUser) & { id: string; email?: string | null };

const adminEmail = 'fonz@hackclub.com';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt'
  },
  providers: [
    {
      id: 'pretix',
      name: 'Pretix',
      type: 'oidc',
      wellKnown: `${process.env.PRETIX_ISSUER?.replace(/\/$/, '')}/.well-known/openid-configuration`,
      clientId: process.env.PRETIX_CLIENT_ID,
      clientSecret: process.env.PRETIX_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'openid profile email'
        }
      },
      idToken: true,
      checks: ['pkce', 'state'],
      profile(profile) {
        return {
          id: profile.sub,
          name:
            profile.name || `${profile.given_name ?? ''} ${profile.family_name ?? ''}`.trim() || profile.email,
          email: profile.email,
          image: profile.picture
        };
      }
    }
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
        session.user.email = token.email;
        (session.user as { isAdmin?: boolean }).isAdmin = token.email === adminEmail;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
      }
      return token;
    }
  }
};

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authOptions,
  trustHost: true,
  callbacks: {
    ...authOptions.callbacks,
    async session(params) {
      const result = await authOptions.callbacks?.session?.(params as {
        session: { user?: SessionUser }; token: JWT; user?: SessionUser;
      });
      return result ?? params.session;
    }
  }
});

export async function getServerSession() {
  return auth();
}
