// app/api/admin/reset-password/route.ts
import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/storage';
import { hash } from 'bcryptjs';
import { ObjectId } from 'mongodb';

// Generate a strong, random password (not returned to client)
function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

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

    if (user.isBanned) {
      return Response.json({ error: 'Cannot reset password for banned user' }, { status: 403 });
    }

    // Generate new secure password and hash it
    const newPassword = generateSecurePassword();
    const passwordHash = await hash(newPassword, 12);

    // Update only the password hash in the database
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { passwordHash } }
    );

    // 🔒 SECURITY: Password is NEVER sent to the frontend.
    // In a real system, you would:
    //   - Email it securely, OR
    //   - Log it to an encrypted internal audit system, OR
    //   - Require the user to set a new password on next login (preferred)

    // For now, we just confirm success
    return Response.json({ success: true });
  } catch (error) {
    console.error('Admin password reset error:', error);
    return Response.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
