import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getUserByEmail } from '@/lib/storage';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }
    
    const user = await getUserByEmail(email);
    if (!user) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    (await cookies()).set('biolink_session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
    
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'Login failed' }, { status: 500 });
  }
}
