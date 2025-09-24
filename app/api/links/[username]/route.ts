import { NextRequest } from 'next/server';
import { saveUser, getUser } from '@/lib/storage';
import { z } from 'zod';

const UserInputSchema = z.object({
  name: z.string().min(1).max(50),
  avatar: z.string().url().optional(),
  bio: z.string().max(200).optional(),
  links: z.array(
    z.object({
      url: z.string().url(),
      title: z.string().min(1),
      icon: z.string().optional()
    })
  ).max(20)
});

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const user = await getUser(params.username);
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response(JSON.stringify(user), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const body = await request.json();
    const validatedData = UserInputSchema.parse(body);
    
    // Add username to data
    const userData = {
      username: params.username,
      ...validatedData,
      links: validatedData.links.map((link, index) => ({
        ...link,
        id: `link-${Date.now()}-${index}`,
        position: index
      }))
    };
    
    await saveUser(userData);
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Save error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof z.ZodError 
        ? 'Validation failed' 
        : 'Failed to save data' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
