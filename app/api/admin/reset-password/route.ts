// app/api/admin/reset-password/route.ts
import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/storage';
import { hash } from 'bcryptjs';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  try {
    const { userId, newPassword } = await req.json();

    // Validate input
    if (!userId || !ObjectId.isValid(userId)) {
      return Response.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return Response.json({ error: 'New password is required' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    const db = await connectDB();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.isBanned) {
      return Response.json({ error: 'Cannot reset password for banned user' }, { status: 403 });
    }

    // Hash the new password (same as signup)
    const passwordHash = await hash(newPassword, 12);

    // Update only the password hash
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { passwordHash } }
    );

    // ✅ Success — no password returned
    return Response.json({ success: true });
  } catch (error) {
    console.error('Admin password reset error:', error);
    return Response.json({ error: 'Failed to update password' }, { status: 500 });
  }
}
