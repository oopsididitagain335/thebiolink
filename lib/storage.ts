// lib/storage.ts
import { MongoClient, ObjectId, Db } from 'mongodb';
import bcrypt from 'bcryptjs';

let client: MongoClient;
let db: Db;

// Define a User type based on your MongoDB schema
interface User {
  _id: ObjectId;
  id?: string; // Added for the toString() conversion
  email: string;
  passwordHash: string;
  username: string;
  name: string;
  avatar: string;
  bio: string;
  background: string;
  isEmailVerified: boolean;
  createdAt: string;
  badgeOption: string | null;
  badgePaid: boolean;
  badgePurchaseTimestamp: string | null;
  signupIp?: string;
}

// Define a Link type for the links collection
interface Link {
  _id: ObjectId;
  userId: ObjectId;
  url: string;
  title: string;
  icon: string;
  position: number;
}

// Define the shape of profile updates
interface ProfileUpdateData {
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  background?: string;
}

async function connectDB(): Promise<Db> {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    db = client.db();
  }
  return db;
}

export async function getUserByEmail(email: string) {
  const database = await connectDB();
  const user = await database.collection<User>('users').findOne({ email: email.toLowerCase() });
  if (!user) return null;
  const links = await database.collection<Link>('links').find({ userId: user._id }).toArray();
  return {
    ...user,
    id: user._id.toString(),
    links: links.map((link) => ({
      id: link._id.toString(),
      url: link.url || '',
      title: link.title || '',
      icon: link.icon || '',
    })),
  };
}

export async function getUserById(id: string) {
  const database = await connectDB();
  const user = await database.collection<User>('users').findOne({ _id: new ObjectId(id) });
  if (!user) return null;
  const links = await database.collection<Link>('links').find({ userId: user._id }).toArray();
  return {
    ...user,
    id: user._id.toString(),
    links: links.map((link) => ({
      id: link._id.toString(),
      url: link.url || '',
      title: link.title || '',
      icon: link.icon || '',
    })),
  };
}

export async function getUserByUsername(username: string) {
  const database = await connectDB();
  const user = await database.collection<User>('users').findOne({ username: username.toLowerCase() });
  if (!user) return null;
  const links = await database.collection<Link>('links').find({ userId: user._id }).toArray();
  return {
    ...user,
    id: user._id.toString(),
    links: links.map((link) => ({
      id: link._id.toString(),
      url: link.url || '',
      title: link.title || '',
      icon: link.icon || '',
    })),
  };
}

export async function createUser(email: string, password: string, username: string, name: string, background: string = '', ip: string = '') {
  const database = await connectDB();
  const existingEmail = await database.collection<User>('users').findOne({ email: email.toLowerCase() });
  if (existingEmail) throw new Error('Email already registered');
  const existingUsername = await database.collection<User>('users').findOne({ username: username.toLowerCase() });
  if (existingUsername) throw new Error('Username already taken');
  const passwordHash = await bcrypt.hash(password, 12);
  const userId = new ObjectId();
  await database.collection<User>('users').insertOne({
    _id: userId,
    email: email.toLowerCase(),
    passwordHash,
    username: username.toLowerCase(),
    name,
    avatar: '',
    bio: '',
    background: background || '',
    isEmailVerified: true,
    createdAt: new Date().toISOString(),
    badgeOption: null,
    badgePaid: false,
    badgePurchaseTimestamp: null,
    signupIp: ip,
  });
  return {
    id: userId.toString(),
    email,
    username,
    name,
    avatar: '',
    bio: '',
    background: background || '',
    isEmailVerified: true,
    createdAt: new Date().toISOString(),
    badgeOption: null,
    badgePaid: false,
    badgePurchaseTimestamp: null,
    links: [], // Initialize empty links array
  };
}

export async function updateUserProfile(userId: string, updates: ProfileUpdateData) {
  const database = await connectDB();
  const objectId = new ObjectId(userId);
  const cleanedUpdates: Partial<User> = {
    name: updates.name?.trim() || '',
    username: updates.username?.trim().toLowerCase() || '',
    avatar: updates.avatar?.trim() || '',
    bio: updates.bio?.trim() || '',
    background: updates.background?.trim() || '',
  };
  if (cleanedUpdates.username) {
    const existing = await database.collection<User>('users').findOne({
      username: cleanedUpdates.username,
      _id: { $ne: objectId },
    });
    if (existing) throw new Error('Username already taken');
  }
  await database.collection<User>('users').updateOne(
    { _id: objectId },
    { $set: cleanedUpdates }
  );
  const updatedUser = await database.collection<User>('users').findOne({ _id: objectId });
  if (!updatedUser) throw new Error('Failed to retrieve updated user');
  const links = await database.collection<Link>('links').find({ userId: objectId }).toArray();
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
    links: links.map((link) => ({
      id: link._id.toString(),
      url: link.url || '',
      title: link.title || '',
      icon: link.icon || '',
      position: link.position || 0,
    })),
    badgeOption: updatedUser.badgeOption || null,
    badgePaid: updatedUser.badgePaid || false,
    badgePurchaseTimestamp: updatedUser.badgePurchaseTimestamp || null,
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
      position: index,
    }));
  await database.collection<Link>('links').deleteMany({ userId: objectId });
  if (cleanedLinks.length > 0) {
    await database.collection<Link>('links').insertMany(cleanedLinks);
  }
  return links.map((link, index) => ({
    id: link.id || cleanedLinks[index]?._id.toString(),
    url: link.url,
    title: link.title,
    icon: link.icon,
    position: index,
  }));
}

export async function getUserBadgeInfo(userId: string) {
  const database = await connectDB();
  const user = await database.collection<User>('users').findOne(
    { _id: new ObjectId(userId) },
    { projection: { badgeOption: 1, badgePaid: 1, badgePurchaseTimestamp: 1 } }
  );
  if (!user) return null;
  return {
    option: user.badgeOption || null,
    paid: user.badgePaid === true,
    purchaseTimestamp: user.badgePurchaseTimestamp || null,
  };
}

export async function updateUserBadge(userId: string, option: string) {
  const database = await connectDB();
  await database.collection<User>('users').updateOne(
    { _id: new ObjectId(userId) },
    { $set: { badgeOption: option, badgePaid: true, badgePurchaseTimestamp: new Date().toISOString() } }
  );
}

export async function getAllUsers() {
  const database = await connectDB();
  const users = await database.collection<User>('users').find({}).toArray();
  return users.map((user: User) => ({
    ...user,
    id: user._id.toString(),
    links: [], // Not fetching links for all users to avoid performance issues
  }));
}
