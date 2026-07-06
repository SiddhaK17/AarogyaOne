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
const PUBLIC_EXCEPTIONS = ['/citizen/search', '/citizen/nearby'];

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

  const redirectToLogin = (roleQuery?: string) => {
    const loginUrl = new URL('/login', request.url);
    if (roleQuery) {
      loginUrl.searchParams.set('role', roleQuery);
    } else {
      if (pathname.startsWith('/hospital')) loginUrl.searchParams.set('role', 'hospital');
      else if (pathname.startsWith('/dhic')) loginUrl.searchParams.set('role', 'dhic');
      else if (pathname.startsWith('/government')) loginUrl.searchParams.set('role', 'government');
      else if (pathname.startsWith('/citizen')) loginUrl.searchParams.set('role', 'citizen');
    }
    return NextResponse.redirect(loginUrl);
  };

  if (!token) {
    return redirectToLogin();
  }

  // Enforce portal-role mismatch restrictions
  if (pathname.startsWith('/hospital') && portalRole !== 'hospital') {
    return redirectToLogin('hospital');
  }
  if (pathname.startsWith('/dhic') && portalRole !== 'dhic') {
    return redirectToLogin('dhic');
  }
  if (pathname.startsWith('/government') && portalRole !== 'government') {
    return redirectToLogin('government');
  }
  if (pathname.startsWith('/citizen') && portalRole !== 'citizen') {
    return redirectToLogin('citizen');
  }

  const response = NextResponse.next();
  
  // Apply aggressive cache control to protected responses to prevent
  // browser "Back" button history bypass after logout.
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}

export const config = {
  matcher: [
    '/hospital/:path*',
    '/dhic/:path*',
    '/government/:path*',
    '/citizen/:path*',
  ],
};
