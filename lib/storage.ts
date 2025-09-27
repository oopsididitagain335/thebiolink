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

// --- USER FUNCTIONS ---

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
    background: user.background || '',
    badges: user.badges || [],
    isEmailVerified: user.isEmailVerified || false,
    isBanned: user.isBanned || false,
    bannedAt: user.bannedAt,
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
      background: user.background || '',
      badges: user.badges || [],
      isEmailVerified: user.isEmailVerified || false,
      isBanned: user.isBanned || false,
      bannedAt: user.bannedAt,
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
    background,
    ipAddress,
    badges: [],
    isEmailVerified: true,
    isBanned: false,
    createdAt: new Date()
  });

  return {
    id: userId.toString(),
    email,
    username,
    name,
    background,
    badges: [],
    isEmailVerified: true,
    isBanned: false,
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
    background: user.background || '',
    badges: user.badges || [],
    isEmailVerified: user.isEmailVerified || false,
    isBanned: user.isBanned || false,
    bannedAt: user.bannedAt,
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

  const updatedUserDocument = await database.collection('users').findOne({ _id: objectId });
  if (!updatedUserDocument) {
    console.error(`Failed to retrieve user after update for ID: ${userId}`);
    throw new Error('User not found after update');
  }

  const links = await database.collection('links').find({ userId: objectId }).toArray();

  return {
    _id: updatedUserDocument._id.toString(),
    id: updatedUserDocument._id.toString(),
    username: updatedUserDocument.username,
    name: updatedUserDocument.name || '',
    email: updatedUserDocument.email || '',
    avatar: updatedUserDocument.avatar || '',
    bio: updatedUserDocument.bio || '',
    background: updatedUserDocument.background || '',
    badges: updatedUserDocument.badges || [],
    isEmailVerified: updatedUserDocument.isEmailVerified || false,
    isBanned: updatedUserDocument.isBanned || false,
    bannedAt: updatedUserDocument.bannedAt,
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

export async function getAllUsers() {
  const database = await connectDB();
  const users = await database.collection('users').find({}).toArray();

  return users.map((user: any) => ({
    id: user._id.toString(),
    email: user.email,
    username: user.username,
    name: user.name || '',
    badges: user.badges || [],
    isBanned: user.isBanned || false,
    bannedAt: user.bannedAt
  }));
}

export async function banUser(userId: string) {
  const database = await connectDB();
  const objectId = new ObjectId(userId);

  await database.collection('users').updateOne(
    { _id: objectId },
    { $set: { isBanned: true, bannedAt: new Date().toISOString() } }
  );
}

export async function unbanUser(userId: string) {
  const database = await connectDB();
  const objectId = new ObjectId(userId);

  await database.collection('users').updateOne(
    { _id: objectId },
    { $set: { isBanned: false }, $unset: { bannedAt: "" } }
  );
}

export async function addUserBadge(userId: string, badge: any) {
  const database = await connectDB();
  const objectId = new ObjectId(userId);

  await database.collection('users').updateOne(
    { _id: objectId },
    { $push: { badges: badge } }
  );
}

export async function removeUserBadge(userId: string, badgeId: string) {
  const database = await connectDB();
  const objectId = new ObjectId(userId);

  await database.collection('users').updateOne(
    { _id: objectId },
    { $pull: { badges: { id: badgeId } } as any } // ✅ fixed here
  );
}

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

export async function getAllBadges() {
  const database = await connectDB();
  const badges = await database.collection('badges').find({}).toArray();

  return badges.map((badge: any) => ({
    id: badge.id,
    name: badge.name,
    icon: badge.icon
  }));
}

// --- VIEW COUNT FUNCTIONS ---

export async function getViewCount(username: string) {
  const database = await connectDB();
  
  try {
    const viewDoc = await database.collection('views').findOne({ username });
    return viewDoc ? viewDoc.count : 0;
  } catch {
    return 0;
  }
}

export async function incrementViewCount(username: string) {
  const database = await connectDB();
  
  try {
    const result = await database.collection('views').updateOne(
      { username },
      { $inc: { count: 1 } },
      { upsert: true }
    );
    
    if (result.modifiedCount === 0 && result.upsertedCount === 1) {
      return 1;
    }
    
    const viewDoc = await database.collection('views').findOne({ username });
    return viewDoc ? viewDoc.count : 1;
  } catch {
    return 0;
  }
}

export async function getAllViewCounts() {
  const database = await connectDB();
  
  try {
    const views = await database.collection('views').find({}).toArray();
    return views.map((view: any) => ({
      username: view.username,
      count: view.count || 0
    }));
  } catch {
    return [];
  }
}

export async function resetViewCount(username: string) {
  const database = await connectDB();
  
  try {
    await database.collection('views').deleteOne({ username });
    return true;
  } catch {
    return false;
  }
}
