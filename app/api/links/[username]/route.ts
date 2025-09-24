import fs from 'fs/promises';
import path from 'path';

// Get persistent data directory
const getDataDir = () => {
  return process.env.NODE_ENV === 'production' 
    ? '/var/data' 
    : path.join(process.cwd(), 'data');
};

// Ensure directory exists
const ensureDir = async (dir: string) => {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
};

// User storage paths
const getUsersDir = () => path.join(getDataDir(), 'users');
const getUserFile = (id: string) => path.join(getUsersDir(), `${id}.json`);
const getEmailIndexFile = () => path.join(getDataDir(), 'email_index.json');
const getUsernameIndexFile = () => path.join(getDataDir(), 'username_index.json');

// Link storage paths
const getLinksDir = () => path.join(getDataDir(), 'links');
const getUserLinksFile = (userId: string) => path.join(getLinksDir(), `${userId}.json`);

// Simple ID generator (no uuid dependency)
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

// Initialize storage
export async function initStorage() {
  await ensureDir(getUsersDir());
  await ensureDir(getLinksDir());
  
  // Create index files if they don't exist
  try {
    await fs.access(getEmailIndexFile());
  } catch {
    await fs.writeFile(getEmailIndexFile(), JSON.stringify({}));
  }
  
  try {
    await fs.access(getUsernameIndexFile());
  } catch {
    await fs.writeFile(getUsernameIndexFile(), JSON.stringify({}));
  }
}

// Save user
export async function saveUser(user: any) {
  await ensureDir(getUsersDir());
  
  // Update email index
  const emailIndex = JSON.parse(await fs.readFile(getEmailIndexFile(), 'utf8'));
  emailIndex[user.email] = user.id;
  await fs.writeFile(getEmailIndexFile(), JSON.stringify(emailIndex, null, 2));
  
  // Update username index
  const usernameIndex = JSON.parse(await fs.readFile(getUsernameIndexFile(), 'utf8'));
  usernameIndex[user.username] = user.id;
  await fs.writeFile(getUsernameIndexFile(), JSON.stringify(usernameIndex, null, 2));
  
  // Save user file
  await fs.writeFile(getUserFile(user.id), JSON.stringify(user, null, 2));
}

// Get user by ID
export async function getUserById(id: string): Promise<any> {
  try {
    const data = await fs.readFile(getUserFile(id), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error('User not found');
  }
}

// Get user by email
export async function getUserByEmail(email: string): Promise<any | null> {
  try {
    const index = JSON.parse(await fs.readFile(getEmailIndexFile(), 'utf8'));
    const userId = index[email];
    if (!userId) return null;
    return await getUserById(userId);
  } catch {
    return null;
  }
}

// Get user by username
export async function getUserByUsername(username: string): Promise<any | null> {
  try {
    const index = JSON.parse(await fs.readFile(getUsernameIndexFile(), 'utf8'));
    const userId = index[username];
    if (!userId) return null;
    
    const user = await getUserById(userId);
    const linksFile = getUserLinksFile(userId);
    
    let links: any[] = [];
    try {
      const linksData = await fs.readFile(linksFile, 'utf8');
      links = JSON.parse(linksData);
    } catch {
      // No links file exists yet
    }
    
    return { ...user, links };
  } catch {
    return null;
  }
}

// Create new user
export async function createUser(email: string, password: string, username: string, name: string) {
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error('Email already in use');
  }
  
  const existingUsername = await getUserByUsername(username);
  if (existingUsername) {
    throw new Error('Username already taken');
  }
  
  const id = generateId();
  const user = {
    id,
    email,
    username,
    name,
    passwordHash: password, // In production, hash this with bcrypt
    createdAt: new Date().toISOString()
  };
  
  await saveUser(user);
  return user;
}

// Save user links
export async function saveUserLinks(userId: string, links: any[]) {
  await ensureDir(getLinksDir());
  await fs.writeFile(getUserLinksFile(userId), JSON.stringify(links, null, 2));
}

// Update user profile
export async function updateUserProfile(userId: string, updates: any) {
  const user = await getUserById(userId);
  
  // Check for username conflicts
  if (updates.username && updates.username !== user.username) {
    const existing = await getUserByUsername(updates.username);
    if (existing) {
      throw new Error('Username already taken');
    }
  }
  
  const updatedUser = { ...user, ...updates };
  await saveUser(updatedUser);
  return updatedUser;
}
