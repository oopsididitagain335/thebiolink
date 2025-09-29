import { MongoClient, ObjectId, Db } from 'mongodb';
import bcrypt from 'bcryptjs';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectDB() {
  if (cachedDb) return cachedDb;
  if (!cachedClient) {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not set in environment variables');
    }
    cachedClient = new MongoClient(process.env.MONGODB_URI);
    await cachedClient.connect();
  }
  if (!cachedDb) {
    cachedDb = cachedClient.db();
  }
  return cachedDb;
}

// --- User Schema Interface ---
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
}

interface LinkDoc {
  _id: ObjectId;
  userId: ObjectId;
  url: string;
  title: string;
  icon?: string;
  position: number;
}

interface ProfileVisitDoc {
  _id: ObjectId;
  userId: ObjectId;
  clientId: string;
  visitedAt: Date;
}

// --- User Functions (Node.js only) ---
export async function getUserByUsername(username: string, clientId: string) {
  const database = await connectDB();
  const user = await database.collection('users').findOne({ username });

  if (!user) return null;

  // If no clientId is provided, fetch user without incrementing views
  if (!clientId) {
    const links = await database.collection('links').find({ userId: user._id }).toArray();
    return {
      _id: user._id.toString(),
      id: user._id.toString(),
      username: user.username,
      name: user.name || '',
      email: user.email || '',
      avatar: user.avatar || '',
      bio: user.bio || '',
      background: user.background || '',
      backgroundVideo: user.backgroundVideo || '',
      backgroundAudio: user.backgroundAudio || '',
      badges: user.badges || [],
      isEmailVerified: user.isEmailVerified || false,
      isBanned: user.isBanned || false,
      bannedAt: user.bannedAt,
      createdAt: user.createdAt || new Date().toISOString(),
      profileViews: user.profileViews || 0,
      links: links.map((link: any) => ({
        id: link._id.toString(),
        url: link.url || '',
        title: link.title || '',
        icon: link.icon || '',
        position: link.position || 0
      })).sort((a: any, b: any) => a.position - b.position)
    };
  }

  // Check if this client has already visited this user's profile
  const existingVisit = await database.collection('profile_visits').findOne({
    userId: user._id,
    clientId: clientId,
  });

  if (!existingVisit) {
    // Increment profile views and record the visit
    await database.collection('users').updateOne(
      { _id: user._id },
      { $inc: { profileViews: 1 } }
    );
    await database.collection('profile_visits').insertOne({
      userId: user._id,
      clientId: clientId,
      visitedAt: new Date(),
    } as ProfileVisitDoc);
  }

  const links = await database.collection('links').find({ userId: user._id }).toArray();
  return {
    _id: user._id.toString(),
    id: user._id.toString(),
    username: user.username,
    name: user.name || '',
    email: user.email || '',
    avatar: user.avatar || '',
    bio: user.bio || '',
    background: user.background || '',
    backgroundVideo: user.backgroundVideo || '',
    backgroundAudio: user.backgroundAudio || '',
    badges: user.badges || [],
    isEmailVerified: user.isEmailVerified || false,
    isBanned: user.isBanned || false,
    bannedAt: user.bannedAt,
    createdAt: user.createdAt || new Date().toISOString(),
    profileViews: user.profileViews || 0,
    links: links.map((link: any) => ({
      id: link._id.toString(),
      url: link.url || '',
      title: link.title || '',
      icon: link.icon || '',
      position: link.position || 0
    })).sort((a: any, b: any) => a.position - b.position)
  };
}

