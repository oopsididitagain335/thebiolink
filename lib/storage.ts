import { MongoClient, ObjectId, Db, WithId } from 'mongodb';
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
  passwordHash: string;
  badges: Badge[];
  isEmailVerified: boolean;
  isBanned: boolean;
  bannedAt?: string;
  createdAt: Date;
  ipAddress?: string;
  profileViews: number;
}

export interface LinkDoc {
  _id: ObjectId;
  userId: ObjectId;
  url: string;
  title: string;
  icon?: string;
  position: number;
}

export interface ProfileVisitDoc {
  _id: ObjectId;
  userId: ObjectId;
  clientId: string;
  visitedAt: Date;
}

export interface Referral {
  _id: ObjectId;
  referrerId: ObjectId;
  referredUserId: ObjectId;
  timestamp: Date;
}

// ─── MongoDB Connection (Cached) ─────────────────────
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectDB(): Promise<Db> {
  if (cachedDb) return cachedDb;

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI not set in environment variables');
  }

  if (!cachedClient) {
    cachedClient = new MongoClient(process.env.MONGODB_URI);
    await cachedClient.connect();
  }

  cachedDb = cachedClient.db(process.env.MONGODB_DB || 'thebiolink');
  return cachedDb;
}

// ⚠️ Export alias for backward compatibility with API routes
export const connectToDatabase = async () => {
  const db = await connectDB();
  return { client: cachedClient!, db };
};

// ─── Helper: Get Links for User ──────────────────────
async function getUserLinks(userId: ObjectId, db: Db) {
  const links = await db.collection<LinkDoc>('links').find({ userId }).toArray();
  return links
    .map((link) => ({
      id: link._id.toString(),
      url: link.url || '',
      title: link.title || '',
      icon: link.icon || '',
      position: link.position || 0,
    }))
    .sort((a, b) => a.position - b.position);
}

// ─── User Functions ──────────────────────────────────

export async function getUserByUsername(username: string, clientId?: string) {
  const db = await connectDB();
  const user = await db.collection<User>('users').findOne({ username });
  if (!user) return null;

  if (clientId) {
    const existingVisit = await db.collection<ProfileVisitDoc>('profile_visits').findOne({
      userId: user._id,
      clientId,
    });

    if (!existingVisit) {
      await db.collection('users').updateOne(
        { _id: user._id },
        { $inc: { profileViews: 1 } }
      );
      await db.collection<ProfileVisitDoc>('profile_visits').insertOne({
        _id: new ObjectId(),
        userId: user._id,
        clientId,
        visitedAt: new Date(),
      });
    }
  }

  const links = await getUserLinks(user._id, db);

  return {
    _id: user._id.toString(),
    id: user._id.toString(),
    username: user.username,
    name: user.name || '',
    email: user.email || '',
    avatar: user.avatar || '',
    bio: user.bio || '',
    background: user.background || '',
    backgroundVideo: user.backgroundVideo || '',
    backgroundAudio: user.backgroundAudio || '',
    badges: user.badges || [],
    isEmailVerified: user.isEmailVerified || false,
    isBanned: user.isBanned || false,
    bannedAt: user.bannedAt,
    createdAt: user.createdAt.toISOString(),
    profileViews: user.profileViews || 0,
    links,
  };
}

export async function getUserByUsernameForMetadata(username: string) {
  const user = await getUserByUsername(username);
  return user
    ? {
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
      }
    : null;
}

export async function getUserById(id: string) {
  if (!ObjectId.isValid(id)) return null;
  const db = await connectDB();
  const user = await db.collection<User>('users').findOne({ _id: new ObjectId(id) });
  if (!user) return null;

  const links = await getUserLinks(user._id, db);

  return {
    _id: user._id.toString(),
    id: user._id.toString(),
    username: user.username,
    name: user.name || '',
    email: user.email || '',
    avatar: user.avatar || '',
    bio: user.bio || '',
    background: user.background || '',
    backgroundVideo: user.backgroundVideo || '',
    backgroundAudio: user.backgroundAudio || '',
    badges: user.badges || [],
    isEmailVerified: user.isEmailVerified || false,
    isBanned: user.isBanned || false,
    bannedAt: user.bannedAt,
    createdAt: user.createdAt.toISOString(),
    passwordHash: user.passwordHash,
    profileViews: user.profileViews || 0,
    links,
  };
}

export async function getUserByEmail(email: string) {
  const db = await connectDB();
  const user = await db.collection<User>('users').findOne(
    { email },
    { projection: { passwordHash: 1 } }
  );
  if (!user) return null;

  const links = await getUserLinks(user._id, db);

  return {
    _id: user._id.toString(),
    id: user._id.toString(),
    username: user.username,
    name: user.name || '',
    email: user.email || '',
    avatar: user.avatar || '',
    bio: user.bio || '',
    background: user.background || '',
    backgroundVideo: user.backgroundVideo || '',
    backgroundAudio: user.backgroundAudio || '',
    badges: user.badges || [],
    isEmailVerified: user.isEmailVerified || false,
    isBanned: user.isBanned || false,
    bannedAt: user.bannedAt,
    createdAt: user.createdAt.toISOString(),
    passwordHash: user.passwordHash,
    profileViews: user.profileViews || 0,
    links,
  };
}

