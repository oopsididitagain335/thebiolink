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
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import bcrypt from 'bcryptjs';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

// GET USER BY ID (was missing!)
export async function getUserById(userId: string) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    return null;
  }
}

// Get user by username (for public bio pages)
export async function getUserByUsername(username: string) {
  try {
    const usernameDoc = await getDoc(doc(db, 'usernames', username));
    if (!usernameDoc.exists()) return null;
    
    const { userId } = usernameDoc.data();
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return null;
    
    const userData = userDoc.data();
    const linksSnapshot = await getDocs(collection(db, 'users', userId, 'links'));
    const links = linksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      name: userData.name || '',
      avatar: userData.avatar || '',
      bio: userData.bio || '',
      links: links.sort((a: any, b: any) => a.position - b.position)
    };
  } catch (error) {
    return null;
  }
}

// Create new user
export async function createUser(email: string, password: string, username: string, name: string) {
  const emailQuery = query(collection(db, 'emails'), where('email', '==', email));
  const emailSnapshot = await getDocs(emailQuery);
  if (!emailSnapshot.empty) {
    throw new Error('Email already registered');
  }
  
  const usernameDoc = await getDoc(doc(db, 'usernames', username));
  if (usernameDoc.exists()) {
    throw new Error('Username already taken');
  }
  
  const passwordHash = await bcrypt.hash(password, 12);
  const userId = generateId();
  
  const batch = writeBatch(db);
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
  batch.set(doc(db, 'emails', email), { userId });
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
  
  const batch = writeBatch(db);
  linksSnapshot.docs.forEach(doc => batch.delete(doc.ref));
  
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
  if (updates.username) {
    const existing = await getDoc(doc(db, 'usernames', updates.username));
    if (existing.exists()) {
      throw new Error('Username already taken');
    }
  }
  
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, updates);
  
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

// VERIFY EMAIL FUNCTION (was missing!)
export async function verifyUserEmail(token: string) {
  try {
    const q = query(collection(db, 'users'), where('emailVerificationToken', '==', token));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;
    
    await updateDoc(doc(db, 'users', userId), {
      isEmailVerified: true,
      emailVerificationToken: null
    });
    
    return { ...userDoc.data(), id: userId };
  } catch (error) {
    return null;
  }
}
