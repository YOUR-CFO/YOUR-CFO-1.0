import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define protected routes
  const protectedRoutes = ['/dashboard', '/cash-flow', '/expenses', '/runway', '/insights', '/reports', '/settings'];
  const authRoutes = ['/login', '/signup', '/forgot-password'];

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // Get token from cookie or Authorization header
  const token = request.cookies.get('auth-token')?.value || 
                extractTokenFromHeader(request.headers.get('Authorization'));

  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify token and get user info
  let userPayload = null;
  if (token) {
    userPayload = await verifyToken(token);
    if (!userPayload && isProtectedRoute) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect to dashboard if accessing auth route with valid token
  if (isAuthRoute && userPayload) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Role-based access control
  if (isProtectedRoute && userPayload) {
    const userRole = userPayload.role;
    
    // Viewer role restrictions
    if (userRole === 'viewer') {
      const viewerRestrictedRoutes = ['/settings'];
      const isRestricted = viewerRestrictedRoutes.some(route => pathname.startsWith(route));
      
      if (isRestricted) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  // Add user info to headers for API routes
  if (userPayload) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', userPayload.userId);
    requestHeaders.set('x-user-email', userPayload.email);
    requestHeaders.set('x-user-role', userPayload.role);
    requestHeaders.set('x-company-id', userPayload.companyId);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
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
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};