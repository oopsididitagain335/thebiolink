import { MongoClient, ObjectId, Db, PushOperator, PullOperator } from 'mongodb';
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

// 🔧 Normalize Tenor/Giphy URLs to direct media links
function normalizeGifUrl(url: string): string {
  if (!url) return '';
  const clean = url.trim();
  // Tenor: https://tenor.com/view/ID.gif → https://media.tenor.com/ID.gif
  if (clean.includes('tenor.com/view/')) {
    const match = clean.match(/\/view\/([^/]+)$/);
    if (match) {
      let id = match[1];
      if (/\.(gif|jpg|jpeg|png)$/i.test(id)) id = id.replace(/\.(gif|jpg|jpeg|png)$/i, '');
      return `https://media.tenor.com/${id}.gif`;
    }
  }
  // Giphy
  if (clean.includes('giphy.com/media/')) {
    const match = clean.match(/\/media\/([^/]+)/);
    if (match) return `https://media.giphy.com/media/${match[1]}/giphy.gif`;
  }
  return clean;
}

// ✅ CORRECT LayoutSection — matches frontend EXACTLY
interface LayoutSection {
  id: string;
  type: 'name' | 'bio' | 'badges' | 'links' | 'widget' | 'spacer' | 'text' | 'audio';
  widgetId?: string;
  content?: string;
  styling?: { [key: string]: string };
  visibleLinks?: string[];
  height?: number; // for spacer
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
  badges: {
    id: string;
    name: string;
    description: string;
    icon: string;
    awardedAt: string;
    earnedAt?: string;
    hidden?: boolean;
  }[];
  isEmailVerified: boolean;
  isBanned?: boolean;
  bannedAt?: string;
  createdAt: Date;
  ipAddress?: string;
  profileViews: number;
  plan?: string;
  theme?: string;
  layoutStructure?: LayoutSection[];
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
  audioUrl?: string; // ← NEW
}

interface LinkDoc {
  _id: ObjectId;
  userId: ObjectId;
  url: string;
  title: string;
  icon?: string;
  position: number;
}

type WidgetType = 'spotify' | 'youtube' | 'twitter' | 'custom' | 'form' | 'ecommerce' | 'api' | 'calendar' | 'audio';

interface WidgetDoc {
  _id: ObjectId;
  userId: ObjectId;
  widgetId: string;
  type: WidgetType;
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

interface NewsPostDoc {
  _id: ObjectId;
  title: string;
  content: string;
  imageUrl?: string;
  authorId: ObjectId;
  authorName: string;
  publishedAt: Date;
  likes: number;
  comments?: { email: string; content: string; createdAt: Date }[];
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
      const icon = 'https://example.com/monthly-badge-icon.png';
      const newBadge = {
        id: `monthly-${prevMonthStr}`,
        name: badgeName,
        description: `Active in ${previousMonth.toLocaleString('default', { month: 'long' })} ${previousMonth.getFullYear()}`,
        icon,
        awardedAt: now.toISOString(),
        earnedAt: now.toISOString(),
      };

      await db.collection('users').updateOne(
        { _id: user._id },
        {
          $push: { badges: { $each: [newBadge] } } as PushOperator<UserDoc>,
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
        $push: { loginHistory: now } as PushOperator<UserDoc>
      }
    );

    const freshUserAfterUpdate = await db.collection<UserDoc>('users').findOne({ _id: user._id });
    if (!freshUserAfterUpdate) throw new Error('User not found after login update');
    updatedUser = freshUserAfterUpdate;

    await awardMonthlyBadge(updatedUser);

    const freshUserAfterBadge = await db.collection<UserDoc>('users').findOne({ _id: user._id });
    if (!freshUserAfterBadge) throw new Error('User not found after badge award');
    updatedUser = freshUserAfterBadge;
  }

  const links = await db.collection<LinkDoc>('links').find({ userId: updatedUser._id }).toArray();
  const widgets = await getUserWidgets(updatedUser._id);

