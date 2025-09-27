// app/api/views/[username]/route.ts
import { NextRequest } from 'next/server';
import { getViewCount } from '@/lib/storage';

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function GET(request: NextRequest, { params }: PageProps) {
  const { username } = await params;
  
  try {
    const count = await getViewCount(username);
    return Response.json({ count });
  } catch (error) {
    return Response.json({ count: 0 });
  }
}
