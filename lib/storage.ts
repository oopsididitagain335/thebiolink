// In updateUserProfile function, add background field
export async function updateUserProfile(userId: string, updates: any) {
  const database = await connectDB();
  const objectId = new ObjectId(userId);
  
  // Validate background URL if provided
  if (updates.background) {
    try {
      const url = new URL(updates.background);
      if (!url.hostname.includes('giphy.com') && !url.hostname.includes('tenor.com') && !url.hostname.includes('media.giphy.com')) {
        throw new Error('Only Giphy and Tenor GIFs allowed');
      }
      if (!updates.background.endsWith('.gif')) {
        throw new Error('Only GIF files allowed');
      }
    } catch {
      throw new Error('Invalid GIF URL. Must be from Giphy or Tenor');
    }
  }
  
  await database.collection('users').updateOne(
    { _id: objectId },
    { $set: updates }
  );
  
  // ... rest of function
}
