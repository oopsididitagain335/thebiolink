// src/bot/index.js
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let cachedDb = null;

async function connectDB() {
  if (cachedDb) return cachedDb;
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI not set');
  }
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  cachedDb = client.db();
  return cachedDb;
}

client.once('ready', () => {
  console.log(`Discord Bot is ready! Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Command: !connect <code>
  if (message.content.startsWith('!connect')) {
    const args = message.content.split(' ');
    if (args.length !== 2) {
      return message.reply('Please provide a valid connection code. Usage: `!connect <code>`');
    }

    const code = args[1].trim();
    const db = await connectDB();
    const collection = db.collection('discord_codes');

    // Find the code
    const codeDoc = await collection.findOne({ code });

    if (!codeDoc) {
      return message.reply('Invalid or expired code.');
    }

    // Check if already used
    if (codeDoc.used) {
      return message.reply('This code has already been used.');
    }

    // Mark as used
    await collection.updateOne(
      { code },
      { $set: { used: true, usedAt: new Date(), userId: message.author.id } }
    );

    // Link Discord ID to BioLink user
    const usersCollection = db.collection('users');
    await usersCollection.updateOne(
      { _id: new ObjectId(codeDoc.userId) },
      { $set: { discordId: message.author.id } }
    );

    // Send success embed
    const embed = new EmbedBuilder()
      .setTitle('✅ Account Connected!')
      .setDescription(`Your Discord account (${message.author.tag}) is now linked to your BioLink profile.`)
      .setColor('#00FF00')
      .setFooter({ text: 'You can now use Discord features with your BioLink account.' })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  }
});

// Start the bot
client.login(process.env.DISCORD_BOT_TOKEN).catch(console.error);
