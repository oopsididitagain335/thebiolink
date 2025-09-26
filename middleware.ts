import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 10; // 10 requests per window
const ACCOUNT_LIMIT_PER_IP = 2; // Max accounts per IP

// Connect to MongoDB for rate limiting storage
async function getDb() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  return client.db();
}

// Store rate limit data in MongoDB
async function checkRateLimit(ip: string) {
  const db = await getDb();
  const collection = db.collection('rate_limits');
  
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  // Clean up old entries
  await collection.deleteMany({ lastRequest: { $lt: windowStart } });
  
  const existing = await collection.findOne({ ip });
  
  if (existing) {
    if (existing.count >= RATE_LIMIT_MAX) {
      return { limited: true, resetTime: existing.lastRequest + RATE_LIMIT_WINDOW };
    }
    
    await collection.updateOne(
      { _id: existing._id },
      { $inc: { count: 1 }, $set: { lastRequest: now } }
    );
  } else {
    await collection.insertOne({
      ip,
      count: 1,
      lastRequest: now
    });
  }
  
  return { limited: false };
}

// Check account creation limit per IP
async function checkAccountLimit(ip: string) {
  const db = await getDb();
  const collection = db.collection('users');
  
  const recentAccounts = await collection.countDocuments({
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
    ipAddress: ip
  });
  
  return recentAccounts < ACCOUNT_LIMIT_PER_IP;
}

export async function middleware(request: NextRequest) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
  
  // Apply rate limiting to auth routes
  if (request.nextUrl.pathname.startsWith('/api/auth/')) {
    const { limited, resetTime } = await checkRateLimit(ip);
    
    if (limited) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Too many requests. Please try again later.' 
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((resetTime! - Date.now()) / 1000).toString()
          }
        }
      );
    }
  }
  
  // Security headers
  const response = NextResponse.next();
  
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('Content-Security-Policy', 
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://*.mongodb.net"
  );
  
  return response;
}

export const config = {
  matcher: [
    '/api/auth/:path*',
    '/api/dashboard/:path*',
    '/auth/:path*',
    '/dashboard/:path*'
  ]
};
