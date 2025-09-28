// lib/storage.ts
import { ObjectId } from 'mongodb';
import { db } from './db'; // ← Your MongoDB connection (returns { db })

// Get user by ID (already exists in your code)
export async function getUserById(id: string) {
  if (!ObjectId.isValid(id)) return null;
  return await db.collection('users').findOne({ _id: new ObjectId(id) });
}

// ✅ NEW: Get referral stats for ALL users (including 0-count)
export async function getReferralStats() {
  try {
    // Fetch all users
    const allUsers = await db.collection('users').find(
      {},
      { projection: { _id: 1, username: 1 } }
    ).toArray();

    // Count referrals per referrer
    const referralCounts = await db.collection('referrals')
      .aggregate([
        { $group: { _id: '$referrerId', count: { $sum: 1 } } }
      ])
      .toArray();

    const countMap = new Map<string, number>();
    referralCounts.forEach((item: any) => {
      const idStr = item._id.toString();
      countMap.set(idStr, item.count);
    });

    return allUsers.map(user => ({
      userId: user._id.toString(),
      username: user.username || 'unknown',
      usageCount: countMap.get(user._id.toString()) || 0,
    }));
  } catch (error) {
    console.error('getReferralStats error:', error);
    return [];
  }
}
