// bot/index.js
const { Client, GatewayIntentBits } = require('discord.js');
const { MongoClient, ObjectId } = require('mongodb');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let db = null;

async function getDB() {
  if (db) return db;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is missing');
  const mongo = new MongoClient(uri);
  await mongo.connect();
  db = mongo.db();
  return db;
}

client.once('ready', () => {
  console.log(`✅ Discord bot online as ${client.user.tag}`);
});

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;

  if (msg.content.startsWith('!connect')) {
    const args = msg.content.trim().split(/\s+/);
    if (args.length !== 2) {
      return msg.reply('Usage: `!connect ABC123`');
    }

    const code = args[1].trim().toUpperCase();
    const database = await getDB();
    const codes = database.collection('discord_codes');

    const doc = await codes.findOne({
      code,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!doc) {
      return msg.reply('❌ Invalid or expired code.');
    }

    // Mark as used + link Discord ID
    await codes.updateOne(
      { _id: doc._id },
      { $set: { used: true, usedAt: new Date(), discordId: msg.author.id } }
    );

    await database.collection('users').updateOne(
      { _id: new ObjectId(doc.userId) },
      { $set: { discordId: msg.author.id } }
    );

    await msg.author.send('✅ Your Discord account is now linked to your BioLink profile!')
      .catch(() => msg.reply('✅ Account linked!'));
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down bot...');
  await client.destroy();
  process.exit(0);
});

// Start bot
const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error('❌ DISCORD_BOT_TOKEN is missing!');
  process.exit(1);
}

client.login(token).catch(err => {
  console.error('❌ Bot login failed:', err);
  process.exit(1);
});
