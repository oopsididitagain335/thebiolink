import { NextRequest } from 'next/server';
import { createUser } from '@/lib/storage';
import { MongoClient } from 'mongodb';

// Track IP addresses for account creation limits
async function checkIpLimit(ip: string) {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const db = client.db();
  
  const recentAccounts = await db.collection('users').countDocuments({
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
    ipAddress: ip
  });
  
  return recentAccounts < 2; // Max 2 accounts per IP per day
}

export async function POST(request: NextRequest) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
  
  // Check IP limit
  const canCreateAccount = await checkIpLimit(ip);
  if (!canCreateAccount) {
    return Response.json({ 
      error: 'Account creation limit reached for this IP address' 
    }, { status: 429 });
  }

  try {
    const { email, password, username, name, background } = await request.json();
    
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
    
    // Validate background GIF if provided
    if (background) {
      try {
        const url = new URL(background);
        const validHosts = ['giphy.com', 'media.giphy.com', 'tenor.com', 'media.tenor.com'];
        const isValidHost = validHosts.some(host => url.hostname.includes(host));
        const isValidFormat = background.toLowerCase().endsWith('.gif');
        
        if (!isValidHost || !isValidFormat) {
          return Response.json({ error: 'Invalid GIF URL. Must be from Giphy or Tenor' }, { status: 400 });
        }
      } catch {
        return Response.json({ error: 'Invalid GIF URL format' }, { status: 400 });
      }
    }
    
    const user = await createUser(email, password, username, name, background, ip);
    
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