export async function getUserByUsernameForMetadata(username: string) {
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
    background: user.background || '',
    backgroundVideo: user.backgroundVideo || '',
    backgroundAudio: user.backgroundAudio || '',
    badges: user.badges || [],
    isEmailVerified: user.isEmailVerified || false,
    isBanned: user.isBanned || false,
    bannedAt: user.bannedAt,
    createdAt: user.createdAt || new Date().toISOString(),
    profileViews: user.profileViews || 0,
    links: links.map((link: any) => ({
      id: link._id.toString(),
      url: link.url || '',
      title: link.title || '',
      icon: link.icon || '',
      position: link.position || 0
    })).sort((a: any, b: any) => a.position - b.position)
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
      id: user._id.toString(),
      username: user.username,
      name: user.name || '',
      email: user.email || '',
      avatar: user.avatar || '',
      bio: user.bio || '',
      background: user.background || '',
      backgroundVideo: user.backgroundVideo || '',
      backgroundAudio: user.backgroundAudio || '',
      badges: user.badges || [],
      isEmailVerified: user.isEmailVerified || false,
      isBanned: user.isBanned || false,
      bannedAt: user.bannedAt,
      createdAt: user.createdAt || new Date().toISOString(),
      passwordHash: user.passwordHash,
      profileViews: user.profileViews || 0,
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

export async function createUser(email: string, password: string, username: string, name: string, background: string = '', ipAddress: string) {
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
    background,
    ipAddress,
    badges: [],
    isEmailVerified: true,
    isBanned: false,
    createdAt: new Date(),
    profileViews: 0
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
    profileViews: 0
  };
}

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
    background: user.background || '',
    backgroundVideo: user.backgroundVideo || '',
    backgroundAudio: user.backgroundAudio || '',
    badges: user.badges || [],
    isEmailVerified: user.isEmailVerified || false,
    isBanned: user.isBanned || false,
    bannedAt: user.bannedAt,
    createdAt: user.createdAt || new Date().toISOString(),
    passwordHash: user.passwordHash,
    profileViews: user.profileViews || 0
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
    bio: updates.bio?.trim() || '',
    background: updates.background?.trim() || '',
    backgroundVideo: updates.backgroundVideo?.trim() || '',
    backgroundAudio: updates.backgroundAudio?.trim() || ''
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
  const updatedUserDocument = await database.collection('users').findOne({ _id: objectId });
  if (!updatedUserDocument) {
    console.error(`Failed to retrieve user after update for ID: ${userId}`);
    throw new Error('User not found after update');
  }
  const links = await database.collection('links').find({ userId: objectId }).toArray();
  return {
    _id: updatedUserDocument._id.toString(),
    id: updatedUserDocument._id.toString(),
    username: updatedUserDocument.username,
    name: updatedUserDocument.name || '',
    email: updatedUserDocument.email || '',
    avatar: updatedUserDocument.avatar || '',
    bio: updatedUserDocument.bio || '',
    background: updatedUserDocument.background || '',
    backgroundVideo: updatedUserDocument.backgroundVideo || '',
    backgroundAudio: updatedUserDocument.backgroundAudio || '',
    badges: updatedUserDocument.badges || [],
    isEmailVerified: updatedUserDocument.isEmailVerified || false,
    isBanned: updatedUserDocument.isBanned || false,
    bannedAt: updatedUserDocument.bannedAt,
    createdAt: updatedUserDocument.createdAt || new Date().toISOString(),
    passwordHash: updatedUserDocument.passwordHash,
    profileViews: updatedUserDocument.profileViews || 0,
    links: links.map((link: any) => ({
      id: link._id.toString(),
      url: link.url || '',
      title: link.title || '',
      icon: link.icon || '',
      position: link.position || 0
    })).sort((a: any, b: any) => a.position - b.position)
  };
}

// --- ADMIN PANEL FUNCTIONS ---
export async function addUserBadge(
  userId: string,
  badge: { id: string; name: string; icon: string; awardedAt: string }
) {
  const database = await connectDB();
  const userObjectId = new ObjectId(userId);
  await database.collection<UserDoc>('users').updateOne(
    { _id: userObjectId },
    { $push: { badges: { $each: [badge] } } }
  );
}

export async function removeUserBadge(userId: string, badgeId: string) {
  const database = await connectDB();
  const userObjectId = new ObjectId(userId);
  await database.collection<UserDoc>('users').updateOne(
    { _id: userObjectId },
    { $pull: { badges: { id: badgeId } } }
  );
}

export async function getAllUsers() {
  const database = await connectDB();
  const users = await database.collection<UserDoc>('users').find({}).toArray();
  return users.map((user) => ({
    id: user._id.toString(),
    email: user.email,
    username: user.username,
    name: user.name || '',
    badges: user.badges || [],
    isBanned: user.isBanned || false,
    bannedAt: user.bannedAt,
    profileViews: user.profileViews || 0
  }));
}

