import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_COOKIE_NAME = 'revival_admin_session';

export default function proxy(request: NextRequest) {
  // Only protect the /admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Exclude the login page itself to prevent redirect loops
    const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME);

    // If on login page, redirect to dashboard if ALREADY authenticated
    if (request.nextUrl.pathname === '/admin/login') {
      if (sessionCookie && sessionCookie.value === 'authenticated') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.next();
    }

    if (!sessionCookie || sessionCookie.value !== 'authenticated') {
      // Redirect to login if unauthenticated
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
