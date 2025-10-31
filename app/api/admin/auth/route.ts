// app/api/admin/auth/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export function GET() {
  const session = cookies().get('admin_session');

  const isValid = session?.value === process.env.ADMIN_SESSION_SECRET;

  return NextResponse.json({ authenticated: isValid });
}
