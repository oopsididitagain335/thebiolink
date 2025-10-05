// lib/auth.ts
import { cookies } from 'next/headers';
import { connectDB } from './storage';
import { ObjectId } from 'mongodb';

export async function getCurrentUser() {
  const sessionCookie = cookies().get('biolink_session')?.value;
  if (!sessionCookie || !ObjectId.isValid(sessionCookie)) {
    return null;
  }

  try {
    const db = await connectDB();
    const user = await db.collection('users').findOne({
      _id: new ObjectId(sessionCookie)
    });

    if (!user) return null;

    return {
      _id: user._id.toString(),
      email: user.email,
      username: user.username,
      name: user.name || '',
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}
