// lib/storage.ts
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

let client: MongoClient;
let db: any;

async function connectDB() {
  if (!client) {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not set');
    }
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db();
  }
  return db;
}

// Get user by username (for public bio pages)
export async function getUserByUsername(username: string) {
  const database = await connectDB();
  const user = await database.collection('users').findOne({ username });
  
  if (!user) return null;
  
  const links = await database.collection('links').find({ userId: user._id }).toArray();
  
  return {
    name: user.name || '',
    avatar: user.avatar || '',
    bio: user.bio || '',
    links: links.map((link: any) => ({
      id: link._id.toString(),
      url: link.url,
      title: link.title,
      icon: link.icon,
      position: link.position
    })).sort((a: any, b: any) => a.position - b.position)
  };
}

// Create new user
export async function createUser(email: string, password: string, username: string, name: string) {
  const database = await connectDB();
  
  // Check for existing email
  const existingEmail = await database.collection('users').findOne({ email });
  if (existingEmail) {
    throw new Error('Email already registered');
  }
  
  // Check for existing username
  const existingUsername = await database.collection('users').findOne({ username });
  if (existingUsername) {
    throw new Error('Username already taken');
  }
  
  const passwordHash = await bcrypt.hash(password, 12);
  const userId = new ObjectId();
  
  await database.collection('users').insertOne({
    _id: userId,
    email,
    username,
    name,
    passwordHash,
    isEmailVerified: false,
    emailVerificationToken: userId.toString(),
    createdAt: new Date()
  });
  
  return { id: userId.toString(), email, username, name };
}

// Get user by email (for login)
export async function getUserByEmail(email: string) {
  const database = await connectDB();
  return await database.collection('users').findOne({ email });
}

// Get user by ID
export async function getUserById(id: string) {
  const database = await connectDB();
  try {
    return await database.collection('users').findOne({ _id: new ObjectId(id) });
  } catch {
    return null;
  }
}

// Save user links
export async function saveUserLinks(userId: string, links: any[]) {
  const database = await connectDB();
  const objectId = new ObjectId(userId);
  
  // Delete existing links
  await database.collection('links').deleteMany({ userId: objectId });
  
  // Insert new links
  if (links.length > 0) {
    const linksToInsert = links.map((link: any, index: number) => ({
      _id: link.id ? new ObjectId(link.id) : new ObjectId(),
      userId: objectId,
      url: link.url,
      title: link.title,
      icon: link.icon || '',
      position: index
    }));
    await database.collection('links').insertMany(linksToInsert);
  }
}

// Update user profile
export async function updateUserProfile(userId: string, updates: any) {
  const database = await connectDB();
  const objectId = new ObjectId(userId);
  
  // Check username uniqueness if changing
  if (updates.username) {
    const existing = await database.collection('users').findOne({ 
      username: updates.username,
      _id: { $ne: objectId }
    });
    if (existing) {
      throw new Error('Username already taken');
    }
  }
  
  await database.collection('users').updateOne(
    { _id: objectId },
    { $set: updates }
  );
  
  return updates;
}

// Verify email
export async function verifyUserEmail(token: string) {
  const database = await connectDB();
  const user = await database.collection('users').findOne({ emailVerificationToken: token });
  
  if (!user) return null;
  
  await database.collection('users').updateOne(
    { _id: user._id },
    { 
      $set: { isEmailVerified: true },
      $unset: { emailVerificationToken: "" }
    }
  );
  
  return { ...user, isEmailVerified: true, emailVerificationToken: null };
}
