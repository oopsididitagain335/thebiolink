import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

let client: MongoClient | null = null;
let db: any = null;

export async function connectDB() {
  if (db) {
    return db;
  }
  
  if (!client) {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not set in environment variables');
    }
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
  }
  
  if (!db) {
    db = client.db();
  }
  
  return db;
}

// Get complete user data by username (for /{username} pages)
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

// Get complete user data by ID (for dashboard)
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
  } catch {
    return null;
  }
}

export async function createUser(email: string, password: string, username: string, name: string) {
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
    isEmailVerified: true,
    createdAt: new Date()
  });
  
  return { 
    id: userId.toString(), 
    email, 
    username, 
    name,
    isEmailVerified: true,
    createdAt: new Date().toISOString()
  };
}

export async function getUserByEmail(email: string) {
  const database = await connectDB();
  const user = await database.collection('users').findOne({ email });
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
    bio: updates.bio?.trim() || ''
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
    links: links.map((link: any) => ({
      id: link._id.toString(),
      url: link.url || '',
      title: link.title || '',
      icon: link.icon || '',
      position: link.position || 0
    })).sort((a: any, b: any) => a.position - b.position)
  };
}
