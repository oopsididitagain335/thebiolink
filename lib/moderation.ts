// lib/moderation.ts
import { MongoClient, ObjectId } from 'mongodb';

// --- Prohibited Words List ---
const PROHIBITED_WORDS = [
  'nigger', 'nigga', 'faggot', 'paki', 'chink', 'gook', 'spic', 'coon',
  'dyke', 'tranny', 'kike', 'homo', 'retard', 'cunt', 'bitch', 'whore',
  'slut', 'rape', 'rapist', 'pedo', 'pedophile', 'incest', 'bestiality'
];

// --- Blacklisted IPs ---
const BLACKLISTED_IPS = [
  // Add known spammer/scammer IPs here
  // '123.456.789.000',
  // '987.654.321.000'
];

// --- IP Pattern Regex (Detects private/local IPs) ---
const IP_PATTERN_REGEX = /\b(?:10\.|172\.(?:1[6-9]|2[0-9]|3[01])\.|192\.168\.|127\.0\.0\.1)\d{1,3}\.\d{1,3}\b/g;

// --- Check for prohibited words ---
export function containsProhibitedWords(text: string): boolean {
  if (!text) return false;
  
  const lowerText = text.toLowerCase();
  return PROHIBITED_WORDS.some(word => 
    lowerText.includes(word) || 
    new RegExp(`\\b${word}\\b`, 'gi').test(lowerText)
  );
}

// --- Check for IP patterns ---
export function containsIPPatterns(text: string): boolean {
  if (!text) return false;
  
  // Check for IP address patterns
  return IP_PATTERN_REGEX.test(text);
}

// --- Check for blacklisted IP ---
export function isBlacklistedIP(ip: string): boolean {
  return BLACKLISTED_IPS.includes(ip);
}

// --- Add IP to blacklist ---
export async function addToBlacklist(ip: string) {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const db = client.db();
  
  try {
    await db.collection('blacklisted_ips').insertOne({
      ip,
      addedAt: new Date().toISOString()
    });
  } finally {
    await client.close();
  }
}

// --- Get all blacklisted IPs ---
export async function getBlacklistedIPs(): Promise<string[]> {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const db = client.db();
  
  try {
    const ips = await db.collection('blacklisted_ips').find({}).toArray();
    return ips.map((ip: any) => ip.ip);
  } finally {
    await client.close();
  }
}

// --- Ban user by ID ---
export async function banUserAutomatically(userId: string, reason: string) {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const db = client.db();
  
  try {
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          isBanned: true, 
          bannedAt: new Date().toISOString(),
          banReason: reason // Store ban reason
        } 
      }
    );
  } finally {
    await client.close();
  }
}
