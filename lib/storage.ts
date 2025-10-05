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
  username: string; // ✅ always lowercase
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

// ✅ getUserByUsername — compare normalized
export async function getUserByUsername(username: string) {
  const db = await connectDB();
  const normalized = username.trim().toLowerCase();
  const user = await db.collection<UserDoc>('users').findOne({ username: normalized });
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
  const normalized = username.trim().toLowerCase();
  const user = await db.collection<UserDoc>('users').findOne({ username: normalized });
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

// ✅ createUser — normalize & validate
export async function createUser(email: string, password: string, username: string, name: string, background: string = '', ipAddress: string) {
  const db = await connectDB();
  const normalizedUsername = username.trim().toLowerCase();

  if (!/^[a-zA-Z0-9_-]{3,30}$/.test(normalizedUsername)) {
    throw new Error('Invalid username format');
  }

  const existingEmail = await db.collection('users').findOne({ email });
  if (existingEmail) throw new Error('Email already registered');
  
  const existingUsername = await db.collection('users').findOne({ username: normalizedUsername });
  if (existingUsername) throw new Error('Username already taken');

  const passwordHash = await bcrypt.hash(password, 12);
  const userId = new ObjectId();
  await db.collection('users').insertOne({
    _id: userId,
    email,
    username: normalizedUsername,
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
    username: normalizedUsername,
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
      .map((w) => ({
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

// ✅ updateUserProfile — normalize, validate, exclude self
export async function updateUserProfile(userId: string, updates: any) {
  const db = await connectDB();
  const uid = new ObjectId(userId);
  
  let cleanUsername = '';
  if (updates.username !== undefined) {
    const normalized = updates.username.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(normalized)) {
      throw new Error('Invalid username format');
    }
    const existing = await db.collection('users').findOne({
      username: normalized,
      _id: { $ne: uid }
    });
    if (existing) throw new Error('Username taken');
    cleanUsername = normalized;
  }

  const current = await getUserById(userId);
  const clean = {
    name: (updates.name || current?.name || '').trim().substring(0, 100),
    username: cleanUsername || current?.username || '',
    avatar: (updates.avatar || current?.avatar || '').trim(),
    bio: (updates.bio || current?.bio || '').trim().substring(0, 500),
    background: (updates.background || current?.background || '').trim(),
    layoutStructure: updates.layoutStructure || current?.layoutStructure || [
      { id: 'bio', type: 'bio' },
      { id: 'spacer-1', type: 'spacer', height: 20 },
      { id: 'links', type: 'links' }
    ],
  };

  await db.collection('users').updateOne({ _id: uid }, { $set: clean });
}

// === Remaining functions unchanged ===
const getWeeklyId = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((now.getTime() - start.getTime()) / 86400000) + start.getDay() + 1) / 7);
  return `week-${now.getFullYear()}-${weekNumber}`;
};

const generateDynamicBadge = (weekId: string) => {
  const emojis = '👑🔥🚀🌐🧙‍♂️🎨🥷🦋🎬🔗💡⚡🎯🌈🤖🎮📱💻🎧📸📚✨🎉🏆🏅🥇🎯🚀🌌🌍🔥';
  const adjectives = ['Cosmic', 'Quantum', 'Neon', 'Digital', 'Viral', 'Mystic', 'Epic', 'Legendary', 'Cyber', 'Galactic'];
  const nouns = ['Creator', 'Builder', 'Artist', 'Wizard', 'Ninja', 'Pioneer', 'Legend', 'Master', 'Guru', 'Pro'];
  const seed = weekId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const randomItem = (arr: string[]) => arr[Math.floor((Math.sin(seed) * 10000) % arr.length)];
  return {
    id: `${weekId}-badge`,
    name: `${randomItem(adjectives)} ${randomItem(nouns)}`,
    icon: emojis.charAt(seed % emojis.length),
  };
};

export async function awardWeeklyFreeBadge(userId: string) {
  const db = await connectDB();
  const user = await db.collection<UserDoc>('users').findOne({ _id: new ObjectId(userId) });
  if (!user) throw new Error('User not found');
  const weekId = getWeeklyId();
  const badgeId = `${weekId}-badge`;
  if (user.badges.some(b => b.id === badgeId)) {
    return { badge: user.badges.find(b => b.id === badgeId)!, message: 'Already claimed' };
  }
  const newBadge = {
    ...generateDynamicBadge(weekId),
    awardedAt: new Date().toISOString(),
  };
  await db.collection<UserDoc>('users').updateOne(
    { _id: user._id },
    { $push: { badges: newBadge } }
  );
  return { badge: newBadge, message: 'New badge claimed!' };
}

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

export async function getAllUsers() {
  const db = await connectDB();
  const users = await db
    .collection<UserDoc>('users')
    .find({
      isBanned: { $ne: true },
      username: { $exists: true, $type: 'string', $ne: '' }, // ✅ FIXED: removed $ne: null
      _id: { $exists: true }
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

export async function banAllUsersFromIP(ipAddress: string) {
  const db = await connectDB();
  const now = new Date();
  const deleteAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  await db.collection<UserDoc>('users').updateMany(
    { 
      $or: [{ ipAddress: ipAddress }, { lastBannedIp: ipAddress }],
      isBanned: { $ne: true } 
    },
    {
      $set: {
        isBanned: true,
        bannedAt: now.toISOString(),
        deleteAt: deleteAt.toISOString(),
        lastBannedIp: ipAddress,
      }
    }
  );
  await db.collection('bannedIPs').updateOne(
    { ip: ipAddress },
    { $setOnInsert: { createdAt: now } },
    { upsert: true }
  );
}

export async function banUser(userId: string, ipAddress?: string) {
  const db = await connectDB();
  const user = await db.collection<UserDoc>('users').findOne({ _id: new ObjectId(userId) });
  if (!user) return;
  const ipToBan = ipAddress || user.ipAddress || user.lastBannedIp;
  if (ipToBan) {
    await banAllUsersFromIP(ipToBan);
  } else {
    const now = new Date();
    const deleteAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);
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
