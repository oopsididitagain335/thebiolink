import { NextRequest } from 'next/server';
import { createUser } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const { email, password, username, name } = await request.json();
    
    if (!email || !password || !username || !name) {
      return Response.json({ error: 'All fields required' }, { status: 400 });
    }
    
    if (password.length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    
    const user = await createUser(email, password, username, name);
    
    return Response.json({ 
      success: true, 
      message: 'Account created! Email verification is disabled. Please join our Discord for manual verification.'
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
