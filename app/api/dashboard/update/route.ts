import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/dbConnect'; // Assume you have a dbConnect function to connect to MongoDB
import User from '@/models/User'; // Assume you have a User model defined with Mongoose

export async function PUT(request: NextRequest) {
  const sessionId = (await cookies()).get('biolink_session')?.value;
  if (!sessionId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect(); // Connect to the database

    const { profile, links, widgets } = await request.json();

    // Prepare the update object
    const updateData: any = {};

    if (profile) {
      updateData.name = profile.name;
      updateData.username = profile.username;
      updateData.avatar = profile.avatar;
      updateData.bio = profile.bio;
      updateData.background = profile.background;
      updateData.layoutStructure = profile.layoutStructure;
    }

    if (Array.isArray(links)) {
      updateData.links = links;
    }

    if (Array.isArray(widgets)) {
      updateData.widgets = widgets;
    }

    // Find and update the user
    const updatedUser = await User.findOneAndUpdate(
      { sessionId }, // Assuming sessionId is a field in the User model to identify the user
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Update error:', error.message);
    return Response.json({ error: error.message || 'Failed to update data' }, { status: 400 });
  }
}
