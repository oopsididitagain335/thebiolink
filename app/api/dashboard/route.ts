// app/api/dashboard/route.ts
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Redirect to /api/dashboard/data
  return Response.redirect(new URL('/api/dashboard/data', request.url));
}
