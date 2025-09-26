// lib/storage.ts
import { MongoClient, ObjectId, Db } from 'mongodb';
import bcrypt from 'bcryptjs';
import { containsProhibitedWords, containsIPPatterns, isBlacklistedIP, banUserAutomatically, addToBlacklist } from '@/lib/moderation';

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

// --- User Schema Interface ---
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
  banReason?: string;
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
    createdAt: user.createdAt || new Date().toISOString(),
    isBanned: user.isBanned || false, // ✅ Include ban status
    bannedAt: user.bannedAt, // ✅ Include ban timestamp
    banReason: user.banReason, // ✅ Include ban reason
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
      createdAt: user.createdAt || new Date().toISOString(),
      passwordHash: user.passwordHash,
      isBanned: user.isBanned || false, // ✅ Include ban status
      bannedAt: user.bannedAt, // ✅ Include ban timestamp
      banReason: user.banReason, // ✅ Include ban reason
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

  // --- Automoderation: Check IP ---
  if (isBlacklistedIP(ipAddress)) {
    throw new Error('Access denied');
  }

  // --- Automoderation: Check prohibited words and IP patterns ---
  if (
    containsProhibitedWords(username) || 
    containsProhibitedWords(name) ||
    containsIPPatterns(username) || 
    containsIPPatterns(name)
  ) {
    // Auto-ban IP and throw error
    await addToBlacklist(ipAddress);
    throw new Error('Prohibited content detected');
  }

  const existingEmail = await database.collection('users').findOne({ email });
  if (existingEmail) throw new Error('Email already registered');

  const existingUsername = await database.collection('users').findOne({ username });
  if (existingUsername) throw new Error('Username already taken');

  const passwordHash = await bcrypt.hash(password, 12);
  const userId = new ObjectId();

  await database.collection('users').insertOne({
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
    background, // ✅ Return background
    badges: [], // ✅ Return empty badges
    isEmailVerified: true,
    isBanned: false, // ✅ Return not banned
    createdAt: new Date().toISOString()
  };
}

export async function getUserByEmail(email: string) {
  const database = await connectDB();
  const user = await database.collection('users').findOne(
    { email }, 
    { projection: { passwordHash: 1, isBanned: 1, banReason: 1 } } // ✅ Include ban fields
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
    createdAt: user.createdAt || new Date().toISOString(),
    passwordHash: user.passwordHash,
    isBanned: user.isBanned || false, // ✅ Include ban status
    bannedAt: user.bannedAt, // ✅ Include ban timestamp
    banReason: user.banReason // ✅ Include ban reason
  };
}

export async function saveUserLinks(userId: string, links: any[]) {
  const database = await connectDB();
  const objectId = new ObjectId(userId);

  // --- Automoderation: Check IP patterns in links ---
  for (const link of links) {
    if (containsIPPatterns(link.url) || containsIPPatterns(link.title)) {
      // Auto-ban user and throw error
      await banUserAutomatically(userId, 'IP pattern detected in link');
      throw new Error('IP pattern detected in link');
    }
  }

  await database.collection('links').deleteMany({ userId: objectId });

  if (links.length > 0) {
    const linksToInsert = links.map((link: any, index: number) => ({
      _id: new ObjectId(),
      userId: objectId,
      url: link.url.trim(),
      title: link.title.trim(),
      icon: link.icon?.trim() || '',
      position: index
    }));

    const validLinks = linksToInsert.filter(link => link.url && link.title);

    if (validLinks.length > 0) {
      await database.collection('links').insertMany(validLinks);
    }
  }
}

// ✅ FIXED updateUserProfile with null check and IP pattern detection
export async function updateUserProfile(userId: string, updates: any) {
  const database = await connectDB();
  const objectId = new ObjectId(userId);

  // --- Automoderation: Check prohibited words and IP patterns ---
  if (
    containsProhibitedWords(updates.username) || 
    containsProhibitedWords(updates.name) ||
    containsProhibitedWords(updates.bio) ||
    containsIPPatterns(updates.username) || 
    containsIPPatterns(updates.name) ||
    containsIPPatterns(updates.bio)
  ) {
    // Auto-ban user and throw error
    await banUserAutomatically(userId, 'Prohibited content or IP pattern detected');
    throw new Error('Prohibited content or IP pattern detected');
  }

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
    createdAt: updatedUserDocument.createdAt || new Date().toISOString(),
    passwordHash: updatedUserDocument.passwordHash,
    isBanned: updatedUserDocument.isBanned || false, // ✅ Return ban status
    bannedAt: updatedUserDocument.bannedAt, // ✅ Return ban timestamp
    banReason: updatedUserDocument.banReason, // ✅ Return ban reason
    links: links.map((link: any) => ({
      id: link._id.toString(),
      url: link.url || '',
      title: link.title || '',
      icon: link.icon || '',
      position: link.position || 0
    })).sort((a: any, b: any) => a.position - b.position)
  };
}