export async function createUser(
  email: string,
  password: string,
  username: string,
  name: string,
  background: string = '',
  ipAddress: string = 'unknown'
) {
  const db = await connectDB();

  const existingEmail = await db.collection('users').findOne({ email });
  if (existingEmail) throw new Error('Email already registered');

  const existingUsername = await db.collection('users').findOne({ username });
  if (existingUsername) throw new Error('Username already taken');

  const passwordHash = await bcrypt.hash(password, 12);
  const userId = new ObjectId();

  await db.collection<User>('users').insertOne({
    _id: userId,
    email,
    username: username.toLowerCase().trim(),
    name: name.trim(),
    passwordHash,
    background,
    ipAddress,
    badges: [],
    isEmailVerified: true,
    isBanned: false,
    createdAt: new Date(),
    profileViews: 0,
  });

  return {
    id: userId.toString(),
    email,
    username: username.toLowerCase().trim(),
    name: name.trim(),
    background,
    badges: [],
    isEmailVerified: true,
    isBanned: false,
    createdAt: new Date().toISOString(),
    profileViews: 0,
  };
}

// ─── Links ───────────────────────────────────────────

export async function saveUserLinks(userId: string, links: any[]) {
  if (!ObjectId.isValid(userId)) throw new Error('Invalid user ID');
  const db = await connectDB();
  const objectId = new ObjectId(userId);

  await db.collection('links').deleteMany({ userId: objectId });

  if (links.length > 0) {
    const linksToInsert = links
      .map((link: any, index: number) => ({
        _id: new ObjectId(),
        userId: objectId,
        url: (link.url || '').trim(),
        title: (link.title || '').trim(),
        icon: (link.icon || '').trim(),
        position: index,
      }))
      .filter((link) => link.url && link.title);

    if (linksToInsert.length > 0) {
      await db.collection('links').insertMany(linksToInsert);
    }
  }
}

// ─── Profile Updates ─────────────────────────────────

export async function updateUserProfile(userId: string, updates: Partial<User>) {
  if (!ObjectId.isValid(userId)) throw new Error('Invalid user ID');
  const db = await connectDB();
  const objectId = new ObjectId(userId);

  const cleanedUpdates: Partial<User> = {
    name: updates.name?.trim() || '',
    username: updates.username?.trim().toLowerCase() || '',
    avatar: updates.avatar?.trim() || '',
    bio: updates.bio?.trim() || '',
    background: updates.background?.trim() || '',
    backgroundVideo: updates.backgroundVideo?.trim() || '',
    backgroundAudio: updates.backgroundAudio?.trim() || '',
  };

  if (cleanedUpdates.username) {
    const existing = await db.collection<User>('users').findOne({
      username: cleanedUpdates.username,
      _id: { $ne: objectId },
    });
    if (existing) throw new Error('Username already taken');
  }

  const result = await db.collection<User>('users').updateOne(
    { _id: objectId },
    { $set: cleanedUpdates }
  );

  if (result.modifiedCount === 0) {
    throw new Error('User not found or no changes made');
  }

  const updatedUser = await db.collection<User>('users').findOne({ _id: objectId });
  if (!updatedUser) throw new Error('User not found after update');

  const links = await getUserLinks(updatedUser._id, db);

  return {
    _id: updatedUser._id.toString(),
    id: updatedUser._id.toString(),
    username: updatedUser.username,
    name: updatedUser.name || '',
    email: updatedUser.email || '',
    avatar: updatedUser.avatar || '',
    bio: updatedUser.bio || '',
    background: updatedUser.background || '',
    backgroundVideo: updatedUser.backgroundVideo || '',
    backgroundAudio: updatedUser.backgroundAudio || '',
    badges: updatedUser.badges || [],
    isEmailVerified: updatedUser.isEmailVerified || false,
    isBanned: updatedUser.isBanned || false,
    bannedAt: updatedUser.bannedAt,
    createdAt: updatedUser.createdAt.toISOString(),
    passwordHash: updatedUser.passwordHash,
    profileViews: updatedUser.profileViews || 0,
    links,
  };
}

// ─── Badges ──────────────────────────────────────────

export async function addUserBadge(
  userId: string,
  badge: { id: string; name: string; icon: string; awardedAt: string }
) {
  if (!ObjectId.isValid(userId)) throw new Error('Invalid user ID');
  const db = await connectDB();
  await db.collection<User>('users').updateOne(
    { _id: new ObjectId(userId) },
    { $push: { badges: badge } }
  );
}

