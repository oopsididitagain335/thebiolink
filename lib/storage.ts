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

// ========================
// USER DOCUMENT INTERFACE
// ========================
export interface UserDoc {
  _id: ObjectId;
  email: string;
  username: string;
  usernameLower: string;
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
  plan?: string;
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

// ========================
// HELPER FUNCTIONS
// ========================
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

// ========================
// USER FETCHING
// ========================
export async function getUserByUsername(username: string) {
  const db = await connectDB();
  const normalized = username.trim().toLowerCase();
  const user = await db.collection<UserDoc>('users').findOne({ usernameLower: normalized });
  if (!user) return null;
  if (user.isBanned) {
    return { isBanned: true };
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
    isBanned: false,
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
  const normalized = username.trim().toLowerCase();
  const user = await db.collection<UserDoc>('users').findOne({ usernameLower: normalized });
  if (!user) return null;
  const links = await db.collection<LinkDoc>('links').find({ userId: user._id }).toArray();
  return {
    name: user.name || '',
    avatar: user.avatar || '',
    bio: user.bio || '',
    isBanned: !!user.isBanned,
    links: links.map(l => ({ url: l.url || '', title: l.title || '' })),
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
  if (user.isBanned) {
    return { _id: user._id.toString(), isBanned: true, email: user.email };
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
    isBanned: !!user.isBanned,
  };
}

// ========================
// USER CREATION & UPDATE
// ========================
export async function createUser(email: string, password: string, username: string, name: string, background: string = '', ipAddress: string) {
  const db = await connectDB();
  const originalUsername = username.trim();
  const normalizedUsername = originalUsername.toLowerCase();
  if (!/^[a-zA-Z0-9_-]{3,30}$/.test(originalUsername)) {
    throw new Error('Invalid username format');
  }
  const existingEmail = await db.collection('users').findOne({ email });
  if (existingEmail) throw new Error('Email already registered');
  const existingUsername = await db.collection('users').findOne({ usernameLower: normalizedUsername });
  if (existingUsername) throw new Error('Username already taken');
  const passwordHash = await bcrypt.hash(password, 12);
  const userId = new ObjectId();
  await db.collection('users').insertOne({
    _id: userId,
    email,
    username: originalUsername,
    usernameLower: normalizedUsername,
    name,
    passwordHash,
    background,
    ipAddress,
    badges: [],
    isEmailVerified: true,
    isBanned: false,
    plan: 'free',
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
    username: originalUsername,
    name,
    background,
    badges: [],
    isEmailVerified: true,
    isBanned: false,
    plan: 'free',
    createdAt: new Date().toISOString(),
    profileViews: 0,
    layoutStructure: [
      { id: 'bio', type: 'bio' },
      { id: 'spacer-1', type: 'spacer', height: 20 },
      { id: 'links', type: 'links' }
    ],
  };
}

export async function updateUserProfile(userId: string, updates: any) {
  const db = await connectDB();
  const uid = new ObjectId(userId);
  let cleanUsername = '';
  let cleanUsernameLower = '';
  if (updates.username !== undefined) {
    const original = updates.username.trim();
    const normalized = original.toLowerCase();
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(original)) {
      throw new Error('Invalid username format');
    }
    const existing = await db.collection('users').findOne({
      usernameLower: normalized,
      _id: { $ne: uid }
    });
    if (existing) throw new Error('Username taken');
    cleanUsername = original;
    cleanUsernameLower = normalized;
  }
  const current = await getUserById(userId);
  if (!current || (current as any).isBanned) throw new Error('User not found or banned');
  let clean: any = {
    name: (updates.name || current.name || '').trim().substring(0, 100),
  };
  if (cleanUsername) {
    clean.username = cleanUsername;
    clean.usernameLower = cleanUsernameLower;
  }
  clean.avatar = (updates.avatar || current.avatar || '').trim();
  clean.bio = (updates.bio || current.bio || '').trim().substring(0, 500);
  clean.background = (updates.background || current.background || '').trim();
  clean.layoutStructure = updates.layoutStructure || current.layoutStructure || [
    { id: 'bio', type: 'bio' },
    { id: 'spacer-1', type: 'spacer', height: 20 },
    { id: 'links', type: 'links' }
  ];
  await db.collection('users').updateOne({ _id: uid }, { $set: clean });
}

// ========================
// BADGE MANAGEMENT ✅ (CRITICAL SECTION)
// ========================
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

// ========================
// ADMIN USER MANAGEMENT
// ========================
export async function getAllUsers() {
  const db = await connectDB();
  const users = await db
    .collection<UserDoc>('users')
    .find({
      isBanned: { $ne: true },
      usernameLower: { $exists: true, $type: 'string', $ne: '' },
    })
    .project({
      _id: 1,
      username: 1,
      name: 1,
      avatar: 1,
      bio: 1,
      isBanned: 1,
    })
    .sort({ _id: -1 })
    .toArray();
  const seen = new Set<string>();
  const uniqueUsers = users.filter(user => {
    const uname = user.username.trim().toLowerCase();
    if (!uname || seen.has(uname)) return false;
    seen.add(uname);
    return true;
  });
  return uniqueUsers.map(user => ({
    id: user._id.toString(),
    username: user.username.trim(),
    name: user.name?.trim() || user.username.trim(),
    avatar: user.avatar?.trim() || undefined,
    bio: user.bio?.trim() || undefined,
    isBanned: !!user.isBanned,
  }));
}

export async function banUser(userId: string, ipAddress?: string) {
  const db = await connectDB();
  const user = await db.collection<UserDoc>('users').findOne({ _id: new ObjectId(userId) });
  if (!user) return;
  const ipToBan = ipAddress || user.ipAddress || user.lastBannedIp;
  const now = new Date();
  const deleteAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  if (ipToBan) {
    await db.collection<UserDoc>('users').updateMany(
      { $or: [{ ipAddress: ipToBan }, { lastBannedIp: ipToBan }], isBanned: { $ne: true } },
      { $set: { isBanned: true, bannedAt: now.toISOString(), deleteAt: deleteAt.toISOString(), lastBannedIp: ipToBan } }
    );
    await db.collection('bannedIPs').updateOne({ ip: ipToBan }, { $setOnInsert: { createdAt: now } }, { upsert: true });
  } else {
    await db.collection<UserDoc>('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { isBanned: true, bannedAt: now.toISOString(), deleteAt: deleteAt.toISOString() } }
    );
  }
}

export async function unbanUser(userId: string) {
  const db = await connectDB();
  await db.collection<UserDoc>('users').updateOne(
    { _id: new ObjectId(userId) },
    { $set: { isBanned: false }, $unset: { bannedAt: "", deleteAt: "", lastBannedIp: "" } }
  );
}

// ========================
// SECURITY & ABUSE PREVENTION
// ========================
export async function isIpBanned(ip: string): Promise<boolean> {
  const db = await connectDB();
  const record = await db.collection('bannedIPs').findOne({ ip });
  return !!record;
}

export async function checkAccountLimit(ipAddress: string): Promise<boolean> {
  const db = await connectDB();
  const count = await db.collection('users').countDocuments({ ipAddress });
  return count < 2;
}

// ========================
// AUTH & PROFILE
// ========================
export async function updateUserEmail(userId: string, newEmail: string) {
  const db = await connectDB();
  const uid = new ObjectId(userId);
  const existing = await db.collection('users').findOne({ email: newEmail, _id: { $ne: uid } });
  if (existing) throw new Error('Email already in use');
  await db.collection('users').updateOne({ _id: uid }, { $set: { email: newEmail } });
}

export async function updateUserPassword(userId: string, newPassword: string) {
  const db = await connectDB();
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.collection('users').updateOne(
    { _id: new ObjectId(userId) },
    { $set: { passwordHash } }
  );
}

export async function cancelUserSubscription(userId: string) {
  const db = await connectDB();
  await db.collection('users').updateOne(
    { _id: new ObjectId(userId) },
    { $set: { plan: 'free' } }
  );
}

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
      .map(w => ({
        _id: new ObjectId(),
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
