// lib/storage.ts
import { MongoClient, ObjectId, Db } from 'mongodb';
import bcrypt from 'bcryptjs';
import Stripe from 'stripe'; // Import Stripe

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20', // Use the latest stable API version
});

// - Main App DB Connection (MONGODB_URI) -
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
    cachedDb = cachedClient.db(); // Uses default database from MONGODB_URI
  }

  return cachedDb;
}

// - Subscription DB Connection (MONGO_URI) -
let subscriptionClient: MongoClient | null = null;
let subscriptionDb: Db | null = null;

export async function connectSubscriptionDB() {
  if (subscriptionDb && subscriptionClient) return { client: subscriptionClient, db: subscriptionDb };

  if (!subscriptionClient) {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not set for subscription database');
    }
    subscriptionClient = new MongoClient(process.env.MONGO_URI);
    await subscriptionClient.connect();
  }

  if (!subscriptionDb) {
    subscriptionDb = subscriptionClient.db(); // Uses default DB from MONGO_URI
  }

  return { client: subscriptionClient, db: subscriptionDb };
}

// - User Functions (Node.js only) -

export async function getUserByUsername(username: string) {
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
    background: user.background || '', // ✅ Background field
    isEmailVerified: user.isEmailVerified || false,
    createdAt: user.createdAt || new Date().toISOString(),
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
      background: user.background || '', // ✅ Background field
      isEmailVerified: user.isEmailVerified || false,
      createdAt: user.createdAt || new Date().toISOString(),
      passwordHash: user.passwordHash,
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
    background, // ✅ Save background
    ipAddress,
    isEmailVerified: true,
    createdAt: new Date()
  });

  // --- CRITICAL: Create user entry in subscription DB immediately after creation ---
  try {
    const { db: subsDb } = await connectSubscriptionDB();
    // Create an initial subscription document with the user ID
    // The document will be updated later by the webhook or manually if needed
    await subsDb.collection('subscriptions').updateOne(
      { userId: userId.toString() }, // Match by the user ID string
      { $setOnInsert: { userId: userId.toString(), status: 'none', createdAt: new Date() } }, // Only set these fields on insert
      { upsert: true }
    );
  } catch (error) {
    console.error('Error creating user entry in subscription DB:', error);
    // Decide: Should we rollback user creation if this fails? For now, log and continue.
  }

  return {
    id: userId.toString(),
    email,
    username,
    name,
    background, // ✅ Return background
    isEmailVerified: true,
    createdAt: new Date().toISOString()
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
    background: user.background || '', // ✅ Return background
    isEmailVerified: user.isEmailVerified || false,
    createdAt: user.createdAt || new Date().toISOString(),
    passwordHash: user.passwordHash
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

// ✅ FIXED updateUserProfile with proper null check and background handling
// ✅ ALSO ensures user ID exists in subscription DB
export async function updateUserProfile(userId: string, updates: any) {
  const database = await connectDB();
  const objectId = new ObjectId(userId);

  const cleanedUpdates = {
    name: updates.name?.trim() || '',
    username: updates.username?.trim().toLowerCase() || '',
    avatar: updates.avatar?.trim() || '',
    bio: updates.bio?.trim() || '',
    background: updates.background?.trim() || '' // ✅ Handle background
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

  // --- CRITICAL: Ensure user entry exists in subscription DB on profile update ---
  try {
    const { db: subsDb } = await connectSubscriptionDB();
    await subsDb.collection('subscriptions').updateOne(
      { userId: userId }, // Match by the user ID string
      { $setOnInsert: { userId: userId, status: 'none', createdAt: new Date() } }, // Only set these fields on insert
      { upsert: true }
    );
  } catch (error) {
    console.error('Error ensuring user entry in subscription DB:', error);
    // Log error but don't necessarily fail the profile update
  }

  // --- Crucial: Fetch the updated user document ---
  const updatedUserDocument = await database.collection('users').findOne({ _id: objectId });

  // --- Crucial: Null check for updatedUserDocument ---
  if (!updatedUserDocument) {
    // This is an unexpected error, but TS requires the check.
    console.error(`Failed to retrieve user after update for ID: ${userId}`);
    throw new Error('User not found after update');
  }
  // --- End Null Check ---

  const links = await database.collection('links').find({ userId: objectId }).toArray();

  // --- Return the updated user data including background ---
  return {
    _id: updatedUserDocument._id.toString(),
    id: updatedUserDocument._id.toString(),
    username: updatedUserDocument.username,
    name: updatedUserDocument.name || '',
    email: updatedUserDocument.email || '',
    avatar: updatedUserDocument.avatar || '',
    bio: updatedUserDocument.bio || '',
    background: updatedUserDocument.background || '', // ✅ Return background
    isEmailVerified: updatedUserDocument.isEmailVerified || false,
    createdAt: updatedUserDocument.createdAt || new Date().toISOString(),
    passwordHash: updatedUserDocument.passwordHash,
    links: links.map((link: any) => ({
      id: link._id.toString(),
      url: link.url || '',
      title: link.title || '',
      icon: link.icon || '',
      position: link.position || 0
    })).sort((a: any, b: any) => a.position - b.position)
  };
}

// --- Subscription-related functions (using MONGO_URI) ---

export async function getSubscriptionByUserId(userId: string) {
  const { db } = await connectSubscriptionDB();
  const subscription = await db.collection('subscriptions').findOne({ userId });
  return subscription;
}

export async function createOrUpdateSubscription(subscriptionData: any) {
  const { db } = await connectSubscriptionDB();
  const result = await db.collection('subscriptions').replaceOne(
    { userId: subscriptionData.userId },
    { ...subscriptionData, updatedAt: new Date() },
    { upsert: true }
  );
  return result;
}

// --- Stripe Dynamic Pricing ---

// Define the PlanDetails type
export type PlanDetails = {
  id: string; // Stripe Price ID (e.g., price_xxx)
  productId: string; // Stripe Product ID (e.g., prod_xxx)
  name: string; // Product name (e.g., "Basic Plan")
  description: string; // Product description
  amount: number; // Price amount in smallest currency unit (e.g., cents for USD)
  currency: string; // Currency code (e.g., "usd")
  interval: string; // Billing interval (e.g., "month", "year")
  intervalCount: number; // Number of intervals (e.g., 1 for monthly, 12 for yearly)
  active: boolean; // Whether the price is active
  metadata: Record<string, string>; // Any metadata you added in Stripe
  // Add other fields as needed from Stripe.Price
};

/**
 * Fetches active subscription plans (products and their default prices) from Stripe dynamically.
 * @returns An array of PlanDetails objects.
 */
export async function getDynamicStripePlans(): Promise<PlanDetails[]> {
  try {
    // List active prices from Stripe
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'], // Expand the product data for each price
      limit: 100, // Adjust limit as needed
    });

    const planDetails: PlanDetails[] = [];

    for (const price of prices.data) {
      if (price.type === 'recurring' && price.product && typeof price.product !== 'string') {
        // Ensure the product is expanded and not just an ID string
        planDetails.push({
          id: price.id,
          productId: price.product.id,
          name: price.product.name || 'Unnamed Plan',
          description: price.product.description || '',
          amount: price.unit_amount || 0, // Amount in cents
          currency: price.currency,
          interval: price.recurring?.interval || 'month',
          intervalCount: price.recurring?.interval_count || 1,
          active: price.active,
          metadata: price.metadata, // Useful for plan features/benefits
        });
      }
    }

    // Sort plans by amount (or any other criteria you prefer)
    planDetails.sort((a, b) => a.amount - b.amount);

    return planDetails;
  } catch (error) {
    console.error('Error fetching Stripe plans:', error);
    // In production, you might want to log the error and return an empty array
    // or a specific error indicator, rather than fallback plans.
    // For now, re-throwing to let the caller handle it.
    throw error; 
  }
}
