import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  (await cookies()).delete('biolink_session');
  return Response.json({ success: true });
}
