import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  // Define protected routes
  const protectedRoutes = ['/dashboard', '/cash-flow', '/expenses', '/runway', '/insights', '/reports', '/settings'];
  const authRoutes = ['/login', '/signup', '/forgot-password'];

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect to dashboard if accessing auth route with token
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Role-based access control
  if (isProtectedRoute && token) {
    const userRole = token.role as string;
    
    // Viewer role restrictions
    if (userRole === 'viewer') {
      const viewerRestrictedRoutes = ['/settings'];
      const isRestricted = viewerRestrictedRoutes.some(route => pathname.startsWith(route));
      
      if (isRestricted) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
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