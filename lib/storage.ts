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

// --- User Functions (Node.js only) ---

export async function getUserByUsername(username: string) {
  const database = await connectDB();
  const user = await database.collection('users').findOne({ username });
  if (!user) return null;

  const links = await database.collection('links').find({ userId: user._id }).toArray();

  return {
    _id: user._id.toString(),
    id: user._id.toString(),
    username: user.username,
    name: user.name || '',
    email: user.email || '',
    avatar: user.avatar || '',
    bio: user.bio || '',
    background: user.background || '', // ✅ Background field
    isEmailVerified: user.isEmailVerified || false,
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
    const user = await database.collection('users').findOne({ _id: new ObjectId(id) });
    if (!user) return null;

    const links = await database.collection('links').find({ userId: user._id }).toArray();

    return {
      _id: user._id.toString(),
      id: user._id.toString(),
      username: user.username,
      name: user.name || '',
      email: user.email || '',
      avatar: user.avatar || '',
      bio: user.bio || '',
      background: user.background || '', // ✅ Background field
      isEmailVerified: user.isEmailVerified || false,
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
    background, // ✅ Save background
    ipAddress,
    isEmailVerified: true,
    createdAt: new Date()
  });

  return {
    id: userId.toString(),
    email,
    username,
    name,
    background, // ✅ Return background
    isEmailVerified: true,
    createdAt: new Date().toISOString()
  };
}

export async function getUserByEmail(email: string) {
  const database = await connectDB();
  const user = await database.collection('users').findOne(
    { email },
    { projection: { passwordHash: 1 } }
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
    background: user.background || '', // ✅ Return background
    isEmailVerified: user.isEmailVerified || false,
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

// ✅ FIXED updateUserProfile with proper null check and background handling
export async function updateUserProfile(userId: string, updates: any) {
  const database = await connectDB();
  const objectId = new ObjectId(userId);

  const cleanedUpdates = {
    name: updates.name?.trim() || '',
    username: updates.username?.trim().toLowerCase() || '',
    avatar: updates.avatar?.trim() || '',
    bio: updates.bio?.trim() || '',
    background: updates.background?.trim() || '' // ✅ Handle background
  };

  if (cleanedUpdates.username) {
    const existing = await database.collection('users').findOne({
      username: cleanedUpdates.username,
      _id: { $ne: objectId }
    });
    if (existing) throw new Error('Username already taken');
  }

  await database.collection('users').updateOne(
    { _id: objectId },
    { $set: cleanedUpdates }
  );

  // --- Crucial: Fetch the updated user document ---
  const updatedUserDocument = await database.collection('users').findOne({ _id: objectId });

  // --- Crucial: Null check for updatedUserDocument ---
  if (!updatedUserDocument) {
    // This is an unexpected error, but TS requires the check.
    console.error(`Failed to retrieve user after update for ID: ${userId}`);
    throw new Error('User not found after update');
  }
  // --- End Null Check ---

  const links = await database.collection('links').find({ userId: objectId }).toArray();

  // --- Return the updated user data including background ---
  return {
    _id: updatedUserDocument._id.toString(),
    id: updatedUserDocument._id.toString(),
    username: updatedUserDocument.username,
    name: updatedUserDocument.name || '',
    email: updatedUserDocument.email || '',
    avatar: updatedUserDocument.avatar || '',
    bio: updatedUserDocument.bio || '',
    background: updatedUserDocument.background || '', // ✅ Return background
    isEmailVerified: updatedUserDocument.isEmailVerified || false,
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
