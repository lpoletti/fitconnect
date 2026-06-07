import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  providers: [
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
          if (!user) return null;
          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!isValid) return null;
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            userType: user.userType,
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
    async jwt({ token, user }: any) {
      if (user) {
        token.userType = user.userType;
        token.professorId = user.professorId;
        token.studentId = user.studentId;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.id = token.userId as string;
        session.user.userType = token.userType as string;
        session.user.professorId = token.professorId as string | null;
        session.user.studentId = token.studentId as string | null;
      }
      return session;
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
