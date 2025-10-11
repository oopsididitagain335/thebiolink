// app/api/messages/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // Adjust path to your auth config

// Mock DB helpers — replace with real logic
const getUserByUsername = async (username: string) => {
  // Example: return await db.user.findUnique({ where: { username } });
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

export async function POST(request: NextRequest) {
  try {
    // Get session (if using auth)
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { to, content } = await request.json();

    if (!to || typeof to !== 'string' || !/^[a-zA-Z0-9_-]{3,30}$/.test(to)) {
      return NextResponse.json(
        { error: 'Invalid username format' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string' || content.length < 1 || content.length > 500) {
      return NextResponse.json(
        { error: 'Message must be 1–500 characters' },
        { status: 400 }
      );
    }

    const recipient = await getUserByUsername(to);
    if (!recipient) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (recipient._id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot message yourself' },
        { status: 400 }
      );
    }

    await saveMessage(session.user.id, recipient._id, content);

    return NextResponse.json(
      { success: true, message: 'Message sent!' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
