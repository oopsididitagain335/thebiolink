// app/api/admin/reset-password/route.ts
import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/storage';
import { hash } from 'bcryptjs';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId || !ObjectId.isValid(userId)) {
      return Response.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const db = await connectDB();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate strong random password
    const newPassword = Array.from({ length: 12 }, () =>
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'.charAt(
        Math.floor(Math.random() * 67)
      )
    ).join('');

    const passwordHash = await hash(newPassword, 12);
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { passwordHash } }
    );

    // Return only the new password (for admin to share securely)
    return Response.json({ success: true, newPassword });
  } catch (error) {
    console.error('Reset password error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
