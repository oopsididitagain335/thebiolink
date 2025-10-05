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
  badges: Array<{
    id: string;
    name: string;
    icon: string;
    awardedAt: string;
  }>;
  isEmailVerified: boolean;
  isBanned?: boolean;
  bannedAt?: string;
  createdAt: Date;
  ipAddress?: string;
  profileViews: number;
  layoutStructure?: Array<{
    id: string;
    type: 'bio' | 'links' | 'widget' | 'spacer' | 'custom';
    widgetId?: string;
    height?: number;
    content?: string;
  }>;
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
  url?: string;
  position: number;
}

interface ProfileVisitDoc {
  _id: ObjectId;
  userId: ObjectId;
  clientId: string;
  visitedAt: Date;
}

async function getUserWidgets(userId: ObjectId) {
  const db = await connectDB();
  const widgets = await db.collection<WidgetDoc>('widgets').find({ userId }).toArray();
  return widgets.map(w => ({
    id: w._id.toString(),
    type: w.type,
    title: w.title || '',
    content: w.content || '',
    url: w.url || '',
    position: w.position || 0,
  })).sort((a, b) => a.position - b.position);
}

export async function getUserByUsername(username: string, clientId: string) {
  const db = await connectDB();
  const user = await db.collection<UserDoc>('users').findOne({ username });
  if (!user) return null;

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
    widgets,
    layoutStructure: user.layoutStructure || [
      { id: 'bio', type: 'bio' },
      { id: 'spacer-1', type: 'spacer', height: 20 },
      { id: 'links', type: 'links' }
    ],
  };
}

export async function getUserByUsernameForMetadata(username: string) {
  const db = await connectDB();
  const user = await db.collection<UserDoc>('users').findOne({ username });
  if (!user) return null;
  
  const links = await db.collection<LinkDoc>('links').find({ userId: user._id }).toArray();
  return {
    name: user.name || '',
    avatar: user.avatar || '',
    bio: user.bio || '',
    isBanned: user.isBanned || false,
    links: links.map((link: any) => ({
      url: link.url || '',
      title: link.title || '',
    })),
  };
}

export async function getUserById(id: string) {
  const db = await connectDB();
  let user;
  try {
    user = await db.collection<UserDoc>('users').findOne({ _id: new ObjectId(id) });
  } catch {
    return null;
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
    layoutStructure: user.layoutStructure || [
      { id: 'bio', type: 'bio' },
      { id: 'spacer-1', type: 'spacer', height: 20 },
      { id: 'links', type: 'links' }
    ],
    links: links.map(l => ({
      id: l._id.toString(),
      url: l.url,
      title: l.title,
      icon: l.icon || '',
      position: l.position || 0,
    })).sort((a, b) => a.position - b.position),
    widgets,
    badges: user.badges || [],
  };
}

export async function getUserByEmail(email: string) {
  const db = await connectDB();
  const user = await db.collection<UserDoc>('users').findOne({ email });
  if (!user) return null;
  return {
    _id: user._id.toString(),
    email: user.email,
    passwordHash: user.passwordHash,
    username: user.username,
    name: user.name || '',
    avatar: user.avatar || '',
    bio: user.bio || '',
    isEmailVerified: user.isEmailVerified,
    isBanned: user.isBanned || false,
  };
}

export async function createUser(email: string, password: string, username: string, name: string, background: string = '', ipAddress: string) {
  const db = await connectDB();
  const existingEmail = await db.collection('users').findOne({ email });
  if (existingEmail) throw new Error('Email already registered');
  const existingUsername = await db.collection('users').findOne({ username });
  if (existingUsername) throw new Error('Username already taken');
  const passwordHash = await bcrypt.hash(password, 12);
  const userId = new ObjectId();
  await db.collection('users').insertOne({
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
    createdAt: new Date(),
    profileViews: 0,
    layoutStructure: [
      { id: 'bio', type: 'bio' },
      { id: 'spacer-1', type: 'spacer', height: 20 },
      { id: 'links', type: 'links' }
    ],
  } as UserDoc);
  return {
    id: userId.toString(),
    email,
    username,
    name,
    background,
    badges: [],
    isEmailVerified: true,
    isBanned: false,
    createdAt: new Date().toISOString(),
    profileViews: 0,
    layoutStructure: [
      { id: 'bio', type: 'bio' },
      { id: 'spacer-1', type: 'spacer', height: 20 },
      { id: 'links', type: 'links' }
    ],
  };
}

