import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * AarogyaOne – Route Protection Middleware
 * 
 * Intercepts requests to protected portal routes (/hospital, /dhic, /government, /citizen)
 * and validates the presence of an authentication token cookie.
 * 
 * In production, this would verify the JWT signature and validate the role claim
 * against the target route. For the hackathon MVP, we allow pass-through
 * while maintaining the middleware skeleton for future enforcement.
 */

const PROTECTED_PREFIXES = ['/hospital', '/dhic', '/government'];

// Routes within protected prefixes that should remain accessible without auth
const PUBLIC_EXCEPTIONS = ['/citizen/search'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a protected route
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  // Allow public exceptions
  const isException = PUBLIC_EXCEPTIONS.some((path) =>
    pathname.startsWith(path)
  );

  if (!isProtected || isException) {
    return NextResponse.next();
  }

  // Check for authentication token in cookies
  const token = request.cookies.get('aarogya_token')?.value;

  if (!token) {
    // For hackathon demo: allow access without token so judges can navigate freely
    // In production: redirect to login
    // const loginUrl = new URL('/login', request.url);
    // loginUrl.searchParams.set('redirect', pathname);
    // return NextResponse.redirect(loginUrl);
    return NextResponse.next();
  }

  // In production: decode and verify token, check role against route
  // const session = decodeToken(token);
  // if (!session || isTokenExpired(session) || !isAuthorized(pathname, session.role)) {
  //   return NextResponse.redirect(new URL('/login', request.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/hospital/:path*',
    '/dhic/:path*',
    '/government/:path*',
    '/citizen/:path*',
  ],
};
