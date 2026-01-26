import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/welcome',
  '/sign-in',
  '/waiting-list',
  '/verify',
  '/privacy',
  '/terms',
  '/imprint',
  '/roadmap',
  '/manifesto',
];

// Routes that require authentication
const protectedRoutes = [
  '/home',
  '/explore',
  '/compose',
  '/inbox',
  '/user',
  '/post',
  '/topic',
  '/collections',
  '/keeps',
  '/settings',
  '/search',
  '/onboarding',
];

// Routes that are public but redirect authenticated users
const publicAuthRoutes = ['/welcome', '/sign-in'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // If accessing root and authenticated, redirect to home
  // if (pathname === '/' && token) {
  //   return NextResponse.redirect(new URL('/home', request.url));
  // }

  // If accessing root and not authenticated, allow (show landing page)
  if (pathname === '/' && !token) {
    return NextResponse.next();
  }

  // If accessing protected route without token, redirect to landing
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If accessing public auth routes while authenticated, redirect to home
  // if (publicAuthRoutes.includes(pathname) && token) {
  //   return NextResponse.redirect(new URL('/home', request.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
