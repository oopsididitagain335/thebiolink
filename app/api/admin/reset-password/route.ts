// app/api/admin/reset-password/route.ts
import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/storage';
import { hash } from 'bcryptjs';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const { userId, newPassword } = body;

    // Validate user ID
    if (!userId) {
      return Response.json({ error: 'User ID is required' }, { status: 400 });
    }
    if (!ObjectId.isValid(userId)) {
      return Response.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    // Validate password
    if (!newPassword) {
      return Response.json({ error: 'New password is required' }, { status: 400 });
    }
    if (typeof newPassword !== 'string') {
      return Response.json({ error: 'Password must be a string' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }
    if (newPassword.length > 128) {
      return Response.json({ error: 'Password must not exceed 128 characters' }, { status: 400 });
    }

    // Connect to database
    const db = await connectDB();

    // Verify user exists and is not banned
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    if (user.isBanned) {
      return Response.json({ error: 'Cannot reset password for banned users' }, { status: 403 });
    }

    // Hash new password
    const passwordHash = await hash(newPassword, 12);

    // Update password in database
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { passwordHash, updatedAt: new Date() } }
    );

    // Verify update was successful
    if (result.matchedCount === 0) {
      return Response.json({ error: 'User not found during update' }, { status: 404 });
    }

    // Success response
    return Response.json({ 
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    
    // Handle specific error types
    if (error instanceof SyntaxError) {
      return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    // Return generic error for security
    return Response.json({ 
      error: 'Failed to reset password. Please try again later.' 
    }, { status: 500 });
  }
}
