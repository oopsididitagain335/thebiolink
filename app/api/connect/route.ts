// app/api/connect/route.ts
import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const db = await connectDB();
    const codesCollection = db.collection('discord_codes');

    // Generate a random 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 8);

    // Insert code document
    await codesCollection.insertOne({
      code,
      userId: new ObjectId(userId),
      createdAt: new Date(),
      used: false,
    });

    return NextResponse.json({ code }, { status: 200 });
  } catch (error) {
    console.error('Error generating Discord connect code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI not set');
  }
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  return client.db();
}
