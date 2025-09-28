// lib/storage.ts
import { ObjectId, WithId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from './db';

// Types
export interface Badge {
  id: string;
  name: string;
  icon: string;
  awardedAt: string;
}

export interface User {
  _id: ObjectId;
  email: string;
  username: string;
  name: string;
  avatar?: string;
  bio?: string;
  background?: string;
  password: string;
  badges: Badge[];
  isBanned: boolean;
  bannedAt?: Date;
  signupIP: string;
  createdAt: Date;
  referralCode?: string;
}

export interface Referral {
  _id: ObjectId;
  referrerId: ObjectId;
  referredUserId: ObjectId;
  timestamp: Date;
}

// ✅ Get user by ID
export async function getUserById(id: string): Promise<WithId<User> | null> {
  if (!ObjectId.isValid(id)) return null;
  const { db } = await connectToDatabase();
  return await db.collection<User>('users').findOne({ _id: new ObjectId(id) });
}

// ✅ Get user by email
export async function getUserByEmail(email: string): Promise<WithId<User> | null> {
  const { db } = await connectToDatabase();
  return await db.collection<User>('users').findOne({ email });
}

// ✅ Get user by username
export async function getUserByUsername(username: string): Promise<WithId<User> | null> {
  const { db } = await connectToDatabase();
  return await db.collection<User>('users').findOne({ username });
}

// ✅ Create new user
export async function createUser(
  email: string,
  password: string,
  username: string,
  name: string,
  background?: string,
  ip?: string
): Promise<WithId<User>> {
  const { db } = await connectToDatabase();
  const hashedPassword = await bcrypt.hash(password, 12);

  const newUser = {
    email,
    username: username.toLowerCase(),
    name,
    password: hashedPassword,
    avatar: '',
    bio: '',
    background: background || '',
    badges: [],
    isBanned: false,
    signupIP: ip || 'unknown',
    createdAt: new Date(),
  };

  const result = await db.collection<User>('users').insertOne(newUser);
  return { _id: result.insertedId, ...newUser };
}

// ✅ Log a referral event
export async function logReferral(referrerId: string, referredUserId: string): Promise<void> {
  if (!ObjectId.isValid(referrerId) || !ObjectId.isValid(referredUserId)) {
    throw new Error('Invalid user IDs');
  }
  const { db } = await connectToDatabase();
  await db.collection<Referral>('referrals').insertOne({
    referrerId: new ObjectId(referrerId),
    referredUserId: new ObjectId(referredUserId),
    timestamp: new Date(),
  });
}

// ✅ Get referral stats for ALL users (including 0-count)
export async function getReferralStats() {
  const { db } = await connectToDatabase();

  const allUsers = await db.collection<User>('users').find(
    {},
    { projection: { _id: 1, username: 1 } }
  ).toArray();

  const referralCounts = await db.collection<Referral>('referrals')
    .aggregate([{ $group: { _id: '$referrerId', count: { $sum: 1 } } }])
    .toArray();

  const countMap = new Map<string, number>();
  referralCounts.forEach((item: any) => {
    const idStr = item._id.toString();
    countMap.set(idStr, item.count);
  });

  return allUsers.map(user => ({
    userId: user._id.toString(),
    username: user.username || 'unknown',
    usageCount: countMap.get(user._id.toString()) || 0,
  }));
}

// ✅ Add badge to user
export async function addUserBadge(userId: string, badge: Badge): Promise<void> {
  if (!ObjectId.isValid(userId)) throw new Error('Invalid user ID');
  const { db } = await connectToDatabase();
  await db.collection<User>('users').updateOne(
    { _id: new ObjectId(userId) },
    { $push: { badges: badge } }
  );
}

// ✅ Remove badge from user
export async function removeUserBadge(userId: string, badgeId: string): Promise<void> {
  if (!ObjectId.isValid(userId)) throw new Error('Invalid user ID');
  const { db } = await connectToDatabase();
  await db.collection<User>('users').updateOne(
    { _id: new ObjectId(userId) },
    { $pull: { badges: { id: badgeId } } }
  );
}

// ✅ Ban/unban user
export async function setBanStatus(userId: string, isBanned: boolean): Promise<void> {
  if (!ObjectId.isValid(userId)) throw new Error('Invalid user ID');
  const { db } = await connectToDatabase();
  await db.collection<User>('users').updateOne(
    { _id: new ObjectId(userId) },
    { $set: { isBanned, bannedAt: isBanned ? new Date() : null } }
  );
}

// ✅ Get top referrers (for admin)
export async function getTopReferrers(limit = 10) {
  const { db } = await connectToDatabase();
  const pipeline = [
    { $group: { _id: '$referrerId', referredCount: { $sum: 1 } } },
    { $sort: { referredCount: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: 0,
        username: '$user.username',
        referredCount: 1
      }
    }
  ];
  return await db.collection<Referral>('referrals').aggregate(pipeline).toArray();
}