export async function createBadge(name: string, icon: string) {
  const database = await connectDB();
  const badgeId = new ObjectId().toString();
  await database.collection('badges').insertOne({
    id: badgeId,
    name,
    icon,
    createdAt: new Date().toISOString()
  });
  return { id: badgeId, name, icon };
}

export async function getAllBadges() {
  const database = await connectDB();
  const badges = await database.collection('badges').find({}).toArray();
  return badges.map((badge: any) => ({
    id: badge.id,
    name: badge.name,
    icon: badge.icon
  }));
}

export async function banUser(userId: string) {
  const database = await connectDB();
  const objectId = new ObjectId(userId);
  await database.collection<UserDoc>('users').updateOne(
    { _id: objectId },
    { $set: { isBanned: true, bannedAt: new Date().toISOString() } }
  );
}

export async function unbanUser(userId: string) {
  const database = await connectDB();
  const objectId = new ObjectId(userId);
  await database.collection<UserDoc>('users').updateOne(
    { _id: objectId },
    { $set: { isBanned: false }, $unset: { bannedAt: "" } }
  );
}import { MongoClient, ObjectId, Db } from 'mongodb';
import bcrypt from 'bcryptjs';

// ─── Types ───────────────────────────────────────────
export interface Badge {
  id: string;
  name: string;
  icon: string;
  awardedAt?: string;
}

export interface User {
  _id: ObjectId;
  email: string;
  username: string;
  name: string;
  avatar?: string;
  bio?: string;
  background?: string;
  backgroundVideo?: string;
  backgroundAudio?: string;
  passwordHash: string;
  badges: Badge[];
  isEmailVerified: boolean;
  isBanned: boolean;
  bannedAt?: string;
  createdAt: Date;
  ipAddress?: string;
  profileViews: number;
}

export interface LinkDoc {
  _id: ObjectId;
  userId: ObjectId;
  url: string;
  title: string;
  icon?: string;
  position: number;
}

export interface ProfileVisitDoc {
  _id: ObjectId;
  userId: ObjectId;
  clientId: string;
  visitedAt: Date;
}

export interface Referral {
  _id: ObjectId;
  referrerId: ObjectId;
  referredUserId: ObjectId;
  timestamp: Date;
}

// Public user type for discovery
export interface PublicUser {
  _id: ObjectId;
  username: string;
  name: string;
  avatar?: string;
  bio?: string;
  badges: Badge[];
  isBanned: boolean;
  bannedAt?: string;
  profileViews: number;
}

// ─── MongoDB Connection (Cached) ─────────────────────
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectDB(): Promise<Db> {
  if (cachedDb) return cachedDb;

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI not set in environment variables');
  }

  if (!cachedClient) {
    cachedClient = new MongoClient(process.env.MONGODB_URI);
    await cachedClient.connect();
  }

  cachedDb = cachedClient.db(process.env.MONGODB_DB || 'thebiolink');
  return cachedDb;
}

// Alias for compatibility
export const connectToDatabase = async () => {
  const db = await connectDB();
  return { client: cachedClient!, db };
};

// ─── Helper: Get Links ───────────────────────────────
async function getUserLinks(userId: ObjectId, db: Db) {
  const links = await db.collection<LinkDoc>('links').find({ userId }).toArray();
  return links
    .map((link) => ({
      id: link._id.toString(),
      url: link.url || '',
      title: link.title || '',
      icon: link.icon || '',
      position: link.position || 0,
    }))
    .sort((a, b) => a.position - b.position);
}

// ─── User Functions ──────────────────────────────────

