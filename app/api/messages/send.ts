// pages/api/messages/send.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

// Mock DB helpers — replace with your real DB logic
const getUserByUsername = async (username: string) => {
  // Example: return await db.user.findUnique({ where: { username } });
  // For demo, assume "testuser" exists
  if (username === 'testuser') {
    return { _id: 'user_123', username };
  }
  return null;
};

const saveMessage = async (fromId: string, toId: string, content: string) => {
  // Example: await db.message.create({ data: { fromId, toId, content } });
  console.log(`[Message] ${fromId} → ${toId}: ${content}`);
  return true;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSession({ req });
  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { to, content } = req.body;

  if (!to || typeof to !== 'string' || !/^[a-zA-Z0-9_-]{3,30}$/.test(to)) {
    return res.status(400).json({ error: 'Invalid username format' });
  }

  if (!content || typeof content !== 'string' || content.length < 1 || content.length > 500) {
    return res.status(400).json({ error: 'Message must be 1–500 characters' });
  }

  const recipient = await getUserByUsername(to);
  if (!recipient) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (recipient._id === session.user.id) {
    return res.status(400).json({ error: 'Cannot message yourself' });
  }

  try {
    await saveMessage(session.user.id, recipient._id, content);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Send message error:', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
}
