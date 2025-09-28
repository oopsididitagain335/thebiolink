// lib/storage.ts
import { ObjectId, WithId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from './db';

// Types
export interface Badge {
  id: string;
  name: string;
  icon: string;
  awardedAt?: string;
}

export interface User {
  _id: ObjectId;
  email: string;
  username: string;
  name: string;
  avatar?: string;
  bio?: string;
  background?: string;
  backgroundVideo?: string;
  backgroundAudio?: string;
  password: string;
  badges: Badge[];
  isBanned: boolean;
  bannedAt?: Date | null;
  signupIP: string;
  createdAt: Date;
  referralCode?: string;
  links?: any[];
}

// Referrals
export interface Referral {
  _id: ObjectId;
  referrerId: ObjectId;
  referredUserId: ObjectId;
  timestamp: Date;
}

// ─── User Queries ───
export async function getUserById(id: string): Promise<WithId<User> | null> {
  if (!ObjectId.isValid(id)) return null;
  const { db } = await connectToDatabase();
  return await db.collection<User>('users').findOne({ _id: new ObjectId(id) });
}

export async function getUserByEmail(email: string): Promise<WithId<User> | null> {
  const { db } = await connectToDatabase();
  return await db.collection<User>('users').findOne({ email });
}

export async function getUserByUsername(username: string): Promise<WithId<User> | null> {
  const { db } = await connectToDatabase();
  return await db.collection<User>('users').findOne({ username });
}

export async function getUserByUsernameForMetadata(username: string) {
  const user = await getUserByUsername(username);
  if (!user) return null;
  return {
    username: user.username,
    name: user.name,
    bio: user.bio,
    avatar: user.avatar,
    background: user.background,
    badges: user.badges,
    isBanned: user.isBanned,
  };
}

// ─── User Management ───
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
    backgroundVideo: '',
    backgroundAudio: '',
    badges: [],
    isBanned: false,
    signupIP: ip || 'unknown',
    createdAt: new Date(),
    links: [],
  };

  const result = await db.collection<User>('users').insertOne(newUser as User);
  return { _id: result.insertedId, ...newUser };
}

export async function updateUserProfile(userId: string, updates: Partial<User>) {
  if (!ObjectId.isValid(userId)) throw new Error('Invalid user ID');
  const { db } = await connectToDatabase();
  const result = await db.collection<User>('users').updateOne(
    { _id: new ObjectId(userId) },
    { $set: updates }
  );
  return result.modifiedCount > 0;
}

// ─── Profile Views ───
export async function recordProfileView(userId: string, clientId: string) {
  if (!ObjectId.isValid(userId)) throw new Error('Invalid user ID');
  const { db } = await connectToDatabase();

  await db.collection('profileViews').updateOne(
    { userId: new ObjectId(userId), clientId },
    { $setOnInsert: { viewedAt: new Date() } },
    { upsert: true }
  );
}

export async function getProfileViewCount(userId: string): Promise<number> {
  if (!ObjectId.isValid(userId)) return 0;
  const { db } = await connectToDatabase();
  return await db.collection('profileViews').countDocuments({ userId: new ObjectId(userId) });
}

// ─── Badges ───
export async function getAllBadges() {
  const { db } = await connectToDatabase();
  return await db.collection('badges').find({}).toArray();
}

export async function createBadge(badgeData: { id: string; name: string; icon: string }) {
  const { db } = await connectToDatabase();
  await db.collection('badges').insertOne(badgeData);
  return badgeData;
}

export async function addUserBadge(userId: string, badge: Badge): Promise<void> {
  if (!ObjectId.isValid(userId)) throw new Error('Invalid user ID');
  const { db } = await connectToDatabase();
  await db.collection<User>('users').updateOne(
    { _id: new ObjectId(userId) },
    { $push: { badges: badge } }
  );
}

export async function removeUserBadge(userId: string, badgeId: string): Promise<void> {
  if (!ObjectId.isValid(userId)) throw new Error('Invalid user ID');
  const { db } = await connectToDatabase();
  await db.collection<User>('users').updateOne(
    { _id: new ObjectId(userId) },
    { $pull: { badges: { id: badgeId } } }
  );
}

// ─── Admin / Announcements ───
export async function getAllUsers() {
  const { db } = await connectToDatabase();
  return await db.collection<User>('users').find({}, { projection: { password: 0 } }).toArray();
}

export async function getLatestAnnouncement() {
  const { db } = await connectToDatabase();
  return await db.collection('announcements').findOne({}, { sort: { createdAt: -1 } });
}

export async function sendAnnouncement(content: string, authorId: string) {
  const { db } = await connectToDatabase();
  const announcement = {
    content,
    authorId,
    createdAt: new Date(),
  };
  const result = await db.collection('announcements').insertOne(announcement);
  return { ...announcement, _id: result.insertedId };
}
