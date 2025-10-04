// app/api/settings/route.ts
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { 
  updateUserEmail, 
  updateUserPassword, 
  cancelUserSubscription,
  awardWeeklyFreeBadge 
} from '@/lib/storage';

export async function PUT(request: NextRequest) {
  const sessionId = (await cookies()).get('biolink_session')?.value;
  if (!sessionId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action, email, password } = await request.json();

    switch (action) {
      case 'update_email':
        if (!email) return Response.json({ error: 'Email required' }, { status: 400 });
        await updateUserEmail(sessionId, email);
        break;
        
      case 'update_password':
        if (!password) return Response.json({ error: 'Password required' }, { status: 400 });
        await updateUserPassword(sessionId, password);
        break;
        
      case 'cancel_subscription':
        await cancelUserSubscription(sessionId);
        break;
        
      case 'claim_weekly_badge':
        const result = await awardWeeklyFreeBadge(sessionId);
        return Response.json({ success: true, ...result });
        
      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Settings error:', error.message);
    return Response.json({ error: error.message || 'Failed to update settings' }, { status: 400 });
  }
}