export async function removeUserBadge(userId: string, badgeId: string) {
  if (!ObjectId.isValid(userId)) throw new Error('Invalid user ID');
  const db = await connectDB();
  await db.collection<User>('users').updateOne(
    { _id: new ObjectId(userId) },
    { $pull: { badges: { id: badgeId } } }
  );
}

export async function getAllUsers() {
  const db = await connectDB();
  const users = await db.collection<User>('users').find({}).toArray();
  return users.map((user) => ({
    id: user._id.toString(),
    email: user.email,
    username: user.username,
    name: user.name || '',
    badges: user.badges || [],
    isBanned: user.isBanned || false,
    bannedAt: user.bannedAt,
    profileViews: user.profileViews || 0,
  }));
}

export async function createBadge(name: string, icon: string) {
  const db = await connectDB();
  const badgeId = new ObjectId().toString();
  await db.collection('badges').insertOne({
    id: badgeId,
    name,
    icon,
    createdAt: new Date().toISOString(),
  });
  return { id: badgeId, name, icon };
}

export async function getAllBadges() {
  const db = await connectDB();
  const badges = await db.collection('badges').find({}).toArray();
  return badges.map((badge: any) => ({
    id: badge.id,
    name: badge.name,
    icon: badge.icon,
  }));
}

export async function banUser(userId: string) {
  if (!ObjectId.isValid(userId)) throw new Error('Invalid user ID');
  const db = await connectDB();
  await db.collection<User>('users').updateOne(
    { _id: new ObjectId(userId) },
    { $set: { isBanned: true, bannedAt: new Date().toISOString() } }
  );
}

export async function unbanUser(userId: string) {
  if (!ObjectId.isValid(userId)) throw new Error('Invalid user ID');
  const db = await connectDB();
  await db.collection<User>('users').updateOne(
    { _id: new ObjectId(userId) },
    { $set: { isBanned: false }, $unset: { bannedAt: '' } }
  );
}

// ─── NEW: Exported functions required by API routes & pages ───────────────

/**
 * Records a profile view for a user from a specific client (deduplicated).
 * Returns true if a new view was recorded.
 */
export async function recordProfileView(userId: string, clientId: string): Promise<boolean> {
  if (!ObjectId.isValid(userId) || !clientId) return false;
  const db = await connectDB();
  const userObjectId = new ObjectId(userId);

  const existing = await db.collection<ProfileVisitDoc>('profile_visits').findOne({
    userId: userObjectId,
    clientId,
  });

  if (existing) return false;

  await db.collection('users').updateOne(
    { _id: userObjectId },
    { $inc: { profileViews: 1 } }
  );

  await db.collection<ProfileVisitDoc>('profile_visits').insertOne({
    _id: new ObjectId(),
    userId: userObjectId,
    clientId,
    visitedAt: new Date(),
  });

  return true;
}

/**
 * Gets the total number of unique profile views (based on profileViews field).
 */
export async function getProfileViewCount(userId: string): Promise<number> {
  if (!ObjectId.isValid(userId)) return 0;
  const db = await connectDB();
  const user = await db.collection<User>('users').findOne(
    { _id: new ObjectId(userId) },
    { projection: { profileViews: 1 } }
  );
  return user?.profileViews || 0;
}

/**
 * Logs a referral event.
 */
export async function logReferral(referrerId: string, referredUserId: string): Promise<void> {
  if (!ObjectId.isValid(referrerId) || !ObjectId.isValid(referredUserId)) {
    throw new Error('Invalid user IDs');
  }
  const db = await connectDB();
  await db.collection<Referral>('referrals').insertOne({
    _id: new ObjectId(),
    referrerId: new ObjectId(referrerId),
    referredUserId: new ObjectId(referredUserId),
    timestamp: new Date(),
  });
}

/**
 * Gets referral stats for all users.
 */
export async function getReferralStats() {
  const db = await connectDB();
  const allUsers = await db
    .collection<User>('users')
    .find({}, { projection: { _id: 1, username: 1 } })
    .toArray();

  const referralCounts = await db
    .collection<Referral>('referrals')
    .aggregate([{ $group: { _id: '$referrerId', count: { $sum: 1 } } }])
    .toArray();

  const countMap = new Map<string, number>();
  referralCounts.forEach((item) => countMap.set(item._id.toString(), item.count));

  return allUsers.map((user) => ({
    userId: user._id.toString(),
    username: user.username || 'unknown',
    usageCount: countMap.get(user._id.toString()) || 0,
  }));
}

/**
 * Gets the latest announcement.
 */
export async function getLatestAnnouncement() {
  const db = await connectDB();
  return db
    .collection('announcements')
    .findOne({}, { sort: { createdAt: -1 } });
}

/**
 * Sends a new announcement.
 */
export async function sendAnnouncement(content: string, authorId: string) {
  const db = await connectDB();
  const result = await db.collection('announcements').insertOne({
    content,
    authorId,
    createdAt: new Date(),
  });
  return {
    _id: result.insertedId,
    content,
    authorId,
    createdAt: new Date(),
  };
}
