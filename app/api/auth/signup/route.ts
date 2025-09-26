import { NextRequest } from 'next/server';
import { createUser } from '@/lib/storage';

// Simple IP tracking for duplicate prevention
const recentSignups = new Map<string, number>();

export async function POST(request: NextRequest) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
  
  // Prevent rapid duplicate signups from same IP
  const lastSignup = recentSignups.get(ip);
  if (lastSignup && Date.now() - lastSignup < 60000) { // 1 minute cooldown
    return Response.json({ 
      error: 'Please wait before creating another account' 
    }, { status: 429 });
  }

  try {
    const { email, password, username, name } = await request.json();
    
    // Input validation
    if (!email || !password || !username || !name) {
      return Response.json({ error: 'All fields required' }, { status: 400 });
    }
    
    if (password.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    
    if (!/^[a-zA-Z0-9]{3,20}$/.test(username)) {
      return Response.json({ error: 'Username must be 3-20 alphanumeric characters' }, { status: 400 });
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Invalid email format' }, { status: 400 });
    }
    
    const user = await createUser(email, password, username, name);
    
    // Track successful signup
    recentSignups.set(ip, Date.now());
    
    return Response.json({ 
      success: true, 
      message: 'Account created successfully!'
    });
  } catch (error: any) {
    // Generic error message to prevent user enumeration
    if (error.message.includes('already')) {
      return Response.json({ 
        error: 'This account already exists' 
      }, { status: 409 });
    }
    return Response.json({ error: 'Account creation failed' }, { status: 400 });
  }
}
