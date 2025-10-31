// app/api/admin/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  const validUser = process.env.ADMIN_USER;
  const validPass = process.env.ADMIN_PASS;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;

  if (!validUser || !validPass || !sessionSecret) {
    return NextResponse.json(
      { error: 'Admin not configured' },
      { status: 500 }
    );
  }

  if (username === validUser && password === validPass) {
    // Set HTTP-only, secure, same-site cookie
    cookies().set({
      name: 'admin_session',
      value: sessionSecret,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/admin',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { error: 'Invalid credentials' },
    { status: 401 }
  );
}
