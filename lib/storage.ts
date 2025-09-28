// lib/storage.ts
import { MongoClient, Db, ObjectId, WithId } from 'mongodb';
import bcrypt from 'bcryptjs';

// ─── Types ───────────────────────────────────────────
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
  isEmailVerified?: boolean;
}

export interface Referral {
  _id: ObjectId;
  referrerId: ObjectId;
  referredUserId: ObjectId;
  timestamp: Date;
}

// ─── MongoDB Connection ─────────────────────────────
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

async function createMongoClient() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Missing MONGODB_URI in environment');
  }
  return new MongoClient(process.env.MONGODB_URI);
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (!clientPromise) {
    client = await createMongoClient();
    clientPromise = client.connect();
  }
  await clientPromise;
  const db = client.db(process.env.MONGODB_DB || 'thebiolink');
  return { client, db };
}

// ─── Users ──────────────────────────────────────────
export async function getUserById(id: string): Promise<WithId<User> | null> {
  if (!ObjectId.isValid(id)) return null;
  const { db } = await connectToDatabase();
  return db.collection<User>('users').findOne({ _id: new ObjectId(id) });
}

export async function getUserByEmail(email: string): Promise<WithId<User> | null> {
  const { db } = await connectToDatabase();
  return db.collection<User>('users').findOne({ email });
}

export async function getUserByUsername(username: string): Promise<WithId<User> | null> {
  const { db } = await connectToDatabase();
  return db.collection<User>('users').findOne({ username });
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
    backgroundVideo: user.backgroundVideo,
    backgroundAudio: user.backgroundAudio,
    badges: user.badges,
    isBanned: user.isBanned,
    links: user.links,
  };
}

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

  // ✅ FIXED: Removed ": User" type annotation — this object does NOT have _id yet
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

  const result = await db.collection<User>('users').insertOne(newUser);
  // ✅ Now safely return a full WithId<User>
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

// ─── Profile Views ──────────────────────────────────
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
  return db.collection('profileViews').countDocuments({ userId: new ObjectId(userId) });
}

// ─── Badges ────────────────────────────────────────
export async function getAllBadges() {
  const { db } = await connectToDatabase();
  return db.collection('badges').find({}).toArray();
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

// ─── Referrals ─────────────────────────────────────
export async function logReferral(referrerId: string, referredUserId: string) {
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

export async function getReferralStats() {
  const { db } = await connectToDatabase();
  const allUsers = await db.collection<User>('users').find({}, { projection: { _id: 1, username: 1 } }).toArray();
  const referralCounts = await db.collection<Referral>('referrals')
    .aggregate([{ $group: { _id: '$referrerId', count: { $sum: 1 } } }])
    .toArray();

  const countMap = new Map<string, number>();
  referralCounts.forEach(item => countMap.set(item._id.toString(), item.count));
  return allUsers.map(user => ({
    userId: user._id.toString(),
    username: user.username || 'unknown',
    usageCount: countMap.get(user._id.toString()) || 0,
  }));
}

// ─── Admin / Announcements / Ban ───────────────────
export async function banUser(userId: string) {
  if (!ObjectId.isValid(userId)) throw new Error('Invalid user ID');
  const { db } = await connectToDatabase();
  await db.collection<User>('users').updateOne(
    { _id: new ObjectId(userId) },
    { $set: { isBanned: true, bannedAt: new Date() } }
  );
}

export async function unbanUser(userId: string) {
  if (!ObjectId.isValid(userId)) throw new Error('Invalid user ID');
  const { db } = await connectToDatabase();
  await db.collection<User>('users').updateOne(
    { _id: new ObjectId(userId) },
    { $set: { isBanned: false, bannedAt: null } }
  );
}

export async function getAllUsers() {
  const { db } = await connectToDatabase();
  return db.collection<User>('users').find({}, { projection: { password: 0 } }).toArray();
}

export async function getLatestAnnouncement() {
  const { db } = await connectToDatabase();
  return db.collection('announcements').findOne({}, { sort: { createdAt: -1 } });
}

export async function sendAnnouncement(content: string, authorId: string) {
  const { db } = await connectToDatabase();
  const announcement = { content, authorId, createdAt: new Date() };
  const result = await db.collection('announcements').insertOne(announcement);
  return { ...announcement, _id: result.insertedId };
}

// ─── Links ─────────────────────────────────────────
export async function saveUserLinks(userId: string, links: any[]) {
  if (!ObjectId.isValid(userId)) throw new Error('Invalid user ID');
  const { db } = await connectToDatabase();
  const result = await db.collection<User>('users').updateOne(
    { _id: new ObjectId(userId) },
    { $set: { links } }
  );
  return result.modifiedCount > 0;
}
