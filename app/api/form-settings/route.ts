import { NextResponse } from 'next/server';
import { updateUserFormEmails } from '@/lib/storage';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // adjust this import if your auth file is in a different path

export async function POST(req: Request) {
  try {
    // ✅ 1. Verify authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // ✅ 2. Parse and validate request body
    const { emails } = await req.json();

    if (!Array.isArray(emails)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // ✅ 3. Update in MongoDB
    const result = await updateUserFormEmails(userId, emails);

    // ✅ 4. Respond success
    return NextResponse.json({
      success: true,
      formEmails: result.formEmails,
    });
  } catch (error: any) {
    console.error('❌ Error updating form settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