export async function getUserByUsername(username: string, clientId?: string) {
  const db = await connectDB();
  const user = await db.collection<User>('users').findOne({ username });
  if (!user) return null;

  if (clientId) {
    const existingVisit = await db.collection<ProfileVisitDoc>('profile_visits').findOne({
      userId: user._id,
      clientId,
    });

    if (!existingVisit) {
      await db.collection('users').updateOne(
        { _id: user._id },
        { $inc: { profileViews: 1 } }
      );
      await db.collection<ProfileVisitDoc>('profile_visits').insertOne({
        _id: new ObjectId(),
        userId: user._id,
        clientId,
        visitedAt: new Date(),
      });
    }
  }

  const links = await getUserLinks(user._id, db);

  return {
    _id: user._id.toString(),
    id: user._id.toString(),
    username: user.username,
    name: user.name || '',
    email: user.email || '',
    avatar: user.avatar || '',
    bio: user.bio || '',
    background: user.background || '',
    backgroundVideo: user.backgroundVideo || '',
    backgroundAudio: user.backgroundAudio || '',
    badges: user.badges || [],
    isEmailVerified: user.isEmailVerified || false,
    isBanned: user.isBanned || false,
    bannedAt: user.bannedAt,
    createdAt: user.createdAt.toISOString(),
    profileViews: user.profileViews || 0,
    links,
  };
}

export async function getUserByUsernameForMetadata(username: string) {
  const user = await getUserByUsername(username);
  return user
    ? {
        username: user.username,
        name: user.name,
        bio: user.bio,
        avatar: user.avatar,
        background: user.background,
        backgroundVideo: user.backgroundVideo,
        backgroundAudio: user.backgroundAudio,
        badges: user.badges,
        isBanned: user.isBanned,
        links: user.links,
      }
    : null;
}

export async function getUserById(id: string) {
  if (!ObjectId.isValid(id)) return null;
  const db = await connectDB();
  const user = await db.collection<User>('users').findOne({ _id: new ObjectId(id) });
  if (!user) return null;

  const links = await getUserLinks(user._id, db);

  return {
    _id: user._id.toString(),
    id: user._id.toString(),
    username: user.username,
    name: user.name || '',
    email: user.email || '',
    avatar: user.avatar || '',
    bio: user.bio || '',
    background: user.background || '',
    backgroundVideo: user.backgroundVideo || '',
    backgroundAudio: user.backgroundAudio || '',
    badges: user.badges || [],
    isEmailVerified: user.isEmailVerified || false,
    isBanned: user.isBanned || false,
    bannedAt: user.bannedAt,
    createdAt: user.createdAt.toISOString(),
    passwordHash: user.passwordHash,
    profileViews: user.profileViews || 0,
    links,
  };
}

export async function getUserByEmail(email: string) {
  const db = await connectDB();
  const user = await db.collection<User>('users').findOne(
    { email },
    { projection: { passwordHash: 1 } }
  );
  if (!user) return null;

  const links = await getUserLinks(user._id, db);

  return {
    _id: user._id.toString(),
    id: user._id.toString(),
    username: user.username,
    name: user.name || '',
    email: user.email || '',
    avatar: user.avatar || '',
    bio: user.bio || '',
    background: user.background || '',
    backgroundVideo: user.backgroundVideo || '',
    backgroundAudio: user.backgroundAudio || '',
    badges: user.badges || [],
    isEmailVerified: user.isEmailVerified || false,
    isBanned: user.isBanned || false,
    bannedAt: user.bannedAt,
    createdAt: user.createdAt.toISOString(),
    passwordHash: user.passwordHash,
    profileViews: user.profileViews || 0,
    links,
  };
}

export async function createUser(
  email: string,
  password: string,
  username: string,
  name: string,
  background: string = '',
  ipAddress: string = 'unknown'
) {
  const db = await connectDB();

  const existingEmail = await db.collection('users').findOne({ email });
  if (existingEmail) throw new Error('Email already registered');

  const existingUsername = await db.collection('users').findOne({ username });
  if (existingUsername) throw new Error('Username already taken');

  const passwordHash = await bcrypt.hash(password, 12);
  const userId = new ObjectId();

  await db.collection<User>('users').insertOne({
    _id: userId,
    email,
    username: username.toLowerCase().trim(),
    name: name.trim(),
    passwordHash,
    background,
    ipAddress,
    badges: [],
    isEmailVerified: true,
    isBanned: false,
    createdAt: new Date(),
    profileViews: 0,
  });

  return {
    id: userId.toString(),
    email,
    username: username.toLowerCase().trim(),
    name: name.trim(),
    background,
    badges: [],
    isEmailVerified: true,
    isBanned: false,
    createdAt: new Date().toISOString(),
    profileViews: 0,
  };
}

