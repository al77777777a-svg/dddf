const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const token = process.env.DISCORD_TOKEN;
const channelId = process.env.CHANNEL_ID || '1447978433178239211';
const separatorFile = process.env.SEPARATOR_FILE || './separator.webp';
const reactionId = process.env.REACTION_ID || '1553117153857765477';
if (!token) {
  console.error('Missing DISCORD_TOKEN environment variable.');
  process.exit(1);
}
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});
client.on('messageCreate', async (message) => {
  if (message.author.bot || message.channel.id !== channelId) return;
  try {
    await message.react(reactionId);
    await message.channel.send({
      files: [new AttachmentBuilder(separatorFile, { name: 'separator.webp' })]
    });
  } catch (error) {
    console.error('Could not send separator:', error.message);
  }
});
client.login(token);
