import { NextRequest, NextResponse } from 'next/server';
import { getViewCount } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const { username } = params;
  try {
    const count = await getViewCount(username);
    return NextResponse.json({ count }, { status: 200 });
  } catch (error) {
    console.error('Error fetching view count:', error); // Add logging for debugging
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
