// lib/storage.ts
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import bcrypt from 'bcryptjs';

// Simple ID generator
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

// Save user
export async function saveUser(user: any) {
  const userRef = doc(db, 'users', user.id);
  await setDoc(userRef, user);
}

// Get user by ID
export async function getUserById(id: string) {
  const userRef = doc(db, 'users', id);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? userSnap.data() : null;
}

// Get user by email
export async function getUserByEmail(email: string) {
  const q = query(collection(db, 'users'), where('email', '==', email));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.length > 0 ? querySnapshot.docs[0].data() : null;
}

// Get user by username
export async function getUserByUsername(username: string) {
  const q = query(collection(db, 'users'), where('username', '==', username));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.docs.length === 0) return null;
  
  const user = querySnapshot.docs[0].data();
  
  // Get links
  const linksRef = collection(db, 'users', user.id, 'links');
  const linksSnapshot = await getDocs(linksRef);
  const links = linksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  return { ...user, links };
}

// Create new user
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
  // First, clear existing links
  const linksRef = collection(db, 'users', userId, 'links');
  const linksSnapshot = await getDocs(linksRef);
  for (const doc of linksSnapshot.docs) {
    await doc.ref.delete();
  }
  
  // Add new links
  for (let i = 0; i < links.length; i++) {
    const linkRef = doc(db, 'users', userId, 'links', links[i].id || generateId());
    await setDoc(linkRef, { ...links[i], position: i });
  }
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
  
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, updates);
  return { ...user, ...updates };
}

// Verify email
export async function verifyUserEmail(token: string) {
  const q = query(collection(db, 'users'), where('emailVerificationToken', '==', token));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.docs.length === 0) return null;
  
  const user = querySnapshot.docs[0].data();
  const userRef = doc(db, 'users', user.id);
  
  await updateDoc(userRef, {
    isEmailVerified: true,
    emailVerificationToken: null
  });
  
  return { ...user, isEmailVerified: true, emailVerificationToken: null };
}
