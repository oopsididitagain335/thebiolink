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
  profileBanner?: string;
  pageBackground?: string;
  bio?: string;
  location?: string;
  badges: Array<{
    id: string;
    name: string;
    icon: string;
    awardedAt: string;
    earnedAt?: string;
    hidden?: boolean;
  }>;
  isEmailVerified: boolean;
  isBanned?: boolean;
  bannedAt?: string;
  createdAt: Date;
  ipAddress?: string;
  profileViews: number;
  plan?: string;
  theme?: string;
  layoutStructure?: Array<LayoutSection>;
  discordId?: string;
  xp: number;
  level: number;
  loginStreak: number;
  lastLogin: Date;
  loginHistory: Date[];
  lastMonthlyBadge: string;
  customCSS?: string;
  customJS?: string;
  seoMeta?: { title: string; description: string; keywords: string };
  analyticsCode?: string;
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
  widgetId: string;
  type: 'spotify' | 'youtube' | 'twitter' | 'custom' | 'form' | 'ecommerce' | 'api' | 'calendar';
  title?: string;
  content?: string;
  url?: string;
  position: number;
}

interface LayoutSection {
  id: string;
  type: 'bio' | 'links' | 'widget' | 'spacer' | 'custom' | 'form' | 'ecommerce' | 'tab' | 'column' | 'api' | 'calendar' | 'page';
  widgetId?: string;
  height?: number;
  content?: string;
  children?: LayoutSection[];
  pagePath?: string;
  styling?: { [key: string]: string };
}

interface NewsPost {
  _id: ObjectId;
  title: string;
  content: string;
  imageUrl?: string;
  authorId: ObjectId;
  authorName: string;
  publishedAt: Date;
  likes: number;
}

interface NewsInteraction {
  _id: ObjectId;
  postId: ObjectId;
  userId: ObjectId;
  type: 'like' | 'comment';
  content?: string;
  createdAt: Date;
}

interface ProfileVisitDoc {
  _id: ObjectId;
  userId: ObjectId;
  clientId: string;
  visitedAt: Date;
}

interface DiscordCodeDoc {
  _id?: ObjectId;
  code: string;
  userId: ObjectId;
  used: boolean;
  createdAt: Date;
  expiresAt: Date;
  discordId?: string;
  usedAt?: Date;
}

async function getUserWidgets(userId: ObjectId) {
  const db = await connectDB();
  const widgets = await db.collection<WidgetDoc>('widgets').find({ userId }).toArray();
  return widgets.map(w => ({
    id: w.widgetId,
    type: w.type,
    title: w.title || '',
    content: w.content || '',
    url: w.url || '',
    position: w.position || 0,
  })).sort((a, b) => a.position - b.position);
}