export async function saveUserLinks(userId: string, links: any[]) {
  const db = await connectDB();
  const uid = new ObjectId(userId);
  await db.collection('links').deleteMany({ userId: uid });
  if (links.length > 0) {
    const valid = links
      .filter(l => l.url?.trim() && l.title?.trim())
      .map((l, i) => ({
        _id: new ObjectId(l.id), // ✅ Preserve ID
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
      .map((w) => ({
        _id: new ObjectId(w.id), // ✅ CRITICAL: Preserve client ID
        userId: uid,
        type: w.type,
        title: (w.title || '').trim(),
        content: (w.content || '').trim(),
        url: (w.url || '').trim(),
        position: w.position || 0,
      }));
    if (valid.length > 0) await db.collection('widgets').insertMany(valid);
  }
}

export async function updateUserProfile(userId: string, updates: any) {
  const db = await connectDB();
  const uid = new ObjectId(userId);
  
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
    layoutStructure: updates.layoutStructure || [
      { id: 'bio', type: 'bio' },
      { id: 'spacer-1', type: 'spacer', height: 20 },
      { id: 'links', type: 'links' }
    ],
  };

  await db.collection('users').updateOne({ _id: uid }, { $set: clean });
}

// --- ADMIN PANEL FUNCTIONS ---
export async function getAllUsers() {
  const db = await connectDB();
  const users = await db
    .collection<UserDoc>('users')
    .find({ isBanned: { $ne: true } })
    .project({
      _id: 1,
      username: 1,
      name: 1,
      avatar: 1,
      bio: 1,
      isBanned: 1,
      badges: 1,
    })
    .toArray();

  return users.map((user) => ({
    id: user._id.toString(),
    username: user.username,
    name: user.name || '',
    avatar: user.avatar || undefined,
    bio: user.bio || undefined,
    isBanned: user.isBanned || false,
    badges: Array.isArray(user.badges) ? user.badges : [],
  }));
}

export async function createBadge(name: string, icon: string) {
  const db = await connectDB();
  const badgeId = new ObjectId().toString();
  await db.collection('badges').insertOne({
    id: badgeId,
    name,
    icon,
    createdAt: new Date().toISOString()
  });
  return { id: badgeId, name, icon };
}

export async function getAllBadges() {
  const db = await connectDB();
  const badges = await db.collection('badges').find({}).toArray();
  return badges.map((badge: any) => ({
    id: badge.id,
    name: badge.name,
    icon: badge.icon
  }));
}

export async function addUserBadge(
  userId: string,
  badge: { id: string; name: string; icon: string; awardedAt: string }
) {
  const db = await connectDB();
  const userObjectId = new ObjectId(userId);
  await db.collection<UserDoc>('users').updateOne(
    { _id: userObjectId },
    { $push: { badges: { $each: [badge] } } }
  );
}

export async function removeUserBadge(userId: string, badgeId: string) {
  const db = await connectDB();
  const userObjectId = new ObjectId(userId);
  await db.collection<UserDoc>('users').updateOne(
    { _id: userObjectId },
    { $pull: { badges: { id: badgeId } } }
  );
}

export async function banUser(userId: string) {
  const db = await connectDB();
  const objectId = new ObjectId(userId);
  await db.collection<UserDoc>('users').updateOne(
    { _id: objectId },
    { $set: { isBanned: true, bannedAt: new Date().toISOString() } }
  );
}

export async function unbanUser(userId: string) {
  const db = await connectDB();
  const objectId = new ObjectId(userId);
  await db.collection<UserDoc>('users').updateOne(
    { _id: objectId },
    { $set: { isBanned: false }, $unset: { bannedAt: "" } }
  );
}
