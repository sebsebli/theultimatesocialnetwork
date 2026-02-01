import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes (reserved for future logic, e.g. allow unauthenticated access)
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for future public route checks
const publicRoutes = [
  "/",
  "/welcome",
  "/sign-in",
  "/waiting-list",
  "/verify",
  "/privacy",
  "/terms",
  "/ai-transparency",
  "/imprint",
  "/roadmap",
  "/manifesto",
];

// Routes that require authentication (public profile/post are allowed without auth)
const protectedRoutes = [
  "/home",
  "/explore",
  "/compose",
  "/inbox",
  "/invites",
  "/topic",
  "/collections",
  "/keeps",
  "/settings",
  "/search",
  "/onboarding",
];
// Public view-only: /user/* and /post/* (interaction locked when not authenticated)
const publicViewRoutes = ["/user/", "/post/"];

// Routes that are public but redirect authenticated users
const publicAuthRoutes = ["/welcome", "/sign-in"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  // Static / well-known: allow without running auth logic
  if (pathname.startsWith("/.well-known")) {
    return NextResponse.next();
  }

  // Public view-only routes: allow without auth (profile and post pages)
  const isPublicViewRoute = publicViewRoutes.some((route) =>
    pathname.startsWith(route),
  );
  if (isPublicViewRoute) {
    return NextResponse.next();
  }

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // If accessing root and authenticated, redirect to home
  if (pathname === "/" && token) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // If accessing root and not authenticated, allow (show landing page)
  if (pathname === "/" && !token) {
    return NextResponse.next();
  }

  // If accessing protected route without token, redirect to landing
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If accessing public auth routes while authenticated, redirect to home
  if (publicAuthRoutes.includes(pathname) && token) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

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
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
