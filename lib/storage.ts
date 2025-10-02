// lib/storage.ts
import { MongoClient, ObjectId, Db } from 'mongodb';
import bcrypt from 'bcryptjs';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectDB() {
  if (cachedDb) return cachedDb;
  if (!cachedClient) {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not set');
    }
    cachedClient = new MongoClient(process.env.MONGODB_URI);
    await cachedClient.connect();
  }
  if (!cachedDb) {
    cachedDb = cachedClient.db();
  }
  return cachedDb;
}

// --- Interfaces ---
interface UserDoc {
  _id: ObjectId;
  email: string;
  username: string;
  name: string;
  passwordHash: string;
  avatar?: string;
  bio?: string;
  background?: string;
  backgroundVideo?: string;
  backgroundAudio?: string;
  badges: any[];
  isEmailVerified: boolean;
  isBanned?: boolean;
  bannedAt?: string;
  createdAt: Date;
  profileViews: number;
  layout?: string; // ✅
}

interface LinkDoc {
  _id: ObjectId;
  userId: ObjectId;
  url: string;
  title: string;
  icon?: string;
  position: number;
}

interface WidgetDoc {
  _id: ObjectId;
  userId: ObjectId;
  type: 'spotify' | 'youtube' | 'twitter' | 'custom';
  title?: string;
  content?: string;
  position: number;
}

interface ProfileVisitDoc {
  _id: ObjectId;
  userId: ObjectId;
  clientId: string;
  visitedAt: Date;
}

// --- Helper: Get Widgets ---
async function getUserWidgets(userId: ObjectId) {
  const db = await connectDB();
  const widgets = await db.collection<WidgetDoc>('widgets').find({ userId }).toArray();
  return widgets.map(w => ({
    id: w._id.toString(),
    type: w.type,
    title: w.title || '',
    content: w.content || '',
    position: w.position || 0,
  })).sort((a, b) => a.position - b.position);
}

// --- Public: Get User by Username (for /:username) ---
export async function getUserByUsername(username: string, clientId: string) {
  const db = await connectDB();
  const user = await db.collection<UserDoc>('users').findOne({ username });
  if (!user) return null;

  // Track unique view
  if (clientId) {
    const visitExists = await db.collection('profile_visits').findOne({ userId: user._id, clientId });
    if (!visitExists) {
      await db.collection('users').updateOne({ _id: user._id }, { $inc: { profileViews: 1 } });
      await db.collection('profile_visits').insertOne({ userId: user._id, clientId, visitedAt: new Date() } as ProfileVisitDoc);
    }
  }

  const links = await db.collection<LinkDoc>('links').find({ userId: user._id }).toArray();
  const widgets = await getUserWidgets(user._id);

  return {
    _id: user._id.toString(),
    username: user.username,
    name: user.name || '',
    avatar: user.avatar || '',
    bio: user.bio || '',
    background: user.background || '',
    backgroundVideo: user.backgroundVideo || '',
    backgroundAudio: user.backgroundAudio || '',
    badges: user.badges || [],
    isBanned: user.isBanned || false,
    profileViews: user.profileViews || 0,
    links: links.map(l => ({
      id: l._id.toString(),
      url: l.url,
      title: l.title,
      icon: l.icon || '',
      position: l.position || 0,
    })).sort((a, b) => a.position - b.position),
    widgets, // ✅
    layout: user.layout || 'classic', // ✅
  };
}

// --- Metadata (no tracking) ---
export async function getUserByUsernameForMetadata(username: string) {
  const db = await connectDB();
  const user = await db.collection<UserDoc>('users').findOne({ username });
  if (!user) return null;
  const links = await db.collection<LinkDoc>('links').find({ userId: user._id }).toArray();
  return {
    name: user.name || '',
    avatar: user.avatar || '',
    bio: user.bio || '',
    links: links.map(l => ({ url: l.url, title: l.title })),
  };
}

// --- Auth: Get User by ID (for dashboard) ---
export async function getUserById(id: string) {
  const db = await connectDB();
  let user;
  try {
    user = await db.collection<UserDoc>('users').findOne({ _id: new ObjectId(id) });
  } catch {
    return null; // invalid ObjectId
  }
  if (!user) return null;

  const links = await db.collection<LinkDoc>('links').find({ userId: user._id }).toArray();
  const widgets = await getUserWidgets(user._id);

  return {
    _id: user._id.toString(),
    name: user.name || '',
    username: user.username || '',
    avatar: user.avatar || '',
    bio: user.bio || '',
    background: user.background || '',
    isEmailVerified: user.isEmailVerified,
    layout: user.layout || 'classic',
    links: links.map(l => ({
      id: l._id.toString(),
      url: l.url,
      title: l.title,
      icon: l.icon || '',
      position: l.position || 0,
    })).sort((a, b) => a.position - b.position),
    widgets,
  };
}

// --- Save Functions ---
export async function saveUserLinks(userId: string, links: any[]) {
  const db = await connectDB();
  const uid = new ObjectId(userId);
  await db.collection('links').deleteMany({ userId: uid });
  if (links.length > 0) {
    const valid = links
      .filter(l => l.url?.trim() && l.title?.trim())
      .map((l, i) => ({
        _id: new ObjectId(),
        userId: uid,
        url: l.url.trim(),
        title: l.title.trim(),
        icon: l.icon?.trim() || '',
        position: i,
      }));
    if (valid.length > 0) await db.collection('links').insertMany(valid);
  }
}

export async function saveUserWidgets(userId: string, widgets: any[]) {
  const db = await connectDB();
  const uid = new ObjectId(userId);
  await db.collection('widgets').deleteMany({ userId: uid });
  if (widgets.length > 0) {
    const valid = widgets
      .filter(w => ['spotify','youtube','twitter','custom'].includes(w.type))
      .map((w, i) => ({
        _id: new ObjectId(),
        userId: uid,
        type: w.type,
        title: (w.title || '').trim(),
        content: (w.content || '').trim(),
        position: i,
      }));
    if (valid.length > 0) await db.collection('widgets').insertMany(valid);
  }
}

export async function updateUserProfile(userId: string, updates: any) {
  const db = await connectDB();
  const uid = new ObjectId(userId);
  
  // Validate username uniqueness
  if (updates.username) {
    const existing = await db.collection('users').findOne({
      username: updates.username,
      _id: { $ne: uid }
    });
    if (existing) throw new Error('Username taken');
  }

  const clean = {
    name: updates.name?.trim() || '',
    username: updates.username?.trim().toLowerCase() || '',
    avatar: updates.avatar?.trim() || '',
    bio: updates.bio?.trim() || '',
    background: updates.background?.trim() || '',
    layout: updates.layout || 'classic',
  };

  await db.collection('users').updateOne({ _id: uid }, { $set: clean });
}
