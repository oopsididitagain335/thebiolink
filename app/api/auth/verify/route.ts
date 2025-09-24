import { NextRequest } from 'next/server';
import { verifyUserEmail } from '@/lib/storage';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  
  if (!token) {
    return Response.json({ error: 'Invalid verification link' }, { status: 400 });
  }
  
  const user = await verifyUserEmail(token);
  
  if (!user) {
    return Response.json({ error: 'Invalid or expired token' }, { status: 400 });
  }
  
  // Redirect to dashboard with success message
  return Response.redirect(new URL('/dashboard?verified=true', request.url));
}
