import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase().trim() },
            include: { professor: true, student: true },
          });
          if (!user || !user.passwordHash) return null;
          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!isValid) return null;
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            userType: user.userType ?? '',
            professorId: user.professor?.id ?? null,
            studentId: user.student?.id ?? null,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }: any) {
      if (user) {
        token.userType = user.userType ?? null;
        token.professorId = user.professorId ?? null;
        token.studentId = user.studentId ?? null;
        token.userId = user.id;
      }
      // Refresh user data on every token refresh to pick up onboarding changes
      if (trigger === 'update' || (!token.userType && token.userId)) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.userId as string },
            include: { professor: true, student: true },
          });
          if (dbUser) {
            token.userType = dbUser.userType ?? null;
            token.professorId = dbUser.professor?.id ?? null;
            token.studentId = dbUser.student?.id ?? null;
          }
        } catch {}
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.id = token.userId as string;
        session.user.userType = (token.userType as string) ?? null;
        session.user.professorId = (token.professorId as string) ?? null;
        session.user.studentId = (token.studentId as string) ?? null;
      }
      return session;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  cookies: {
    state: {
      name: 'next-auth.state',
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    pkceCodeVerifier: {
      name: 'next-auth.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
