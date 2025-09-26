// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to add basic security headers.
 * Does NOT interact with MongoDB to avoid Edge Runtime conflicts.
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Essential security headers (compatible with Edge)
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  // Add HSTS if using HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  return response;
}

export const config = {
  matcher: [
    '/api/auth/:path*',
    '/auth/:path*',
    '/dashboard/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
