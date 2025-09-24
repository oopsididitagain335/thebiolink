// app/api/auth/signup/route.ts
import { NextRequest } from 'next/server';
import { createUser } from '@/lib/storage';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, password, username, name } = await request.json();
    
    // Validation
    if (!email || !password || !username || !name) {
      return Response.json({ error: 'All fields required' }, { status: 400 });
    }
    
    if (password.length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    
    // Create user
    const user = await createUser(email, password, username, name);
    
    // Send verification email (non-blocking)
    sendVerificationEmail(user.email, user.emailVerificationToken)
      .catch(console.error);
    
    return Response.json({ 
      success: true, 
      message: 'Account created! Check email for verification link.' 
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
