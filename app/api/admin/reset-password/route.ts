// app/api/admin/reset-password/route.ts
import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/storage';
import { hash } from 'bcryptjs';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  try {
    const { userId, newPassword } = await req.json();

    if (!userId || !ObjectId.isValid(userId)) {
      return Response.json({ error: 'Invalid user ID' }, { status: 400 });
    }
    if (!newPassword || newPassword.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const db = await connectDB();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
    if (user.isBanned) return Response.json({ error: 'Banned users cannot be reset' }, { status: 403 });

    const passwordHash = await hash(newPassword, 12);
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { passwordHash } }
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error('Reset error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
