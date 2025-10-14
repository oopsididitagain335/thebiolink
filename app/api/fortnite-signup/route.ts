// app/api/fortnite-signup/route.ts
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const webhookUrl = process.env.FORTNITE_WEBHOOK_URL;

  if (!webhookUrl) {
    return Response.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  try {
    const body = await req.json();

    // Basic server-side validation
    if (
      !body.username ||
      !body.discordUser ||
      !body.discordId ||
      !body.email ||
      !body.age ||
      !body.region
    ) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate age
    const age = parseInt(body.age, 10);
    if (isNaN(age) || age < 13 || age > 99) {
      return Response.json({ error: 'Invalid age' }, { status: 400 });
    }

    // Validate Discord ID (17-20 digits)
    if (!/^\d{17,20}$/.test(body.discordId)) {
      return Response.json({ error: 'Invalid Discord ID' }, { status: 400 });
    }

    // Format Discord embed
    const embed = {
      title: '🆕 New Tournament Signup',
      color: 0x8B5CF6,
      fields: [
        { name: 'Fortnite Username', value: body.username, inline: true },
        { name: 'Discord', value: body.discordUser, inline: true },
        { name: 'Discord ID', value: `\`${body.discordId}\``, inline: false },
        { name: 'Email', value: body.email, inline: true },
        { name: 'Age', value: String(age), inline: true },
        { name: 'Region', value: body.region, inline: true },
      ],
      timestamp: new Date().toISOString(),
    };

    // Send to Discord
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (!res.ok) {
      console.error('Discord webhook failed:', await res.text());
      return Response.json({ error: 'Failed to send to Discord' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Signup error:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
