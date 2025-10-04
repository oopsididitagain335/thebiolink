import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import mongoose from 'mongoose';

// Inline dbConnect function (to avoid separate file if not created)
// If you create lib/dbConnect.ts, move this there and import it.
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Inline User model (to avoid separate file if not created)
// If you create models/User.ts, move this there and import it.
const userSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  name: { type: String, maxlength: 100 },
  username: { type: String, maxlength: 30 },
  avatar: String,
  bio: { type: String, maxlength: 500 },
  background: String,
  isEmailVerified: { type: Boolean, default: true },
  plan: { type: String, default: 'free' },
  email: String,
  links: [{
    id: String,
    url: String,
    title: { type: String, maxlength: 100 },
    icon: String,
    position: Number
  }],
  widgets: [{
    id: String,
    type: { type: String, enum: ['spotify', 'youtube', 'twitter', 'custom'] },
    title: String,
    content: String,
    url: String,
    position: Number
  }],
  layoutStructure: [{
    id: String,
    type: { type: String, enum: ['bio', 'links', 'widget', 'spacer', 'custom'] },
    widgetId: String,
    height: Number,
    content: String
  }]
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

export async function PUT(request: NextRequest) {
  const sessionId = (await cookies()).get('biolink_session')?.value;
  if (!sessionId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect(); // Connect to the database

    const { profile, links, widgets } = await request.json();

    // Prepare the update object
    const updateData: any = {};

    if (profile) {
      updateData.name = profile.name;
      updateData.username = profile.username.toLowerCase();
      updateData.avatar = profile.avatar;
      updateData.bio = profile.bio;
      updateData.background = profile.background;
      updateData.layoutStructure = profile.layoutStructure;
    }

    if (Array.isArray(links)) {
      updateData.links = links;
    }

    if (Array.isArray(widgets)) {
      updateData.widgets = widgets;
    }

    // Find and update the user
    const updatedUser = await User.findOneAndUpdate(
      { sessionId }, // Identify user by sessionId
      { $set: updateData },
      { new: true, runValidators: true, upsert: true } // Upsert if not found, but typically user exists
    );

    if (!updatedUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Update error:', error.message);
    return Response.json({ error: error.message || 'Failed to update data' }, { status: 400 });
  }
}
