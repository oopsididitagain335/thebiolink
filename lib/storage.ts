import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';

// Use sync mkdir to avoid EACCES permission errors on Render Disk
const { mkdirSync } = require('fs');

// Get persistent data directory
const getDataDir = () => {
  return process.env.NODE_ENV === 'production' 
    ? '/var/data' 
    : path.join(process.cwd(), 'data');
};

// Ensure directory exists with proper permissions
const ensureDir = (dir: string) => {
  try {
    mkdirSync(dir, { recursive: true, mode: 0o755 });
  } catch (error) {
    // Directory might already exist
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
};

// Storage paths
const getUsersDir = () => path.join(getDataDir(), 'users');
const getUserFile = (id: string) => path.join(getUsersDir(), `${id}.json`);
const getEmailIndexFile = () => path.join(getDataDir(), 'email_index.json');
const getUsernameIndexFile = () => path.join(getDataDir(), 'username_index.json');
const getLinksDir = () => path.join(getDataDir(), 'links');
const getUserLinksFile = (userId: string) => path.join(getLinksDir(), `${userId}.json`);

// Simple ID generator (no uuid dependency)
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

// Initialize storage on server start
export async function initStorage() {
  ensureDir(getDataDir());
  ensureDir(getUsersDir());
  ensureDir(getLinksDir());
  
  // Initialize index files
  const indexFiles = [getEmailIndexFile(), getUsernameIndexFile()];
  for (const file of indexFiles) {
    try {
      await fs.access(file);
    } catch {
      await fs.writeFile(file, JSON.stringify({}), { mode: 0o644 });
    }
  }
}

// Save user with indexes
export async function saveUser(user: any) {
  ensureDir(getUsersDir());
  
  // Update email index
  const emailIndex = JSON.parse(await fs.readFile(getEmailIndexFile(), 'utf8'));
  emailIndex[user.email] = user.id;
  await fs.writeFile(getEmailIndexFile(), JSON.stringify(emailIndex, null, 2), { mode: 0o644 });
  
  // Update username index
  const usernameIndex = JSON.parse(await fs.readFile(getUsernameIndexFile(), 'utf8'));
  usernameIndex[user.username] = user.id;
  await fs.writeFile(getUsernameIndexFile(), JSON.stringify(usernameIndex, null, 2), { mode: 0o644 });
  
  // Save user file
  await fs.writeFile(getUserFile(user.id), JSON.stringify(user, null, 2), { mode: 0o644 });
}

// Get user by ID
export async function getUserById(id: string) {
  try {
    const data = await fs.readFile(getUserFile(id), 'utf8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// Get user by email
export async function getUserByEmail(email: string) {
  try {
    const index = JSON.parse(await fs.readFile(getEmailIndexFile(), 'utf8'));
    const userId = index[email];
    return userId ? getUserById(userId) : null;
  } catch {
    return null;
  }
}

// Get user by username
export async function getUserByUsername(username: string) {
  try {
    const index = JSON.parse(await fs.readFile(getUsernameIndexFile(), 'utf8'));
    const userId = index[username];
    if (!userId) return null;
    
    const user = await getUserById(userId);
    const linksFile = getUserLinksFile(userId);
    
    let links = [];
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

// Create new user (enforces 1:1 email/username)
export async function createUser(email: string, password: string, username: string, name: string) {
  // Check for existing email
  if (await getUserByEmail(email)) {
    throw new Error('Email already registered');
  }
  
  // Check for existing username
  if (await getUserByUsername(username)) {
    throw new Error('Username already taken');
  }
  
  const passwordHash = await bcrypt.hash(password, 12);
  const id = generateId();
  
  const user = {
    id,
    email,
    username,
    name,
    passwordHash,
    isEmailVerified: false,
    emailVerificationToken: generateId(),
    createdAt: new Date().toISOString(),
  };
  
  await saveUser(user);
  return user;
}

// Save user links
export async function saveUserLinks(userId: string, links: any[]) {
  ensureDir(getLinksDir());
  await fs.writeFile(getUserLinksFile(userId), JSON.stringify(links, null, 2), { mode: 0o644 });
}

// Update user profile
export async function updateUserProfile(userId: string, updates: any) {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  
  // Check for username conflicts
  if (updates.username && updates.username !== user.username) {
    if (await getUserByUsername(updates.username)) {
      throw new Error('Username already taken');
    }
  }
  
  const updatedUser = { ...user, ...updates };
  await saveUser(updatedUser);
  return updatedUser;
}

// Verify email
export async function verifyUserEmail(token: string) {
  const usersDir = getUsersDir();
  ensureDir(usersDir);
  
  try {
    const files = await fs.readdir(usersDir);
    for (const file of files) {
      const userPath = path.join(usersDir, file);
      const user = JSON.parse(await fs.readFile(userPath, 'utf8'));
      
      if (user.emailVerificationToken === token) {
        user.isEmailVerified = true;
        user.emailVerificationToken = null;
        await saveUser(user);
        return user;
      }
    }
  } catch (error) {
    console.error('Email verification error:', error);
  }
  
  return null;
}
