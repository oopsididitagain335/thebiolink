// lib/storage.ts
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import bcrypt from 'bcryptjs';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

// Get user by username (for public bio pages)
export async function getUserByUsername(username: string) {
  try {
    // Get user ID from username index
    const usernameDoc = await getDoc(doc(db, 'usernames', username));
    if (!usernameDoc.exists()) return null;
    
    const { userId } = usernameDoc.data();
    
    // Get user profile
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return null;
    
    const userData = userDoc.data();
    
    // Get links
    const linksSnapshot = await getDocs(collection(db, 'users', userId, 'links'));
    const links = linksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Return combined data for bio page
    return {
      name: userData.name || '',
      avatar: userData.avatar || '',
      bio: userData.bio || '',
      links: links.sort((a: any, b: any) => a.position - b.position)
    };
  } catch (error) {
    console.error('Error fetching user by username:', error);
    return null;
  }
}

// Create new user
export async function createUser(email: string, password: string, username: string, name: string) {
  // Check for existing email
  const emailQuery = query(collection(db, 'emails'), where('email', '==', email));
  const emailSnapshot = await getDocs(emailQuery);
  if (!emailSnapshot.empty) {
    throw new Error('Email already registered');
  }
  
  // Check for existing username
  const usernameDoc = await getDoc(doc(db, 'usernames', username));
  if (usernameDoc.exists()) {
    throw new Error('Username already taken');
  }
  
  const passwordHash = await bcrypt.hash(password, 12);
  const userId = generateId();
  
  // Use batch write for atomic operation
  const batch = writeBatch(db);
  
  // Create user document
  batch.set(doc(db, 'users', userId), {
    id: userId,
    email,
    username,
    name,
    passwordHash,
    isEmailVerified: false,
    emailVerificationToken: generateId(),
    createdAt: new Date().toISOString(),
  });
  
  // Create email index
  batch.set(doc(db, 'emails', email), { userId });
  
  // Create username index
  batch.set(doc(db, 'usernames', username), { userId });
  
  await batch.commit();
  
  return { id: userId, email, username, name };
}

// Get user by email (for login)
export async function getUserByEmail(email: string) {
  const q = query(collection(db, 'emails'), where('email', '==', email));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) return null;
  
  const { userId } = querySnapshot.docs[0].data();
  const userDoc = await getDoc(doc(db, 'users', userId));
  
  return userDoc.exists() ? userDoc.data() : null;
}

// Save user links
export async function saveUserLinks(userId: string, links: any[]) {
  const linksRef = collection(db, 'users', userId, 'links');
  const linksSnapshot = await getDocs(linksRef);
  
  // Delete existing links
  const batch = writeBatch(db);
  linksSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  // Add new links
  links.forEach((link, index) => {
    const linkId = link.id || generateId();
    batch.set(doc(db, 'users', userId, 'links', linkId), {
      ...link,
      position: index
    });
  });
  
  await batch.commit();
}

// Update user profile
export async function updateUserProfile(userId: string, updates: any) {
  // Check username uniqueness if changing
  if (updates.username) {
    const existing = await getDoc(doc(db, 'usernames', updates.username));
    if (existing.exists()) {
      throw new Error('Username already taken');
    }
  }
  
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, updates);
  
  // Update username index if needed
  if (updates.username) {
    const oldUser = await getDoc(userRef);
    const oldUsername = oldUser.data()?.username;
    
    if (oldUsername && oldUsername !== updates.username) {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'usernames', oldUsername));
      batch.set(doc(db, 'usernames', updates.username), { userId });
      await batch.commit();
    }
  }
  
  return { ...updates };
}
