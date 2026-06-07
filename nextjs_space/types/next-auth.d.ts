import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      userType: string;
      professorId: string | null;
      studentId: string | null;
    };
  }
  interface User {
    id: string;
    email: string;
    name: string;
    userType: string;
    professorId: string | null;
    studentId: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string;
    userType: string;
    professorId: string | null;
    studentId: string | null;
  }
}
