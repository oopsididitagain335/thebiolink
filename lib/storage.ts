// lib/storage.ts
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';
import { generateId } from './utils';

const getDataDir = () => {
  return process.env.NODE_ENV === 'production' 
    ? '/var/data' 
    : path.join(process.cwd(), 'data');
};

const ensureDir = async (dir: string) => {
  try { await fs.access(dir); } 
  catch { await fs.mkdir(dir, { recursive: true }); }
};

const getUsersDir = () => path.join(getDataDir(), 'users');
const getUserFile = (id: string) => path.join(getUsersDir(), `${id}.json`);
const getEmailIndexFile = () => path.join(getDataDir(), 'email_index.json');
const getUsernameIndexFile = () => path.join(getDataDir(), 'username_index.json');
const getLinksDir = () => path.join(getDataDir(), 'links');
const getUserLinksFile = (userId: string) => path.join(getLinksDir(), `${userId}.json`);

export async function initStorage() {
  await ensureDir(getUsersDir());
  await ensureDir(getLinksDir());
  
  for (const file of [getEmailIndexFile(), getUsernameIndexFile()]) {
    try { await fs.access(file); } 
    catch { await fs.writeFile(file, JSON.stringify({})); }
  }
}

export async function saveUser(user: any) {
  await ensureDir(getUsersDir());
  
  const emailIndex = JSON.parse(await fs.readFile(getEmailIndexFile(), 'utf8'));
  emailIndex[user.email] = user.id;
  await fs.writeFile(getEmailIndexFile(), JSON.stringify(emailIndex, null, 2));
  
  const usernameIndex = JSON.parse(await fs.readFile(getUsernameIndexFile(), 'utf8'));
  usernameIndex[user.username] = user.id;
  await fs.writeFile(getUsernameIndexFile(), JSON.stringify(usernameIndex, null, 2));
  
  await fs.writeFile(getUserFile(user.id), JSON.stringify(user, null, 2));
}

export async function getUserById(id: string) {
  try {
    const data = await fs.readFile(getUserFile(id), 'utf8');
    return JSON.parse(data);
  } catch { return null; }
}

export async function getUserByEmail(email: string) {
  try {
    const index = JSON.parse(await fs.readFile(getEmailIndexFile(), 'utf8'));
    return index[email] ? getUserById(index[email]) : null;
  } catch { return null; }
}

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
    } catch {}
    
    return { ...user, links };
  } catch { return null; }
}

// Create user with password hashing
export async function createUser(email: string, password: string, username: string, name: string) {
  if (await getUserByEmail(email)) {
    throw new Error('Email already registered');
  }
  
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
    emailVerificationToken: generateId(), // For verification link
    createdAt: new Date().toISOString(),
  };
  
  await saveUser(user);
  return user;
}

export async function saveUserLinks(userId: string, links: any[]) {
  await ensureDir(getLinksDir());
  await fs.writeFile(getUserLinksFile(userId), JSON.stringify(links, null, 2));
}

export async function updateUserProfile(userId: string, updates: any) {
  const user = await getUserById(userId);
  
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
  const files = await fs.readdir(usersDir);
  
  for (const file of files) {
    const user = JSON.parse(await fs.readFile(path.join(usersDir, file), 'utf8'));
    if (user.emailVerificationToken === token) {
      user.isEmailVerified = true;
      user.emailVerificationToken = null;
      await saveUser(user);
      return user;
    }
  }
  return null;
}
