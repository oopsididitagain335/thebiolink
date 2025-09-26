// lib/storage.ts
import { MongoClient, ObjectId, Db } from 'mongodb';
import bcrypt from 'bcryptjs';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectDB() {
  if (cachedDb) return cachedDb;

  if (!cachedClient) {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not set in environment variables');
    }
    cachedClient = new MongoClient(process.env.MONGODB_URI);
    await cachedClient.connect();
  }

  if (!cachedDb) {
    cachedDb = cachedClient.db();
  }

  return cachedDb;
}

// --- Update UserDoc Interface to include ban fields ---
interface UserDoc {
  _id: ObjectId;
  email: string;
  username: string;
  name: string;
  passwordHash: string;
  avatar?: string;
  bio?: string;
  background?: string;
  badges: Array<{
    id: string;
    name: string;
    icon: string;
    awardedAt: string;
  }>;
  isEmailVerified: boolean;
  createdAt: Date;
  ipAddress?: string;
  // ✅ Add ban fields
  isBanned?: boolean;
  bannedAt?: string;
}

interface LinkDoc {
  _id: ObjectId;
  userId: ObjectId;
  url: string;
  title: string;
  icon?: string;
  position: number;
}

// --- Existing User Functions (unchanged) ---

export async function getUserByUsername(username: string) {
  const database = await connectDB();
  const user = await database.collection<UserDoc>('users').findOne({ username });
  if (!user) return null;

  const links = await database.collection<LinkDoc>('links').find({ userId: user._id }).toArray();

  return {
    _id: user._id.toString(),
    id: user._id.toString(),
    username: user.username,
    name: user.name || '',
    email: user.email || '',
    avatar: user.avatar || '',
    bio: user.bio || '',
    background: user.background || '',
    badges: user.badges || [],
    isEmailVerified: user.isEmailVerified || false,
    isBanned: user.isBanned || false, // ✅ Include ban status
    bannedAt: user.bannedAt, // ✅ Include ban timestamp
    createdAt: user.createdAt || new Date().toISOString(),
    links: links.map((link: any) => ({
      id: link._id.toString(),
      url: link.url || '',
      title: link.title || '',
      icon: link.icon || '',
      position: link.position || 0
    })).sort((a: any, b: any) => a.position - b.position)
  };
}

export async function getUserById(id: string) {
  const database = await connectDB();
  try {
    const user = await database.collection<UserDoc>('users').findOne({ _id: new ObjectId(id) });
    if (!user) return null;

    const links = await database.collection<LinkDoc>('links').find({ userId: user._id }).toArray();

    return {
      _id: user._id.toString(),
      id: user._id.toString(),
      username: user.username,
      name: user.name || '',
      email: user.email || '',
      avatar: user.avatar || '',
      bio: user.bio || '',
      background: user.background || '',
      badges: user.badges || [],
      isEmailVerified: user.isEmailVerified || false,
      isBanned: user.isBanned || false, // ✅ Include ban status
      bannedAt: user.bannedAt, // ✅ Include ban timestamp
      createdAt: user.createdAt || new Date().toISOString(),
      passwordHash: user.passwordHash,
      links: links.map((link: any) => ({
        id: link._id.toString(),
        url: link.url || '',
        title: link.title || '',
        icon: link.icon || '',
        position: link.position || 0
      })).sort((a: any, b: any) => a.position - b.position)
    };
  } catch {
    return null;
  }
}

export async function createUser(email: string, password: string, username: string, name: string, background: string = '', ipAddress: string) {
  const database = await connectDB();

  const existingEmail = await database.collection<UserDoc>('users').findOne({ email });
  if (existingEmail) throw new Error('Email already registered');

  const existingUsername = await database.collection<UserDoc>('users').findOne({ username });
  if (existingUsername) throw new Error('Username already taken');

  const passwordHash = await bcrypt.hash(password, 12);
  const userId = new ObjectId();

  await database.collection<UserDoc>('users').insertOne({
    _id: userId,
    email,
    username,
    name,
    passwordHash,
    background,
    ipAddress,
    badges: [], // ✅ Initialize empty badges
    isEmailVerified: true,
    isBanned: false, // ✅ Initialize not banned
    createdAt: new Date()
  } as UserDoc); // Type assertion to help with complex nested types

  return {
    id: userId.toString(),
    email,
    username,
    name,
    background,
    badges: [], // ✅ Return empty badges
    isEmailVerified: true,
    isBanned: false, // ✅ Return not banned
    createdAt: new Date().toISOString()
  };
}

export async function getUserByEmail(email: string) {
  const database = await connectDB();
  const user = await database.collection<UserDoc>('users').findOne(
    { email },
    { projection: { passwordHash: 1, isBanned: 1 } } // ✅ Include isBanned in projection
  );
  if (!user) return null;

  return {
    _id: user._id.toString(),
    id: user._id.toString(),
    username: user.username,
    name: user.name || '',
    email: user.email || '',
    avatar: user.avatar || '',
    bio: user.bio || '',
    background: user.background || '',
    badges: user.badges || [],
    isEmailVerified: user.isEmailVerified || false,
    isBanned: user.isBanned || false, // ✅ Include ban status
    bannedAt: user.bannedAt, // ✅ Include ban timestamp
    createdAt: user.createdAt || new Date().toISOString(),
    passwordHash: user.passwordHash
  };
}

