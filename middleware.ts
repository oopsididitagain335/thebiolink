// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  const response = NextResponse.next();

  // ✅ Allow requests from your domain (and localhost for dev)
  const allowedOrigins = [
    'https://thebiolink.lol',
    'http://localhost:3000',
    // Add your Render URL if different:
    // 'https://your-app.onrender.com',
  ];

  // ✅ Set CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    // Always allow credentials (cookies) if needed
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With'
    );
  }

  // ✅ Security headers (applies to all matched routes)
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  // Handle preflight (OPTIONS) requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: response.headers });
  }

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/auth/:path*',
    '/dashboard/:path*',
    '/pricing',
    '/discovery',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
