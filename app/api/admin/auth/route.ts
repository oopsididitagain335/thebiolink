// app/api/admin/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const session = cookieStore.get('admin_session');

  // Simple session validation (you could use JWT or DB session later)
  const isValid = session?.value === process.env.ADMIN_SESSION_SECRET;

  return NextResponse.json({ authenticated: isValid });
}