  return {
    _id: updatedUser._id.toString(),
    username: updatedUser.username,
    name: updatedUser.name || '',
    avatar: updatedUser.avatar || '',
    profileBanner: updatedUser.profileBanner || '',
    pageBackground: normalizeGifUrl(updatedUser.pageBackground || '') || '',
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
      { id: 'name', type: 'name' },
      { id: 'bio', type: 'bio' },
      { id: 'spacer-1', type: 'spacer', height: 24 },
      { id: 'links', type: 'links' },
    ],
    customCSS: updatedUser.customCSS || '',
    customJS: updatedUser.customJS || '',
    seoMeta: updatedUser.seoMeta || { title: '', description: '', keywords: '' },
    analyticsCode: updatedUser.analyticsCode || '',
    discordId: updatedUser.discordId,
    audioUrl: updatedUser.audioUrl || '', // ← NEW
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
        $push: { loginHistory: now } as PushOperator<UserDoc>
      }
    );

    const freshUserAfterUpdate = await db.collection<UserDoc>('users').findOne({ _id: user._id });
    if (!freshUserAfterUpdate) throw new Error('User not found after login update');
    updatedUser = freshUserAfterUpdate;

    await awardMonthlyBadge(updatedUser);

    const freshUserAfterBadge = await db.collection<UserDoc>('users').findOne({ _id: user._id });
    if (!freshUserAfterBadge) throw new Error('User not found after badge award');
    updatedUser = freshUserAfterBadge;
  }

  const links = await db.collection<LinkDoc>('links').find({ userId: updatedUser._id }).toArray();
  const widgets = await getUserWidgets(updatedUser._id);

  return {
    _id: updatedUser._id.toString(),
    name: updatedUser.name || '',
    username: updatedUser.username || '',
    avatar: updatedUser.avatar || '',
    profileBanner: updatedUser.profileBanner || '',
    pageBackground: normalizeGifUrl(updatedUser.pageBackground || '') || '',
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
      { id: 'name', type: 'name' },
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
    audioUrl: updatedUser.audioUrl || '', // ← NEW
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
    pageBackground: normalizeGifUrl(user.pageBackground || '') || '',
    bio: user.bio || '',
    location: user.location || '',
    isEmailVerified: user.isEmailVerified,
    isBanned: user.isBanned || false,
    plan: user.plan || 'free',
    discordId: user.discordId,
    audioUrl: user.audioUrl || '', // ← NEW
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
      { id: 'name', type: 'name' },
      { id: 'bio', type: 'bio' },
      { id: 'spacer-1', type: 'spacer', height: 24 },
      { id: 'links', type: 'links' },
    ],
    customCSS: '',
    customJS: '',
    seoMeta: { title: '', description: '', keywords: '' },
    analyticsCode: '',
    audioUrl: '', // ← NEW
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
      { id: 'name', type: 'name' },
      { id: 'bio', type: 'bio' },
      { id: 'spacer-1', type: 'spacer', height: 24 },
      { id: 'links', type: 'links' },
    ],
    customCSS: '',
    customJS: '',
    seoMeta: { title: '', description: '', keywords: '' },
    analyticsCode: '',
    audioUrl: '', // ← NEW
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
      .filter(w => w.id && ['spotify', 'youtube', 'twitter', 'custom', 'form', 'ecommerce', 'api', 'calendar', 'audio'].includes(w.type))
      .map((w, i) => ({
        _id: new ObjectId(),
        userId: uid,
        widgetId: w.id,
        type: w.type as WidgetType,
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

  let pageBackground = updates.pageBackground?.trim() || '';
  if (pageBackground) {
    pageBackground = normalizeGifUrl(pageBackground);
    const validExtensions = /\.(png|jpe?g|webp|gif|mp4|webm|ogg|mp3|wav|m4a)$/i;
    if (!validExtensions.test(pageBackground)) {
      console.warn('Invalid background URL format:', pageBackground);
      pageBackground = '';
    }
  }

  const layoutStructure = Array.isArray(updates.layoutStructure)
    ? updates.layoutStructure.map((s: any) => ({
        id: String(s.id || ''),
        type: ['name', 'bio', 'badges', 'links', 'widget', 'spacer', 'text', 'audio'].includes(s.type) ? s.type : 'text',
        widgetId: s.widgetId ? String(s.widgetId) : undefined,
        content: typeof s.content === 'string' ? s.content : undefined,
        styling: s.styling && typeof s.styling === 'object' ? s.styling : undefined,
        visibleLinks: Array.isArray(s.visibleLinks) ? s.visibleLinks.map(String) : undefined,
        height: typeof s.height === 'number' ? s.height : undefined,
      }))
    : [
        { id: 'name', type: 'name' },
        { id: 'bio', type: 'bio' },
        { id: 'spacer-1', type: 'spacer', height: 24 },
        { id: 'links', type: 'links' },
      ];

  const clean = {
    name: (updates.name || '').trim().substring(0, 100),
    username: (updates.username || '').trim().toLowerCase(),
    avatar: (updates.avatar || '').trim(),
    profileBanner: (updates.profileBanner || '').trim(),
    pageBackground,
    bio: (updates.bio || '').trim().substring(0, 500),
    location: updates.location ? updates.location.trim().substring(0, 100) : '',
    plan: updates.plan || 'free',
    theme,
    layoutStructure,
    customCSS: updates.customCSS || '',
    customJS: updates.customJS || '',
    seoMeta: updates.seoMeta || { title: '', description: '', keywords: '' },
    analyticsCode: updates.analyticsCode || '',
    discordId: updates.discordId,
    audioUrl: typeof updates.audioUrl === 'string' ? updates.audioUrl.trim() : '', // ← NEW
  };

  await db.collection('users').updateOne({ _id: uid }, { $set: clean });
}

// --- News Functions ---

export async function createNewsPost(title: string, content: string, imageUrl: string, authorId: string, authorName: string) {
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
    comments: [],
  };
  await db.collection('news').insertOne(post);
  return {
    id: post._id.toString(),
    title: post.title,
    content: post.content,
    imageUrl: post.imageUrl,
    authorName: post.authorName,
    publishedAt: post.publishedAt.toISOString(),
    likes: post.likes,
    comments: [],
  };
}

export async function getAllNewsPosts() {
  const db = await connectDB();
  const posts = await db.collection<NewsPostDoc>('news').find({}).sort({ publishedAt: -1 }).toArray();
  return posts.map(p => ({
    id: p._id.toString(),
    title: p.title,
    content: p.content,
    imageUrl: p.imageUrl,
    authorName: p.authorName,
    publishedAt: p.publishedAt.toISOString(),
    likes: p.likes,
    comments: (p.comments || []).map((c: { email: string; content: string; createdAt: Date }) => ({
      email: c.email,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
    })),
  }));
}

export async function getNewsPostById(id: string) {
  const db = await connectDB();
  try {
    const post = await db.collection<NewsPostDoc>('news').findOne({ _id: new ObjectId(id) });
    if (!post) return null;
    return {
      id: post._id.toString(),
      title: post.title,
      content: post.content,
      imageUrl: post.imageUrl || '',
      authorName: post.authorName,
      publishedAt: post.publishedAt.toISOString(),
      likes: post.likes,
      comments: (post.comments || []).map((c: { email: string; content: string; createdAt: Date }) => ({
        email: c.email,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error('Error fetching news post by ID:', error);
    return null;
  }
}

export async function updateNewsPostById(id: string, updates: { title?: string; content?: string; imageUrl?: string }) {
  const db = await connectDB();
  const oid = new ObjectId(id);

  const clean: any = {};
  if (updates.title !== undefined) clean.title = (updates.title || '').trim();
  if (updates.content !== undefined) clean.content = (updates.content || '').trim();
  if (updates.imageUrl !== undefined) {
    clean.imageUrl = updates.imageUrl?.trim() ? normalizeGifUrl(updates.imageUrl.trim()) : '';
  }

  const result = await db.collection('news').updateOne(
    { _id: oid },
    { $set: clean }
  );

  if (result.matchedCount === 0) return null;

  const updated = await db.collection<NewsPostDoc>('news').findOne({ _id: oid });
  if (!updated) return null;

  return {
    id: updated._id.toString(),
    title: updated.title,
    content: updated.content,
    imageUrl: updated.imageUrl || '',
    authorName: updated.authorName,
    publishedAt: updated.publishedAt.toISOString(),
    likes: updated.likes,
    comments: (updated.comments || []).map((c: any) => ({
      email: c.email,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
    })),
  };
}

export async function deleteNewsPostById(id: string) {
  const db = await connectDB();
  const oid = new ObjectId(id);
  const result = await db.collection('news').deleteOne({ _id: oid });
  return result.deletedCount > 0;
}

export async function addNewsInteraction(postId: string, email: string, type: 'like' | 'comment', content?: string) {
  const db = await connectDB();
  const postObjectId = new ObjectId(postId);

  try {
    const post = await db.collection<NewsPostDoc>('news').findOne({ _id: postObjectId });
    if (!post) throw new Error('Post not found');

    if (type === 'like') {
      const user = await db.collection<UserDoc>('users').findOne({ email });
      if (!user) throw new Error('User not found');
      await db.collection('news').updateOne(
        { _id: postObjectId },
        { $inc: { likes: 1 } }
      );
    } else if (type === 'comment') {
      if (!content?.trim()) throw new Error('Comment content is required');
      const comment = {
        email,
        content: content.trim(),
        createdAt: new Date(),
      };
      await db.collection('news').updateOne(
        { _id: postObjectId },
        { $push: { comments: comment } as PushOperator<NewsPostDoc> }
      );
    } else {
      throw new Error('Invalid interaction type');
    }

    const updatedPost = await db.collection<NewsPostDoc>('news').findOne({ _id: postObjectId });
    if (!updatedPost) throw new Error('Post not found after update');

    return {
      id: updatedPost._id.toString(),
      title: updatedPost.title,
      content: updatedPost.content,
      imageUrl: updatedPost.imageUrl || '',
      authorName: updatedPost.authorName,
      publishedAt: updatedPost.publishedAt.toISOString(),
      likes: updatedPost.likes,
      comments: (updatedPost.comments || []).map((c: { email: string; content: string; createdAt: Date }) => ({
        email: c.email,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
      })),
    };
  } catch (error: any) {
    console.error('Error adding news interaction:', error);
    throw new Error(error.message || 'Failed to add interaction');
  }
}

// --- User Management ---

export async function getAllUsers() {
  const db = await connectDB();
  const users = await db.collection<UserDoc>('users').find({ isBanned: { $ne: true } }).project({
    _id: 1, username: 1, name: 1, avatar: 1, profileBanner: 1, pageBackground: 1,
    bio: 1, location: 1, isBanned: 1, badges: 1, plan: 1, discordId: 1, audioUrl: 1,
  }).toArray();

  return users.map(user => ({
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
    audioUrl: user.audioUrl || undefined,
  }));
}

export async function updateUserById(id: string, updates: { name?: string; username?: string; email?: string }) {
  const db = await connectDB();
  const uid = new ObjectId(id);

  // Validate username uniqueness if provided
  if (updates.username) {
    const existing = await db.collection('users').findOne({
      username: updates.username.trim().toLowerCase(),
      _id: { $ne: uid }
    });
    if (existing) throw new Error('Username already taken');
  }

  // Validate email uniqueness if provided
  if (updates.email) {
    const existing = await db.collection('users').findOne({
      email: updates.email.trim().toLowerCase(),
      _id: { $ne: uid }
    });
    if (existing) throw new Error('Email already in use');
  }

  const cleanUpdates: any = {};
  if (updates.name !== undefined) cleanUpdates.name = (updates.name || '').trim().substring(0, 100);
  if (updates.username !== undefined) cleanUpdates.username = (updates.username || '').trim().toLowerCase();
  if (updates.email !== undefined) cleanUpdates.email = (updates.email || '').trim().toLowerCase();

  const result = await db.collection('users').updateOne(
    { _id: uid },
    { $set: cleanUpdates }
  );

  if (result.matchedCount === 0) return null;

  const updatedUser = await db.collection<UserDoc>('users').findOne({ _id: uid });
  if (!updatedUser) return null;

  return {
    id: updatedUser._id.toString(),
    name: updatedUser.name || '',
    username: updatedUser.username || '',
    email: updatedUser.email,
    avatar: updatedUser.avatar || '',
    profileBanner: updatedUser.profileBanner || '',
    pageBackground: normalizeGifUrl(updatedUser.pageBackground || '') || '',
    bio: updatedUser.bio || '',
    location: updatedUser.location || '',
    isBanned: updatedUser.isBanned || false,
    plan: updatedUser.plan || 'free',
    badges: updatedUser.badges || [],
    discordId: updatedUser.discordId,
    audioUrl: updatedUser.audioUrl || '',
  };
}

export async function deleteUserById(id: string) {
  const db = await connectDB();
  const uid = new ObjectId(id);

  // Delete user's related data first
  await db.collection('links').deleteMany({ userId: uid });
  await db.collection('widgets').deleteMany({ userId: uid });
  await db.collection('profile_visits').deleteMany({ userId: uid });

  // Finally delete the user
  const result = await db.collection('users').deleteOne({ _id: uid });
  return result.deletedCount > 0;
}

// --- Badge Management ---

export async function createBadge(name: string, icon: string) {
  const db = await connectDB();
  const badgeId = new ObjectId().toString();
  await db.collection('badges').insertOne({ id: badgeId, name, icon, createdAt: new Date().toISOString() });
  return { id: badgeId, name, icon };
}

export async function getAllBadges() {
  const db = await connectDB();
  const badges = await db.collection('badges').find({}).toArray();
  return badges.map((badge: any) => ({ id: badge.id, name: badge.name, icon: badge.icon }));
}

export async function addUserBadge(userId: string, badge: any) {
  const db = await connectDB();
  const userObjectId = new ObjectId(userId);
  await db.collection<UserDoc>('users').updateOne(
    { _id: userObjectId },
    { $push: { badges: { $each: [badge] } } as PushOperator<UserDoc> }
  );
}

export async function removeUserBadge(userId: string, badgeId: string) {
  const db = await connectDB();
  const userObjectId = new ObjectId(userId);
  await db.collection<UserDoc>('users').updateOne(
    { _id: userObjectId },
    { $pull: { badges: { id: badgeId } } as PullOperator<UserDoc> }
  );
}

/**
 * Delete a badge by ID and remove it from all users
 */
export async function deleteBadgeById(id: string) {
  const db = await connectDB();

  // Remove badge from all users who have it
  await db.collection<UserDoc>('users').updateMany(
    { "badges.id": id },
    { $pull: { badges: { id } } as PullOperator<UserDoc> }
  );

  // Delete the badge from the badges collection
  const result = await db.collection('badges').deleteOne({ id });

  if (result.deletedCount === 0) {
    throw new Error('Badge not found');
  }
}

// --- Ban Management ---

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

// --- Discord Integration ---

export async function createDiscordLinkCode(userId: string): Promise<string> {
  const db = await connectDB();
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await db.collection('discord_codes').insertOne({
    code,
    userId: new ObjectId(userId),
    used: false,
    createdAt: new Date(),
    expiresAt,
  });
  return code;
}
