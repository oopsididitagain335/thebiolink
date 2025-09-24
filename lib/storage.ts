import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';

// Define data schemas
const LinkSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  title: z.string().min(1),
  icon: z.string().optional(),
  position: z.number().int().min(0)
});

const UserSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9]+$/),
  name: z.string().min(1).max(50),
  avatar: z.string().url().optional(),
  bio: z.string().max(200).optional(),
  links: z.array(LinkSchema).max(20)
});

export type User = z.infer<typeof UserSchema>;

// Get persistent data directory
const getDataDir = () => {
  // Use Render Disk if available, otherwise fallback to local (for dev)
  return process.env.NODE_ENV === 'production' 
    ? '/var/data' 
    : path.join(process.cwd(), 'data');
};

// Get shard path for a username
const getShardPath = (username: string) => {
  const firstChar = username.charAt(0).toLowerCase();
  return path.join(getDataDir(), 'shards', firstChar);
};

// Get user file path
const getUserFilePath = (username: string) => {
  const shardPath = getShardPath(username);
  return path.join(shardPath, `${username}.json`);
};

// Ensure directory exists
const ensureDir = async (dir: string) => {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
};

// Save user data atomically
export const saveUser = async (userData: User) => {
  const validatedData = UserSchema.parse(userData);
  const filePath = getUserFilePath(validatedData.username);
  const dir = path.dirname(filePath);
  
  await ensureDir(dir);
  
  // Write to temp file first, then rename (atomic operation)
  const tempPath = `${filePath}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(validatedData, null, 2));
  await fs.rename(tempPath, filePath);
};

// Get user data
export const getUser = async (username: string): Promise<User | null> => {
  try {
    const filePath = getUserFilePath(username);
    const data = await fs.readFile(filePath, 'utf8');
    return UserSchema.parse(JSON.parse(data));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null; // File doesn't exist
    }
    throw error;
  }
};

// List all users (for admin/debugging)
export const listUsers = async (): Promise<string[]> => {
  try {
    const shardsDir = path.join(getDataDir(), 'shards');
    const letters = await fs.readdir(shardsDir);
    let users: string[] = [];
    
    for (const letter of letters) {
      const letterPath = path.join(shardsDir, letter);
      const files = await fs.readdir(letterPath);
      users = users.concat(files.map(file => file.replace('.json', '')));
    }
    
    return users;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []; // No users yet
    }
    throw error;
  }
};
