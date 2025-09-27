// lib/storage.ts (add these functions)

// --- VIEW COUNT FUNCTIONS ---

// Get view count for a user
export async function getViewCount(username: string) {
  const database = await connectDB();
  
  try {
    const viewDoc = await database.collection('views').findOne({ username });
    return viewDoc ? viewDoc.count : 0;
  } catch {
    return 0;
  }
}

// Increment view count for a user
export async function incrementViewCount(username: string) {
  const database = await connectDB();
  
  try {
    const result = await database.collection('views').updateOne(
      { username },
      { $inc: { count: 1 } },
      { upsert: true } // Create document if it doesn't exist
    );
    
    // If no document was modified, it was created (count is now 1)
    if (result.modifiedCount === 0 && result.upsertedCount === 1) {
      return 1;
    }
    
    // Otherwise, return the new count
    const viewDoc = await database.collection('views').findOne({ username });
    return viewDoc ? viewDoc.count : 1;
  } catch {
    return 0;
  }
}

// Get all view counts (admin only)
export async function getAllViewCounts() {
  const database = await connectDB();
  
  try {
    const views = await database.collection('views').find({}).toArray();
    return views.map((view: any) => ({
      username: view.username,
      count: view.count || 0
    }));
  } catch {
    return [];
  }
}

// Reset view count for a user (admin only)
export async function resetViewCount(username: string) {
  const database = await connectDB();
  
  try {
    await database.collection('views').deleteOne({ username });
    return true;
  } catch {
    return false;
  }
}
