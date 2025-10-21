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
      type: 'oauth',
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
        const su = session.user as SessionUser;
        su.id = token.sub ?? '';
        su.email = token.email as string | undefined | null;
        (su as { isAdmin?: boolean }).isAdmin = token.email === adminEmail;
        session.user = su as any;
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

// authOptions is exported above and consumed by the auth route.

// Helper to get server session using NextAuth's utility (avoids creating the handler here)
export async function getServerSession(): Promise<any> {
  const { getServerSession: _getServerSession } = await import('next-auth/next');
  return _getServerSession(authOptions as any);
}

// Backwards-compatible alias used by server actions in the codebase.
export const auth = getServerSession;