// ─── Links ───────────────────────────────────────────

export async function saveUserLinks(userId: string, links: any[]) {
  if (!ObjectId.isValid(userId)) throw new Error('Invalid user ID');
  const db = await connectDB();
  const objectId = new ObjectId(userId);

  await db.collection('links').deleteMany({ userId: objectId });

  if (links.length > 0) {
    const linksToInsert = links
      .map((link: any, index: number) => ({
        _id: new ObjectId(),
        userId: objectId,
        url: (link.url || '').trim(),
        title: (link.title || '').trim(),
        icon: (link.icon || '').trim(),
        position: index,
      }))
      .filter((link) => link.url && link.title);

    if (linksToInsert.length > 0) {
      await db.collection('links').insertMany(linksToInsert);
    }
  }
}

// ─── Profile Updates ─────────────────────────────────

export async function updateUserProfile(userId: string, updates: Partial<User>) {
  if (!ObjectId.isValid(userId)) throw new Error('Invalid user ID');
  const db = await connectDB();
  const objectId = new ObjectId(userId);

  const cleanedUpdates: Partial<User> = {
    name: updates.name?.trim() || '',
    username: updates.username?.trim().toLowerCase() || '',
    avatar: updates.avatar?.trim() || '',
    bio: updates.bio?.trim() || '',
    background: updates.background?.trim() || '',
    backgroundVideo: updates.backgroundVideo?.trim() || '',
    backgroundAudio: updates.backgroundAudio?.trim() || '',
  };

  if (cleanedUpdates.username) {
    const existing = await db.collection<User>('users').findOne({
      username: cleanedUpdates.username,
      _id: { $ne: objectId },
    });
    if (existing) throw new Error('Username already taken');
  }

  const result = await db.collection<User>('users').updateOne(
    { _id: objectId },
    { $set: cleanedUpdates }
  );

  if (result.modifiedCount === 0) {
    throw new Error('User not found or no changes made');
  }

  const updatedUser = await db.collection<User>('users').findOne({ _id: objectId });
  if (!updatedUser) throw new Error('User not found after update');

  const links = await getUserLinks(updatedUser._id, db);

  return {
    _id: updatedUser._id.toString(),
    id: updatedUser._id.toString(),
    username: updatedUser.username,
    name: updatedUser.name || '',
    email: updatedUser.email || '',
    avatar: updatedUser.avatar || '',
    bio: updatedUser.bio || '',
    background: updatedUser.background || '',
    backgroundVideo: updatedUser.backgroundVideo || '',
    backgroundAudio: updatedUser.backgroundAudio || '',
    badges: updatedUser.badges || [],
    isEmailVerified: updatedUser.isEmailVerified || false,
    isBanned: updatedUser.isBanned || false,
    bannedAt: updatedUser.bannedAt,
    createdAt: updatedUser.createdAt.toISOString(),
    passwordHash: updatedUser.passwordHash,
    profileViews: updatedUser.profileViews || 0,
    links,
  };
}

// ─── Badges ──────────────────────────────────────────

export async function addUserBadge(
  userId: string,
  badge: { id: string; name: string; icon: string; awardedAt: string }
) {
  if (!ObjectId.isValid(userId)) throw new Error('Invalid user ID');
  const db = await connectDB();
  await db.collection<User>('users').updateOne(
    { _id: new ObjectId(userId) },
    { $push: { badges: badge } }
  );
}

export async function removeUserBadge(userId: string, badgeId: string) {
  if (!ObjectId.isValid(userId)) throw new Error('Invalid user ID');
  const db = await connectDB();
  await db.collection<User>('users').updateOne(
    { _id: new ObjectId(userId) },
    { $pull: { badges: { id: badgeId } } }
  );
}

export async function getAllUsers(): Promise<PublicUser[]> {
  const db = await connectDB();
  const users = await db.collection<User>('users').find(
    {},
    {
      projection: {
        passwordHash: 0,
        email: 0,
        ipAddress: 0,
        isEmailVerified: 0,
        background: 0,
        backgroundVideo: 0,
        backgroundAudio: 0,
        createdAt: 0,
      },
    }
  ).toArray();

  return users.map((user) => ({
    _id: user._id,
    username: user.username,
    name: user.name || '',
    avatar: user.avatar || undefined,
    bio: user.bio || undefined,
    badges: user.badges || [],
    isBanned: user.isBanned || false,
    bannedAt: user.bannedAt,
    profileViews: user.profileViews || 0,
  }));
}

