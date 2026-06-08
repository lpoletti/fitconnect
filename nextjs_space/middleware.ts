import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth?.token;
    const { pathname } = req.nextUrl;

    // If user has no userType (Google SSO new user), redirect to onboarding
    if (!token?.userType && pathname !== '/onboarding') {
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }

    // If user has userType and is on onboarding, redirect to their dashboard
    if (token?.userType && pathname === '/onboarding') {
      const dest = token.userType === 'professor' ? '/professor/dashboard' : '/aluno/dashboard';
      return NextResponse.redirect(new URL(dest, req.url));
    }

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
  matcher: ['/professor/:path*', '/aluno/:path*', '/onboarding'],
};
