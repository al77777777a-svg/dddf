const { Client, GatewayIntentBits } = require('discord.js');

const token = process.env.DISCORD_TOKEN;
const channelId = process.env.CHANNEL_ID || '1551213877717639181';
const reactionId = process.env.REACTION_ID || '1550607999805030490';

if (!token) {
  console.error('Missing DISCORD_TOKEN environment variable.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  if (message.author.bot || message.channel.id !== channelId) return;

  try {
    await message.react(reactionId);
  } catch (error) {
    console.error('Could not add reaction:', error.message);
  }
});

client.login(token);
