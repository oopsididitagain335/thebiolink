// lib/db.ts
import mongoose from 'mongoose';

let isConnected = false;

export async function connectToDB() {
  if (!isConnected) {
    await mongoose.connect(process.env.MONGODB_URI!);
    isConnected = true;
  }
}

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  plan: { type: String, default: 'free' }, // 'free', 'basic', 'premium', 'fwiend'
  stripeCustomerId: String,
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export async function getUserByEmail(email: string) {
  await connectToDB();
  return User.findOne({ email });
}

export async function updateUserPlan(email: string, plan: string, customerId: string | null = null) {
  await connectToDB();
  await User.findOneAndUpdate({ email }, { plan, stripeCustomerId: customerId });
}