export async function createBadge(name: string, icon: string) {
  const db = await connectDB();
  const badgeId = new ObjectId().toString();
  await db.collection('badges').insertOne({
    id: badgeId,
    name,
    icon,
    createdAt: new Date().toISOString(),
  });
  return { id: badgeId, name, icon };
}

export async function getAllBadges() {
  const db = await connectDB();
  const badges = await db.collection('badges').find({}).toArray();
  return badges.map((badge: any) => ({
    id: badge.id,
    name: badge.name,
    icon: badge.icon,
  }));
}

export async function banUser(userId: string) {
  if (!ObjectId.isValid(userId)) throw new Error('Invalid user ID');
  const db = await connectDB();
  await db.collection<User>('users').updateOne(
    { _id: new ObjectId(userId) },
    { $set: { isBanned: true, bannedAt: new Date().toISOString() } }
  );
}

export async function unbanUser(userId: string) {
  if (!ObjectId.isValid(userId)) throw new Error('Invalid user ID');
  const db = await connectDB();
  await db.collection<User>('users').updateOne(
    { _id: new ObjectId(userId) },
    { $set: { isBanned: false }, $unset: { bannedAt: '' } }
  );
}

// ─── Required Exports for API Routes ─────────────────

export async function recordProfileView(userId: string, clientId: string): Promise<boolean> {
  if (!ObjectId.isValid(userId) || !clientId) return false;
  const db = await connectDB();
  const userObjectId = new ObjectId(userId);

  const existing = await db.collection<ProfileVisitDoc>('profile_visits').findOne({
    userId: userObjectId,
    clientId,
  });

  if (existing) return false;

  await db.collection('users').updateOne(
    { _id: userObjectId },
    { $inc: { profileViews: 1 } }
  );

  await db.collection<ProfileVisitDoc>('profile_visits').insertOne({
    _id: new ObjectId(),
    userId: userObjectId,
    clientId,
    visitedAt: new Date(),
  });

  return true;
}

export async function getProfileViewCount(userId: string): Promise<number> {
  if (!ObjectId.isValid(userId)) return 0;
  const db = await connectDB();
  const user = await db.collection<User>('users').findOne(
    { _id: new ObjectId(userId) },
    { projection: { profileViews: 1 } }
  );
  return user?.profileViews || 0;
}

export async function logReferral(referrerId: string, referredUserId: string): Promise<void> {
  if (!ObjectId.isValid(referrerId) || !ObjectId.isValid(referredUserId)) {
    throw new Error('Invalid user IDs');
  }
  const db = await connectDB();
  await db.collection<Referral>('referrals').insertOne({
    _id: new ObjectId(),
    referrerId: new ObjectId(referrerId),
    referredUserId: new ObjectId(referredUserId),
    timestamp: new Date(),
  });
}

export async function getReferralStats() {
  const db = await connectDB();
  const allUsers = await db
    .collection<User>('users')
    .find({}, { projection: { _id: 1, username: 1 } })
    .toArray();

  const referralCounts = await db
    .collection<Referral>('referrals')
    .aggregate([{ $group: { _id: '$referrerId', count: { $sum: 1 } } }])
    .toArray();

  const countMap = new Map<string, number>();
  referralCounts.forEach((item) => countMap.set(item._id.toString(), item.count));

  return allUsers.map((user) => ({
    userId: user._id.toString(),
    username: user.username || 'unknown',
    usageCount: countMap.get(user._id.toString()) || 0,
  }));
}

export async function getLatestAnnouncement() {
  const db = await connectDB();
  return db.collection('announcements').findOne({}, { sort: { createdAt: -1 } });
}

export async function sendAnnouncement(content: string, authorId: string) {
  const db = await connectDB();
  const result = await db.collection('announcements').insertOne({
    content,
    authorId,
    createdAt: new Date(),
  });
  return {
    _id: result.insertedId,
    content,
    authorId,
    createdAt: new Date(),
  };
}
