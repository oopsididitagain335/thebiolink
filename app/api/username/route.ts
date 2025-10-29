// app/api/username/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/storage';
import { ObjectId } from 'mongodb';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username')?.trim().toLowerCase();

  // Basic validation (same as client side)
  if (!username || !/^[a-z0-9]{3,20}$/.test(username)) {
    return NextResponse.json({ available: false });
  }

  try {
    const db = await connectDB();
    const exists = await db
      .collection('users')
      .findOne({ username }, { projection: { _id: 1 } });

    return NextResponse.json({ available: !exists });
  } catch (err) {
    console.error('Username check error:', err);
    return NextResponse.json({ available: false }, { status: 500 });
  }
}
