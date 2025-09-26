// Add these functions to your existing lib/storage.ts

// ✅ Ban a user
export async function banUser(userId: string) {
  const database = await connectDB();
  const objectId = new ObjectId(userId);

  await database.collection('users').updateOne(
    { _id: objectId },
    { 
      $set: { 
        isBanned: true, 
        bannedAt: new Date().toISOString() 
      } 
    }
  );
}

// ✅ Unban a user
export async function unbanUser(userId: string) {
  const database = await connectDB();
  const objectId = new ObjectId(userId);

  await database.collection('users').updateOne(
    { _id: objectId },
    { 
      $set: { 
        isBanned: false 
      },
      $unset: { 
        bannedAt: "" 
      } 
    }
  );
}