export async function saveUserLinks(userId: string, links: any[]) {
  const database = await connectDB();
  const objectId = new ObjectId(userId);

  await database.collection('links').deleteMany({ userId: objectId });

  if (links.length > 0) {
    const linksToInsert = links.map((link: any, index: number) => ({
      _id: new ObjectId(),
      userId: objectId,
      url: link.url?.trim() || '',
      title: link.title?.trim() || '',
      icon: link.icon?.trim() || '',
      position: index
    }));

    const validLinks = linksToInsert.filter(link => link.url && link.title);

    if (validLinks.length > 0) {
      await database.collection('links').insertMany(validLinks);
    }
  }
}

// ✅ FIXED updateUserProfile with null check and badge support
export async function updateUserProfile(userId: string, updates: any) {
  const database = await connectDB();
  const objectId = new ObjectId(userId);

  const cleanedUpdates = {
    name: updates.name?.trim() || '',
    username: updates.username?.trim().toLowerCase() || '',
    avatar: updates.avatar?.trim() || '',
    bio: updates.bio?.trim() || '',
    background: updates.background?.trim() || ''
  };

  if (cleanedUpdates.username) {
    const existing = await database.collection<UserDoc>('users').findOne({
      username: cleanedUpdates.username,
      _id: { $ne: objectId }
    });
    if (existing) throw new Error('Username already taken');
  }

  await database.collection<UserDoc>('users').updateOne(
    { _id: objectId },
    { $set: cleanedUpdates }
  );

  // --- Crucial: Fetch the updated user document ---
  const updatedUserDocument = await database.collection<UserDoc>('users').findOne({ _id: objectId });

  // --- Crucial: Null check for updatedUserDocument ---
  if (!updatedUserDocument) {
    console.error(`Failed to retrieve user after update for ID: ${userId}`);
    throw new Error('User not found after update');
  }
  // --- End Null Check ---

  const links = await database.collection<LinkDoc>('links').find({ userId: objectId }).toArray();

  // --- Return the updated user data including background and badges ---
  return {
    _id: updatedUserDocument._id.toString(),
    id: updatedUserDocument._id.toString(),
    username: updatedUserDocument.username,
    name: updatedUserDocument.name || '',
    email: updatedUserDocument.email || '',
    avatar: updatedUserDocument.avatar || '',
    bio: updatedUserDocument.bio || '',
    background: updatedUserDocument.background || '',
    badges: updatedUserDocument.badges || [], // ✅ Return badges
    isEmailVerified: updatedUserDocument.isEmailVerified || false,
    isBanned: updatedUserDocument.isBanned || false, // ✅ Return ban status
    bannedAt: updatedUserDocument.bannedAt, // ✅ Return ban timestamp
    createdAt: updatedUserDocument.createdAt || new Date().toISOString(),
    passwordHash: updatedUserDocument.passwordHash,
    links: links.map((link: any) => ({
      id: link._id.toString(),
      url: link.url || '',
      title: link.title || '',
      icon: link.icon || '',
      position: link.position || 0
    })).sort((a: any, b: any) => a.position - b.position)
  };
}

// --- ADMIN PANEL FUNCTIONS ---

// ✅ FIXED addUserBadge with correct $push syntax
export async function addUserBadge(
  userId: string,
  badge: { id: string; name: string; icon: string; awardedAt: string }
) {
  const database = await connectDB();
  const userObjectId = new ObjectId(userId);

  // ✅ Fix: Use $each to satisfy MongoDB driver types
  await database.collection<UserDoc>('users').updateOne(
    { _id: userObjectId },
    { $push: { badges: { $each: [badge] } } } // <- Key change
  );
}

// Remove badge from user
export async function removeUserBadge(userId: string, badgeId: string) {
  const database = await connectDB();
  const userObjectId = new ObjectId(userId);

  await database.collection<UserDoc>('users').updateOne(
    { _id: userObjectId },
    { $pull: { badges: { id: badgeId } } }
  );
}

// ✅ Get all users (admin only) - UPDATED TO INCLUDE BAN STATUS
export async function getAllUsers() {
  const database = await connectDB();
  const users = await database.collection<UserDoc>('users').find({}).toArray();

  return users.map((user) => ({
    id: user._id.toString(),
    email: user.email,
    username: user.username,
    name: user.name,
    badges: user.badges || [],
    isBanned: user.isBanned || false, // ✅ Include ban status
    bannedAt: user.bannedAt // ✅ Include ban timestamp
  }));
}

// Create new badge
export async function createBadge(name: string, icon: string) {
  const database = await connectDB();
  const badgeId = new ObjectId().toString();

  await database.collection('badges').insertOne({
    id: badgeId,
    name,
    icon,
    createdAt: new Date().toISOString()
  });

  return { id: badgeId, name, icon };
}

// Get all available badges
export async function getAllBadges() {
  const database = await connectDB();
  const badges = await database.collection('badges').find({}).toArray();

  return badges.map((badge: any) => ({
    id: badge.id,
    name: badge.name,
    icon: badge.icon
  }));
}

// ✅ NEW: Ban a user
export async function banUser(userId: string) {
  const database = await connectDB();
  const objectId = new ObjectId(userId);

  await database.collection<UserDoc>('users').updateOne(
    { _id: objectId },
    { $set: { isBanned: true, bannedAt: new Date().toISOString() } }
  );
}

// ✅ NEW: Unban a user
export async function unbanUser(userId: string) {
  const database = await connectDB();
  const objectId = new ObjectId(userId);

  await database.collection<UserDoc>('users').updateOne(
    { _id: objectId },
    { $set: { isBanned: false }, $unset: { bannedAt: "" } }
  );
}
