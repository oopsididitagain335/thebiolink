// app/api/auth/signup/route.ts
import { NextRequest } from 'next/server';
import { createUser } from '@/lib/storage';
import { MongoClient, ObjectId } from 'mongodb'; // For IP limit check

// ✅ Helper to get client IP correctly
function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

// --- IP Account Limit Check (Node.js only) ---
async function checkAccountLimit(ipAddress: string): Promise<boolean> {
    // In a real app, store this in MongoDB collection
    // For simplicity, using a mock check here.
    // You would query a `signup_attempts` collection.
    console.log(`Checking account limit for IP: ${ipAddress}`);
    // Simulate: allow if less than 2 accounts in last 24h from this IP
    // Replace with actual MongoDB query logic
    return true; // Placeholder
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);

  // --- Account Creation Limit Check ---
  const canCreateAccount = await checkAccountLimit(ip); // Implement this
  if (!canCreateAccount) {
    return Response.json({
      error: 'Account creation limit reached for this IP address'
    }, { status: 429 });
  }
  // --- End Limit Check ---

  try {
    const { email, password, username, name, background } = await request.json();

    if (!email || !password || !username || !name) {
      return Response.json({ error: 'All fields required' }, { status: 400 });
    }

    if (password.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Add background validation if provided
    if (background) {
        try {
            const url = new URL(background);
            const validHosts = ['giphy.com', 'media.giphy.com', 'tenor.com', 'media.tenor.com'];
            const isValidHost = validHosts.some(host => url.hostname.includes(host));
            const isValidFormat = background.toLowerCase().endsWith('.gif');

            if (!isValidHost || !isValidFormat) {
                return Response.json({ error: 'Invalid GIF URL. Must be from Giphy or Tenor (.gif)' }, { status: 400 });
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
    console.error("Signup error:", error);
    if (error.message.includes('already')) {
      return Response.json({
        error: 'This account already exists'
      }, { status: 409 });
    }
    return Response.json({ error: 'Account creation failed' }, { status: 400 });
  }
}
