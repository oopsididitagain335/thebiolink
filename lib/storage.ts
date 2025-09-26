// lib/storage.ts
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

let client: MongoClient;
let db: any;

async function connectDB() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    db = client.db();
  }
  return db;
}

export async function getUserByEmail(email: string) {
  const database = await connectDB();
  const user = await database.collection('users').findOne({ email: email.toLowerCase() });
  return user ? { ...user, id: user._id.toString() } : null;
}

export async function getUserById(id: string) {
  const database = await connectDB();
  const user = await database.collection('users').findOne({ _id: new ObjectId(id) });
  return user ? { ...user, id: user._id.toString() } : null;
}

export async function getUserByUsername(username: string) {
  const database = await connectDB();
  const user = await database.collection('users').findOne({ username: username.toLowerCase() });
  return user ? { ...user, id: user._id.toString() } : null;
}

export async function createUser(email: string, password: string, username: string, name: string) {
  const database = await connectDB();
  const existingEmail = await database.collection('users').findOne({ email: email.toLowerCase() });
  if (existingEmail) throw new Error('Email already registered');

  const existingUsername = await database.collection('users').findOne({ username: username.toLowerCase() });
  if (existingUsername) throw new Error('Username already taken');

  const passwordHash = await bcrypt.hash(password, 12);
  const userId = new ObjectId();

  await database.collection('users').insertOne({
    _id: userId,
    email: email.toLowerCase(),
    passwordHash,
    username: username.toLowerCase(),
    name,
    avatar: '',
    bio: '',
    isEmailVerified: true, // Auto-verified
    createdAt: new Date().toISOString(),
    badgeOption: null,
    badgePaid: false,
    badgePurchaseTimestamp: null
  });

  return { id: userId.toString(), email, username, name, avatar: '', bio: '', isEmailVerified: true, createdAt: new Date().toISOString(), badgeOption: null, badgePaid: false, badgePurchaseTimestamp: null };
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

  const updatedUser = await database.collection('users').findOne({ _id: objectId });
  if (!updatedUser) throw new Error('Failed to retrieve updated user');

  const links = await database.collection('links').find({ userId: objectId }).toArray();

  return {
    _id: updatedUser._id.toString(),
    id: updatedUser._id.toString(),
    username: updatedUser.username,
    name: updatedUser.name || '',
    email: updatedUser.email || '',
    avatar: updatedUser.avatar || '',
    bio: updatedUser.bio || '',
    isEmailVerified: updatedUser.isEmailVerified || false,
    createdAt: updatedUser.createdAt || new Date().toISOString(),
    background: updatedUser.background || '',
    links: links.map((link: any) => ({
      id: link._id.toString(),
      url: link.url || '',
      title: link.title || '',
      icon: link.icon || '',
      position: link.position || 0
    })),
    badgeOption: updatedUser.badgeOption || null,
    badgePaid: updatedUser.badgePaid || false,
    badgePurchaseTimestamp: updatedUser.badgePurchaseTimestamp || null
  };
}

export async function saveUserLinks(userId: string, links: any[]) {
  const database = await connectDB();
  const objectId = new ObjectId(userId);

  const cleanedLinks = links
    .filter((link) => link.url?.trim() && link.title?.trim())
    .map((link, index) => ({
      _id: link.id ? new ObjectId(link.id) : new ObjectId(),
      userId: objectId,
      url: link.url.trim(),
      title: link.title.trim(),
      icon: link.icon?.trim() || '',
      position: index
    }));

  await database.collection('links').deleteMany({ userId: objectId });
  if (cleanedLinks.length > 0) {
    await database.collection('links').insertMany(cleanedLinks);
  }

  return links.map((link, index) => ({
    id: link.id || cleanedLinks[index]._id.toString(),
    url: link.url,
    title: link.title,
    icon: link.icon,
    position: index
  }));
}

export async function getUserBadgeInfo(userId: string) {
  const database = await connectDB();
  const user = await database.collection('users').findOne(
    { _id: new ObjectId(userId) },
    { projection: { badgeOption: 1, badgePaid: 1, badgePurchaseTimestamp: 1 } }
  );

  if (!user) {
    return null;
  }

  return {
    option: user.badgeOption || null,
    paid: user.badgePaid === true,
    purchaseTimestamp: user.badgePurchaseTimestamp || null
  };
}

export async function updateUserBadge(userId: string, option: string) {
  const database = await connectDB();
  await database.collection('users').updateOne(
    { _id: new ObjectId(userId) },
    { $set: { badgeOption: option, badgePaid: true, badgePurchaseTimestamp: new Date().toISOString() } }
  );
}

export async function getAllUsers() {
  const database = await connectDB();
  const users = await database.collection('users').find({}).toArray();
  return users.map(user => ({ ...user, id: user._id.toString() }));
}
