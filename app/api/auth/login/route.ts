import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getUserByEmail } from '@/lib/storage';
import bcrypt from 'bcryptjs';

// Track failed login attempts
const failedAttempts = new Map<string, { count: number; lastAttempt: number }>();

export async function POST(request: NextRequest) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
  
  // Check for too many failed attempts
  const attempts = failedAttempts.get(ip);
  if (attempts && attempts.count >= 5) {
    const lockoutTime = 15 * 60 * 1000; // 15 minutes
    if (Date.now() - attempts.lastAttempt < lockoutTime) {
      return Response.json({ 
        error: 'Too many failed attempts. Try again later.' 
      }, { status: 429 });
    }
  }

  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }
    
    const user = await getUserByEmail(email);
    
    // Always take same time to prevent timing attacks
    const dummyHash = await bcrypt.hash('dummy', 12);
    const isValid = user ? await bcrypt.compare(password, user.passwordHash) : await bcrypt.compare(password, dummyHash);
    
    if (!isValid) {
      // Track failed attempts
      if (attempts) {
        failedAttempts.set(ip, { 
          count: attempts.count + 1, 
          lastAttempt: Date.now() 
        });
      } else {
        failedAttempts.set(ip, { count: 1, lastAttempt: Date.now() });
      }
      
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // Clear failed attempts on success
    failedAttempts.delete(ip);
    
    (await cookies()).set('biolink_session', user._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      sameSite: 'lax'
    });
    
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'Login failed' }, { status: 500 });
  }
}
