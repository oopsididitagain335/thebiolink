import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

let client: MongoClient | null = null;
let db: any = null;

export async function connectDB() {
  if (db) return db;
  
  if (!client) {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not set');
    }
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
  }
  
  if (!db) {
    db = client.db();
  }
  
  return db;
}

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
      icon: link.icon
    }))
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
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      isEmailVerified: user.isEmailVerified,
      links: links.map((link: any) => ({
        id: link._id.toString(),
        url: link.url,
        title: link.title,
        icon: link.icon
      }))
    };
  } catch {
    return null;
  }
}

// ✅ ADDED: createUser function
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

// ✅ ADDED: getUserByEmail function
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
    const linksToInsert = links.map((link: any) => ({
      _id: new ObjectId(),
      userId: objectId,
      url: link.url.trim(),
      title: link.title.trim(),
      icon: link.icon?.trim() || ''
    }));
    
    await database.collection('links').insertMany(linksToInsert);
  }
}

export async function updateUserProfile(userId: string, updates: any) {
  const database = await connectDB();
  const objectId = new ObjectId(userId);
  
  await database.collection('users').updateOne(
    { _id: objectId },
    { $set: updates }
  );
  
  const updatedUser = await database.collection('users').findOne({ _id: objectId });
  const links = await database.collection('links').find({ userId: objectId }).toArray();
  
  return {
    _id: updatedUser._id.toString(),
    name: updatedUser.name,
    username: updatedUser.username,
    avatar: updatedUser.avatar,
    bio: updatedUser.bio,
    isEmailVerified: updatedUser.isEmailVerified,
    links: links.map((link: any) => ({
      id: link._id.toString(),
      url: link.url,
      title: link.title,
      icon: link.icon
    }))
  };
}
