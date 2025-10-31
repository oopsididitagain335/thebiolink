// app/api/admin/auth/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');

  const isValid = session?.value === process.env.ADMIN_SESSION_SECRET;

  return NextResponse.json({ authenticated: isValid });
}
