import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/storage';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const user = await getUserByEmail(email);
    if (!user || !user.password) { // ← changed from passwordHash
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password); // ← changed from passwordHash
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const response = NextResponse.json({ message: 'Logged in' });
    response.cookies.set('session-token', user._id.toString(), { // convert ObjectId to string
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