export const calculateLevel = (xp: number): number => {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

export async function updateUserXP(userId: string, amount: number) {
  const db = await connectDB();
  const uid = new ObjectId(userId);
  const user = await db.collection<UserDoc>('users').findOne({ _id: uid });
  if (!user) throw new Error('User not found');

  const newXP = (user.xp || 0) + amount;
  const newLevel = calculateLevel(newXP);

  await db.collection('users').updateOne(
    { _id: uid },
    { $set: { xp: newXP, level: newLevel } }
  );

  return { xp: newXP, level: newLevel };
}

async function awardMonthlyBadge(user: UserDoc) {
  const db = await connectDB();
  const now = new Date();
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStr = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}`;

  if (user.lastMonthlyBadge !== prevMonthStr) {
    const loginCount = (user.loginHistory || []).filter(date => {
      const d = new Date(date);
      return d.getFullYear() === previousMonth.getFullYear() && d.getMonth() === previousMonth.getMonth();
    }).length;

    if (loginCount >= 15) {
      const badgeName = `Active ${previousMonth.toLocaleString('default', { month: 'long' })} ${previousMonth.getFullYear()}`;
      const icon = 'https://example.com/monthly-badge-icon.png'; // Replace with dynamic icon if needed
      const newBadge = {
        id: `monthly-${prevMonthStr}`,
        name: badgeName,
        icon,
        awardedAt: now.toISOString(),
        earnedAt: now.toISOString(),
      };

      await db.collection('users').updateOne(
        { _id: user._id },
        {
          $push: { badges: newBadge },
          $set: { lastMonthlyBadge: prevMonthStr }
        }
      );

      return true;
    }
  }
  return false;
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

  const now = new Date();
  const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
  const isSameDay = lastLogin &&
    lastLogin.getFullYear() === now.getFullYear() &&
    lastLogin.getMonth() === now.getMonth() &&
    lastLogin.getDate() === now.getDate();

  let updatedUser = user;
  if (!isSameDay) {
    let streak = 1;
    if (lastLogin) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (
        lastLogin.getFullYear() === yesterday.getFullYear() &&
        lastLogin.getMonth() === yesterday.getMonth() &&
        lastLogin.getDate() === yesterday.getDate()
      ) {
        streak = (user.loginStreak || 0) + 1;
      }
    }

    const baseXP = 50;
    const streakBonus = 10 * Math.min(streak, 30);
    const totalXP = baseXP + streakBonus;
    const newXP = (user.xp || 0) + totalXP;
    const newLevel = calculateLevel(newXP);

    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $inc: { xp: totalXP },
        $set: {
          lastLogin: now,
          loginStreak: streak,
          level: newLevel
        },
        $push: { loginHistory: now }
      }
    );

    updatedUser = await db.collection<UserDoc>('users').findOne({ _id: user._id })!;

    // Award monthly badge if applicable
    await awardMonthlyBadge(updatedUser);
    updatedUser = await db.collection<UserDoc>('users').findOne({ _id: user._id })!;
  }

  const links = await db.collection<LinkDoc>('links').find({ userId: updatedUser._id }).toArray();
  const widgets = await getUserWidgets(updatedUser._id);

  return {
    _id: updatedUser._id.toString(),
    username: updatedUser.username,
    name: updatedUser.name || '',
    avatar: updatedUser.avatar || '',
    profileBanner: updatedUser.profileBanner || '',
    pageBackground: updatedUser.pageBackground || '',
    bio: updatedUser.bio || '',
    location: updatedUser.location || '',
    badges: updatedUser.badges || [],
    isBanned: updatedUser.isBanned || false,
    profileViews: updatedUser.profileViews || 0,
    plan: updatedUser.plan || 'free',
    theme: updatedUser.theme || 'indigo',
    xp: updatedUser.xp || 0,
    level: updatedUser.level || 1,
    loginStreak: updatedUser.loginStreak || 0,
    lastLogin: updatedUser.lastLogin?.toISOString() || '',
    loginHistory: (updatedUser.loginHistory || []).map(d => d.toISOString()),
    lastMonthlyBadge: updatedUser.lastMonthlyBadge || '',
    links: links.map(l => ({
      id: l._id.toString(),
      url: l.url,
      title: l.title,
      icon: l.icon || '',
      position: l.position || 0,
    })).sort((a, b) => a.position - b.position),
    widgets,
    layoutStructure: updatedUser.layoutStructure || [
      { id: 'bio', type: 'bio' },
      { id: 'spacer-1', type: 'spacer', height: 24 },
      { id: 'links', type: 'links' },
    ],
    customCSS: updatedUser.customCSS || '',
    customJS: updatedUser.customJS || '',
    seoMeta: updatedUser.seoMeta || { title: '', description: '', keywords: '' },
    analyticsCode: updatedUser.analyticsCode || '',
    discordId: updatedUser.discordId,
  };
}

export async function getUserByUsernameForMetadata(username: string) {
  const db = await connectDB();
  const user = await db.collection<UserDoc>('users').findOne({ username });
  if (!user) return null;

  return {
    name: user.name || '',
    avatar: user.avatar || '',
    bio: user.bio || '',
    isBanned: user.isBanned || false,
    level: user.level || 1,
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

  const now = new Date();
  const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
  const isSameDay = lastLogin &&
    lastLogin.getFullYear() === now.getFullYear() &&
    lastLogin.getMonth() === now.getMonth() &&
    lastLogin.getDate() === now.getDate();

  let updatedUser = user;
  if (!isSameDay) {
    let streak = 1;
    if (lastLogin) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (
        lastLogin.getFullYear() === yesterday.getFullYear() &&
        lastLogin.getMonth() === yesterday.getMonth() &&
        lastLogin.getDate() === yesterday.getDate()
      ) {
        streak = (user.loginStreak || 0) + 1;
      }
    }

    const baseXP = 50;
    const streakBonus = 10 * Math.min(streak, 30);
    const totalXP = baseXP + streakBonus;
    const newXP = (user.xp || 0) + totalXP;
    const newLevel = calculateLevel(newXP);

    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $inc: { xp: totalXP },
        $set: {
          lastLogin: now,
          loginStreak: streak,
          level: newLevel
        },
        $push: { loginHistory: now }
      }
    );

    updatedUser = await db.collection<UserDoc>('users').findOne({ _id: user._id })!;

    // Award monthly badge if applicable
    await awardMonthlyBadge(updatedUser);
    updatedUser = await db.collection<UserDoc>('users').findOne({ _id: user._id })!;
  }

  const links = await db.collection<LinkDoc>('links').find({ userId: updatedUser._id }).toArray();
  const widgets = await getUserWidgets(updatedUser._id);

  return {
    _id: updatedUser._id.toString(),
    name: updatedUser.name || '',
    username: updatedUser.username || '',
    avatar: updatedUser.avatar || '',
    profileBanner: updatedUser.profileBanner || '',
    pageBackground: updatedUser.pageBackground || '',
    bio: updatedUser.bio || '',
    location: updatedUser.location || '',
    isEmailVerified: updatedUser.isEmailVerified,
    plan: updatedUser.plan || 'free',
    profileViews: updatedUser.profileViews || 0,
    theme: updatedUser.theme || 'indigo',
    xp: updatedUser.xp || 0,
    level: updatedUser.level || 1,
    loginStreak: updatedUser.loginStreak || 0,
    lastLogin: updatedUser.lastLogin?.toISOString() || '',
    loginHistory: (updatedUser.loginHistory || []).map(d => d.toISOString()),
    lastMonthlyBadge: updatedUser.lastMonthlyBadge || '',
    layoutStructure: updatedUser.layoutStructure || [
      { id: 'bio', type: 'bio' },
      { id: 'spacer-1', type: 'spacer', height: 24 },
      { id: 'links', type: 'links' },
    ],
    links: links.map(l => ({
      id: l._id.toString(),
      url: l.url,
      title: l.title,
      icon: l.icon || '',
      position: l.position || 0,
    })).sort((a, b) => a.position - b.position),
    widgets,
    badges: updatedUser.badges || [],
    customCSS: updatedUser.customCSS || '',
    customJS: updatedUser.customJS || '',
    seoMeta: updatedUser.seoMeta || { title: '', description: '', keywords: '' },
    analyticsCode: updatedUser.analyticsCode || '',
    discordId: updatedUser.discordId,
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
    profileBanner: user.profileBanner || '',
    pageBackground: user.pageBackground || '',
    bio: user.bio || '',
    location: user.location || '',
    isEmailVerified: user.isEmailVerified,
    isBanned: user.isBanned || false,
    plan: user.plan || 'free',
    discordId: user.discordId,
  };
}

export async function createUser(email: string, password: string, username: string, name: string, ipAddress: string) {
  const db = await connectDB();
  const existingEmail = await db.collection('users').findOne({ email });
  if (existingEmail) throw new Error('Email already registered');
  const existingUsername = await db.collection('users').findOne({ username });
  if (existingUsername) throw new Error('Username already taken');
  const passwordHash = await bcrypt.hash(password, 12);
  const userId = new ObjectId();
  const now = new Date();
  await db.collection('users').insertOne({
    _id: userId,
    email,
    username,
    name,
    passwordHash,
    avatar: '',
    profileBanner: '',
    pageBackground: '',
    location: '',
    ipAddress,
    badges: [],
    isEmailVerified: true,
    isBanned: false,
    createdAt: now,
    profileViews: 0,
    plan: 'free',
    theme: 'indigo',
    xp: 0,
    level: 1,
    loginStreak: 1,
    lastLogin: now,
    loginHistory: [now],
    lastMonthlyBadge: '',
    layoutStructure: [
      { id: 'bio', type: 'bio' },
      { id: 'spacer-1', type: 'spacer', height: 24 },
      { id: 'links', type: 'links' },
    ],
    customCSS: '',
    customJS: '',
    seoMeta: { title: '', description: '', keywords: '' },
    analyticsCode: '',
  } as UserDoc);
  return {
    id: userId.toString(),
    email,
    username,
    name,
    avatar: '',
    profileBanner: '',
    pageBackground: '',
    location: '',
    badges: [],
    isEmailVerified: true,
    isBanned: false,
    createdAt: now.toISOString(),
    profileViews: 0,
    plan: 'free',
    theme: 'indigo',
    xp: 0,
    level: 1,
    loginStreak: 1,
    lastLogin: now.toISOString(),
    loginHistory: [now.toISOString()],
    lastMonthlyBadge: '',
    layoutStructure: [
      { id: 'bio', type: 'bio' },
      { id: 'spacer-1', type: 'spacer', height: 24 },
      { id: 'links', type: 'links' },
    ],
    customCSS: '',
    customJS: '',
    seoMeta: { title: '', description: '', keywords: '' },
    analyticsCode: '',
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
      .filter(w => w.id && ['spotify','youtube','twitter','custom','form','ecommerce','api','calendar'].includes(w.type))
      .map((w, i) => ({
        _id: new ObjectId(),
        userId: uid,
        widgetId: w.id,
        type: w.type,
        title: (w.title || '').trim(),
        content: (w.content || '').trim(),
        url: (w.url || '').trim(),
        position: i,
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

  const validThemes = ['indigo', 'purple', 'green', 'red', 'halloween'];
  const theme = validThemes.includes(updates.theme) ? updates.theme : 'indigo';

  const clean = {
    name: (updates.name || '').trim().substring(0, 100),
    username: (updates.username || '').trim().toLowerCase(),
    avatar: (updates.avatar || '').trim(),
    profileBanner: (updates.profileBanner || '').trim(),
    pageBackground: (updates.pageBackground || '').trim(),
    bio: (updates.bio || '').trim().substring(0, 500),
    location: updates.location ? updates.location.trim().substring(0, 100) : '',
    plan: updates.plan || 'free',
    theme,
    layoutStructure: updates.layoutStructure || [
      { id: 'bio', type: 'bio' },
      { id: 'spacer-1', type: 'spacer', height: 24 },
      { id: 'links', type: 'links' },
    ],
    customCSS: updates.customCSS || '',
    customJS: updates.customJS || '',
    seoMeta: updates.seoMeta || { title: '', description: '', keywords: '' },
    analyticsCode: updates.analyticsCode || '',
    discordId: updates.discordId,
  };

  await db.collection('users').updateOne({ _id: uid }, { $set: clean });
}

// NEWS FUNCTIONS (unchanged, as per prompt focus)
export async function createNewsPost(
  title: string,
  content: string,
  imageUrl: string,
  authorId: string,
  authorName: string
) {
  const db = await connectDB();
  const post = {
    _id: new ObjectId(),
    title: title.trim(),
    content: content.trim(),
    imageUrl: imageUrl?.trim() || undefined,
    authorId: new ObjectId(authorId),
    authorName: authorName.trim(),
    publishedAt: new Date(),
    likes: 0,
  };
  await db.collection<NewsPost>('news').insertOne(post);
  return {
    id: post._id.toString(),
    title: post.title,
    content: post.content,
    imageUrl: post.imageUrl,
    authorName: post.authorName,
    publishedAt: post.publishedAt.toISOString(),
    likes: post.likes,
  };
}

export async function getAllNewsPosts() {
  const db = await connectDB();
  const posts = await db
    .collection<NewsPost>('news')
    .find({})
    .sort({ publishedAt: -1 })
    .toArray();

  const enriched = await Promise.all(posts.map(async (post) => {
    const likes = await db.collection<NewsInteraction>('news_interactions')
      .countDocuments({ postId: post._id, type: 'like' });

    const comments = await db.collection<NewsInteraction>('news_interactions')
      .find({ postId: post._id, type: 'comment' })
      .sort({ createdAt: 1 })
      .toArray();

    const commentAuthors = await Promise.all(
      comments.map(async (c) => {
        const user = await db.collection<UserDoc>('users').findOne({ _id: c.userId });
        return {
          id: c._id.toString(),
          content: c.content || '',
          author: user ? user.username : 'Unknown',
          authorName: user ? user.name : 'Anonymous',
          createdAt: c.createdAt.toISOString(),
        };
      })
    );

    return {
      id: post._id.toString(),
      title: post.title,
      content: post.content,
      imageUrl: post.imageUrl,
      authorName: post.authorName,
      publishedAt: post.publishedAt.toISOString(),
      likes,
      comments: commentAuthors,
    };
  }));

  return enriched;
}

export async function addNewsInteraction(
  postId: string,
  email: string,
  type: 'like' | 'comment',
  content?: string
) {
  const db = await connectDB();
  const user = await db.collection<UserDoc>('users').findOne({ email, isEmailVerified: true });
  if (!user) throw new Error('Only verified users can interact');

  const postObjectId = new ObjectId(postId);
  const post = await db.collection<NewsPost>('news').findOne({ _id: postObjectId });
  if (!post) throw new Error('Post not found');

  if (type === 'like') {
    const existing = await db.collection<NewsInteraction>('news_interactions').findOne({
      postId: postObjectId,
      userId: user._id,
      type: 'like'
    });
    if (existing) throw new Error('Already liked');
  }

  const interaction = {
    _id: new ObjectId(),
    postId: postObjectId,
    userId: user._id,
    type,
    content: type === 'comment' ? content?.trim() : undefined,
    createdAt: new Date(),
  };

  await db.collection<NewsInteraction>('news_interactions').insertOne(interaction);
  return getAllNewsPosts().then(posts => posts.find(p => p.id === postId));
}

// ADMIN PANEL FUNCTIONS (unchanged, as per prompt focus)
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
      profileBanner: 1,
      pageBackground: 1,
      bio: 1,
      location: 1,
      isBanned: 1,
      badges: 1,
      plan: 1,
      discordId: 1,
    })
    .toArray();

  return users.map((user) => ({
    id: user._id.toString(),
    username: user.username,
    name: user.name || '',
    avatar: user.avatar || undefined,
    profileBanner: user.profileBanner || undefined,
    pageBackground: user.pageBackground || undefined,
    bio: user.bio || undefined,
    location: user.location || undefined,
    isBanned: user.isBanned || false,
    plan: user.plan || 'free',
    badges: Array.isArray(user.badges) ? user.badges : [],
    discordId: user.discordId,
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
  badge: { id: string; name: string; icon: string; awardedAt: string; earnedAt?: string; hidden?: boolean }
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

export async function getNewsPostById(id: string) {
  const db = await connectDB();
  let post;
  try {
    post = await db.collection<NewsPost>('news').findOne({ _id: new ObjectId(id) });
  } catch {
    return null;
  }
  if (!post) return null;

  const likes = await db.collection<NewsInteraction>('news_interactions')
    .countDocuments({ postId: post._id, type: 'like' });

  const comments = await db.collection<NewsInteraction>('news_interactions')
    .find({ postId: post._id, type: 'comment' })
    .sort({ createdAt: 1 })
    .toArray();

  const commentAuthors = await Promise.all(
    comments.map(async (c) => {
      const user = await db.collection<UserDoc>('users').findOne({ _id: c.userId });
      return {
        id: c._id.toString(),
        content: c.content || '',
        author: user ? user.username : 'Unknown',
        authorName: user ? user.name : 'Anonymous',
        createdAt: c.createdAt.toISOString(),
      };
    })
  );

  return {
    id: post._id.toString(),
    title: post.title,
    content: post.content,
    imageUrl: post.imageUrl,
    authorName: post.authorName,
    publishedAt: post.publishedAt.toISOString(),
    likes,
    comments: commentAuthors,
  };
}

// DISCORD LINKING (unchanged)
export async function createDiscordLinkCode(userId: string): Promise<string> {
  const db = await connectDB();
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await db.collection<DiscordCodeDoc>('discord_codes').insertOne({
    code,
    userId: new ObjectId(userId),
    used: false,
    createdAt: new Date(),
    expiresAt,
  });

  return code;
}
