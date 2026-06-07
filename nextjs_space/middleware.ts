import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth?.token;
    const { pathname } = req.nextUrl;

    if (pathname.startsWith('/professor') && token?.userType !== 'professor') {
      return NextResponse.redirect(new URL('/aluno/dashboard', req.url));
    }
    if (pathname.startsWith('/aluno') && token?.userType !== 'aluno') {
      return NextResponse.redirect(new URL('/professor/dashboard', req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/professor/:path*', '/aluno/:path*'],
};
