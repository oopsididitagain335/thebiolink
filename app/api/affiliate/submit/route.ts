// src/app/api/affiliate/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Parse JSON body
    const body = await req.json();

    // Define and validate required fields
    const requiredFields = [
      'discordUsername',
      'biolinkUsername',
      'socials',
      'communities',
      'position',
    ] as const;

    for (const field of requiredFields) {
      if (!body[field] || (typeof body[field] === 'string' && !body[field].trim())) {
        return NextResponse.json(
          { error: `Missing or empty required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Get webhook URL from environment (server-only)
    const webhookUrl = process.env.FORTNITE_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error('FORTNITE_WEBHOOK_URL is not defined in environment variables');
      return NextResponse.json(
        { error: 'Server misconfiguration: webhook URL missing' },
        { status: 500 }
      );
    }

    // Construct Discord embed
    const embed = {
      title: '🆕 New Affiliate Program Application',
      color: 0x5865F2, // Discord blurple
      fields: [
        {
          name: 'Discord Username',
          value: body.discordUsername.trim(),
          inline: true,
        },
        {
          name: 'BioLink Username',
          value: body.biolinkUsername.trim(),
          inline: true,
        },
        {
          name: 'Social Media Links',
          value: body.socials.trim() || 'Not provided',
        },
        {
          name: 'Communities (≥3)',
          value: body.communities.trim(),
        },
        {
          name: 'Position / Role',
          value: body.position.trim() || 'Not specified',
        },
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Submitted via The BioLink Dashboard',
      },
    };

    // Send to Discord webhook
    const discordRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    });

    // Handle Discord API response
    if (!discordRes.ok) {
      const errorText = await discordRes.text();
      console.error('Discord webhook error:', errorText);
      return NextResponse.json(
        { error: 'Failed to deliver application to Discord' },
        { status: 500 }
      );
    }

    // Success
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Affiliate submission server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
