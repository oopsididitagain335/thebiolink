// lib/db.ts
import { MongoClient, ObjectId } from 'mongodb';

let client: MongoClient;
let db: any;

export async function connectDB() {
  if (!db) {
    client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    db = client.db('biolink');
  }
  return db;
}

export async function getUserByEmail(email: string) {
  const db = await connectDB();
  return await db.collection('users').findOne({ email });
}

export async function updateUserPlan(email: string, plan: string) {
  const db = await connectDB();
  await db.collection('users').updateOne(
    { email },
    { $set: { plan, updatedAt: new Date() } }
  );
}

export async function updateUserPassword(email: string, hashedPassword: string) {
  const db = await connectDB();
  await db.collection('users').updateOne(
    { email },
    { $set: { password: hashedPassword, updatedAt: new Date() } }
  );
}
