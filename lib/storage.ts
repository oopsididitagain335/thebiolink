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
  deleteAt?: string;
  lastBannedIp?: string;
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

// === NEW: Check if IP is banned ===
export async function isIpBanned(ip: string): Promise<boolean> {
  const db = await connectDB();
  const record = await db.collection('bannedIPs').findOne({ ip });
  return !!record;
}

// === Helper: Get widgets ===
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

// === Public: Get user by username ===
export async function getUserByUsername(username: string, clientId: string) {
  const db = await connectDB();
  const user = await db.collection<UserDoc>('users').findOne({ username });
  if (!user) return null;

  if (user.isBanned) {
    return { isBanned: true };
  }

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

// === Public: Get user by ID (for dashboard) ===
export async function getUserById(id: string) {
  const db = await connectDB();
  let user;
  try {
    user = await db.collection<UserDoc>('users').findOne({ _id: new ObjectId(id) });
  } catch {
    return null;
  }
  if (!user) return null;

  // 🔒 RETURN BANNED STATUS
  if (user.isBanned) {
    return {
      _id: user._id.toString(),
      isBanned: true,
      email: user.email,
    };
  }

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
    email: user.email,
    plan: user.plan || 'free',
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

// === Other existing functions (getUserByEmail, createUser, etc.) — keep as-is ===
// ... (retain all your existing functions like createUser, saveUserLinks, etc.)

// ✅ FIXED: saveUserLinks — generate new ObjectId on server
export async function saveUserLinks(userId: string, links: any[]) {
  const db = await connectDB();
  const uid = new ObjectId(userId);
  await db.collection('links').deleteMany({ userId: uid });
  if (links.length > 0) {
    const valid = links
      .filter(l => l.url?.trim() && l.title?.trim())
      .map((l, i) => ({
        _id: new ObjectId(), // ✅ NEVER use l.id
        userId: uid,
        url: l.url.trim(),
        title: l.title.trim(),
        icon: l.icon?.trim() || '',
        position: i,
      }));
    if (valid.length > 0) await db.collection('links').insertMany(valid);
  }
}

// ✅ FIXED: saveUserWidgets — generate new ObjectId on server
export async function saveUserWidgets(userId: string, widgets: any[]) {
  const db = await connectDB();
  const uid = new ObjectId(userId);
  await db.collection('widgets').deleteMany({ userId: uid });
  if (widgets.length > 0) {
    const valid = widgets
      .filter(w => ['spotify','youtube','twitter','custom'].includes(w.type))
      .map((w) => ({
        _id: new ObjectId(), // ✅ NEVER use w.id
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

// === Admin: Ban user ===
export async function banUser(userId: string, ipAddress?: string) {
  const db = await connectDB();
  const objectId = new ObjectId(userId);
  const now = new Date();
  const deleteAt = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours

  const update: any = {
    isBanned: true,
    bannedAt: now.toISOString(),
    deleteAt: deleteAt.toISOString(),
  };

  if (ipAddress) {
    update.lastBannedIp = ipAddress;
    await db.collection('bannedIPs').updateOne(
      { ip: ipAddress },
      { $setOnInsert: { createdAt: now } },
      { upsert: true }
    );
  }

  await db.collection<UserDoc>('users').updateOne(
    { _id: objectId },
    { $set: update }
  );
}

// === Admin: Unban user ===
export async function unbanUser(userId: string) {
  const db = await connectDB();
  const objectId = new ObjectId(userId);
  await db.collection<UserDoc>('users').updateOne(
    { _id: objectId },
    {
      $set: { isBanned: false },
      $unset: { bannedAt: "", deleteAt: "", lastBannedIp: "" }
    }
  );
}

// === Cron: Delete expired banned accounts ===
export async function deleteExpiredBannedAccounts() {
  const db = await connectDB();
  const now = new Date();

  const expiredUsers = await db.collection<UserDoc>('users').find({
    isBanned: true,
    deleteAt: { $lt: now.toISOString() }
  }).toArray();

  for (const user of expiredUsers) {
    await db.collection('users').deleteOne({ _id: user._id });
    await db.collection('links').deleteMany({ userId: user._id });
    await db.collection('widgets').deleteMany({ userId: user._id });
    await db.collection('profile_visits').deleteMany({ userId: user._id });
  }

  return expiredUsers.length;
}

// === Keep all your other existing functions (updateUserProfile, awardWeeklyFreeBadge, etc.) ===
// ... (no changes needed)
