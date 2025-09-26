import { MongoClient, ObjectId } from 'mongodb';

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
