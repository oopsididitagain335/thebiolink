// app/api/messages/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // ✅ Adjust this path to match your auth config

// Replace these with your actual database functions
async function getUserByUsername(username: string) {
  // Example using Prisma:
  // return await prisma.user.findUnique({ where: { username } });

  // For demo/testing: simulate a valid user
  if (username === 'testuser') {
    return { id: 'user_123', username };
  }
  return null;
}

async function createMessage(data: { fromId: string; toId: string; content: string }) {
  // Example using Prisma:
  // return await prisma.message.create({ data });

  // For now, just log it
  console.log('📨 New message:', data);
  return { id: 'msg_' + Date.now(), ...data };
}

export async function POST(request: NextRequest) {
  try {
    // 🔐 Authentication (required)
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 📥 Parse request body
    const body = await request.json();
    const { to: username, content } = body;

    // 🧪 Validate input
    if (!username || typeof username !== 'string' || !/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
      return NextResponse.json({ error: 'Invalid username format' }, { status: 400 });
    }

    if (!content || typeof content !== 'string' || content.length < 1 || content.length > 500) {
      return NextResponse.json({ error: 'Message must be 1–500 characters' }, { status: 400 });
    }

    // 👤 Find recipient
    const recipient = await getUserByUsername(username);
    if (!recipient) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 🚫 Prevent self-messaging
    if (recipient.id === session.user.id) {
      return NextResponse.json({ error: 'You cannot message yourself' }, { status: 400 });
    }

    // 💾 Save message
    await createMessage({
      fromId: session.user.id,
      toId: recipient.id,
      content: content.trim(),
    });

    // ✅ Success
    return NextResponse.json(
      { success: true, message: 'Message sent successfully!' },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Message API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
