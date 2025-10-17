// app/api/auth/signup/route.ts
import { NextRequest } from 'next/server';
import { createUser } from '@/lib/storage';

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
  console.log(`Checking account limit for IP: ${ipAddress}`);
  return true; // Placeholder — replace with real logic later
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);

  const canCreateAccount = await checkAccountLimit(ip);
  if (!canCreateAccount) {
    return Response.json({
      error: 'Account creation limit reached for this IP address'
    }, { status: 429 });
  }

  try {
    // ✅ REMOVED `background` from destructuring
    const { email, password, username, name } = await request.json();

    if (!email || !password || !username || !name) {
      return Response.json({ error: 'All fields required' }, { status: 400 });
    }

    if (password.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // ✅ Call createUser with ONLY 5 arguments (no background)
    const user = await createUser(email, password, username, name, ip);

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
