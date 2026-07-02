import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * AarogyaOne – Route Protection Middleware
 * 
 * Intercepts requests to protected portal routes (/hospital, /dhic, /government, /citizen)
 * and validates the presence of an authentication token and role claims.
 */

const PROTECTED_PREFIXES = ['/hospital', '/dhic', '/government', '/citizen'];

// Routes within protected prefixes that should remain accessible without auth
const PUBLIC_EXCEPTIONS = ['/citizen/search'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a protected route prefix
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

  // Check for authentication token and role in cookies
  const token = request.cookies.get('aarogya_token')?.value;
  const portalRole = request.cookies.get('portal_role')?.value;

  if (!token) {
    // Redirect to login with correct role context
    const loginUrl = new URL('/login', request.url);
    if (pathname.startsWith('/hospital')) {
      loginUrl.searchParams.set('role', 'hospital');
    } else if (pathname.startsWith('/dhic')) {
      loginUrl.searchParams.set('role', 'dhic');
    } else if (pathname.startsWith('/government')) {
      loginUrl.searchParams.set('role', 'government');
    } else if (pathname.startsWith('/citizen')) {
      loginUrl.searchParams.set('role', 'citizen');
    }
    return NextResponse.redirect(loginUrl);
  }

  // Enforce portal-role mismatch restrictions
  if (pathname.startsWith('/hospital') && portalRole !== 'hospital') {
    return NextResponse.redirect(new URL('/login?role=hospital', request.url));
  }
  if (pathname.startsWith('/dhic') && portalRole !== 'dhic') {
    return NextResponse.redirect(new URL('/login?role=dhic', request.url));
  }
  if (pathname.startsWith('/government') && portalRole !== 'government') {
    return NextResponse.redirect(new URL('/login?role=government', request.url));
  }
  if (pathname.startsWith('/citizen') && portalRole !== 'citizen') {
    return NextResponse.redirect(new URL('/login?role=citizen', request.url));
  }

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

