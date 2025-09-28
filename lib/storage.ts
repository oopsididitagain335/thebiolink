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
  referralCode?: string; // 7-digit number
  referralId?: string; // 5-digit number
  referredCount?: number;
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

interface ReferralDoc {
  _id: ObjectId;
  referrerId: ObjectId;
  referredId: ObjectId;
  referredAt: Date;
  codeUsed: string;
  idUsed: string;
}

interface AnnouncementDoc {
  _id: ObjectId;
  text: string;
  sentAt: Date;
  sentBy: ObjectId;
}

// --- User Functions (Node.js only) ---

export async function getUserByUsername(username: string, clientId: string = '') {
  const database = await connectDB();
  const user = await database.collection('users').findOne({ username });

  if (!user) return null;

  // Track profile views
  if (clientId) {
    const existingVisit = await database.collection('profile_visits').findOne({
      userId: user._id,
      clientId: clientId,
    });

    if (!existingVisit) {
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
    referralCode: user.referralCode || '',
    referralId: user.referralId || '',
    referredCount: user.referredCount || 0,
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
    referralCode: user.referralCode || '',
    referralId: user.referralId || '',
    referredCount: user.referredCount || 0,
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
      referralCode: user.referralCode || '',
      referralId: user.referralId || '',
      referredCount: user.referredCount || 0,
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

export async function getUserByReferralCode(code: string, id: string) {
  const database = await connectDB();
  const user = await database.collection('users').findOne({
    referralCode: code,
    referralId: id,
  });
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
    referralCode: user.referralCode || '',
    referralId: user.referralId || '',
    referredCount: user.referredCount || 0,
    isEmailVerified: user.isEmailVerified || false,
    isBanned: user.isBanned || false,
    bannedAt: user.bannedAt,
    createdAt: user.createdAt || new Date().toISOString(),
    profileViews: user.profileViews || 0,
  };
}

export async function createUser(
  email: string,
  password: string,
  username: string,
  name: string,
  background: string = '',
  ipAddress: string,
  referrerCode?: string,
  referrerId?: string
) {
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
    referralCode: undefined,
    referralId: undefined,
    referredCount: 0,
    isEmailVerified: true,
    isBanned: false,
    createdAt: new Date(),
    profileViews: 0
  } as UserDoc);

  // Handle referral if provided
  if (referrerCode && referrerId) {
    const referrer = await database.collection<UserDoc>('users').findOne({
      referralCode: referrerCode,
      referralId: referrerId,
    });
    if (referrer) {
      await database.collection('referrals').insertOne({
        referrerId: referrer._id,
        referredId: userId,
        referredAt: new Date(),
        codeUsed: referrerCode,
        idUsed: referrerId,
      } as ReferralDoc);
      await database.collection('users').updateOne(
        { _id: referrer._id },
        { $inc: { referredCount: 1 } }
      );
    }
  }

  return {
    id: userId.toString(),
    email,
    username,
    name,
    background,
    badges: [],
    referralCode: '',
    referralId: '',
    referredCount: 0,
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
    { projection: { passwordHash: 1, badges: 1 } } // Include badges for auth check
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
    referralCode: user.referralCode || '',
    referralId: user.referralId || '',
    referredCount: user.referredCount || 0,
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
    referralCode: updatedUserDocument.referralCode || '',
    referralId: updatedUserDocument.referralId || '',
    referredCount: updatedUserDocument.referredCount || 0,
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

  // If Sponsored badge, generate referral code and ID
  if (badge.name === 'Sponsored') {
    const code = Math.floor(1000000 + Math.random() * 9000000).toString(); // 7-digit
    const id = Math.floor(10000 + Math.random() * 90000).toString(); // 5-digit
    await database.collection<UserDoc>('users').updateOne(
      { _id: userObjectId },
      { $set: { referralCode: code, referralId: id } }
    );
    console.log(`Sponsored badge awarded to ${userId}: Code=${code}, ID=${id}`); // Debug log
  }
  console.log(`Badge awarded to ${userId}: ${badge.name}`); // Debug log
}

export async function removeUserBadge(userId: string, badgeId: string) {
  const database = await connectDB();
  const userObjectId = new ObjectId(userId);
  await database.collection<UserDoc>('users').updateOne(
    { _id: userObjectId },
    { $pull: { badges: { id: badgeId } } }
  );

  // If removing Sponsored, clear referral info
  if (badgeId === 'sponsored') {
    await database.collection<UserDoc>('users').updateOne(
      { _id: userObjectId },
      { $unset: { referralCode: '', referralId: '' } }
    );
  }
}

// Get all users for discovery page
export async function getAllUsers() {
  const database = await connectDB();
  const users = await database.collection<UserDoc>('users').find({}).toArray();

  return users.map((user) => ({
    id: user._id.toString(),
    email: user.email,
    username: user.username,
    name: user.name || '',
    avatar: user.avatar || '',
    bio: user.bio || '',
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
}

// Referral Functions
export async function getTopReferrers(limit: number = 10) {
  const database = await connectDB();
  const users = await database
    .collection<UserDoc>('users')
    .find({ referredCount: { $gt: 0 } })
    .sort({ referredCount: -1 })
    .limit(limit)
    .toArray();

  return users.map((user) => ({
    username: user.username,
    referredCount: user.referredCount || 0,
  }));
}

// Announcement Functions
export async function sendAnnouncement(text: string, sentBy: string) {
  const database = await connectDB();
  await database.collection('announcements').insertOne({
    text,
    sentAt: new Date(),
    sentBy: new ObjectId(sentBy),
  } as AnnouncementDoc);
  console.log(`Announcement saved by ${sentBy}: ${text}`); // Debug log
}

export async function getLatestAnnouncement() {
  const database = await connectDB();
  const ann = await database
    .collection<AnnouncementDoc>('announcements')
    .findOne({}, { sort: { sentAt: -1 } });
  return ann ? { text: ann.text, sentAt: ann.sentAt.toISOString() } : null;
}
