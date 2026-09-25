const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');

const token = process.env.DISCORD_TOKEN;
const reviewChannelId = process.env.REVIEW_CHANNEL_ID || '1447978433178239211';
const proofsChannelId = process.env.PROOFS_CHANNEL_ID || '1551213877717639181';
const reviewReactionId = process.env.REVIEW_REACTION_ID || '1550600087833673930';
const proofsReactionId = process.env.PROOFS_REACTION_ID || '1550607999805030490';
const separatorFile = process.env.SEPARATOR_FILE || './separator.webp';

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
  if (message.author.bot) return;

  const isReview = message.channel.id === reviewChannelId;
  const isProofs = message.channel.id === proofsChannelId;
  if (!isReview && !isProofs) return;

  try {
    await message.react(isReview ? reviewReactionId : proofsReactionId);
  } catch (error) {
    console.error('Could not add reaction:', error.message);
  }

  if (!isReview) return;

  try {
    await message.channel.send({
      files: [new AttachmentBuilder(separatorFile, { name: 'separator.webp' })]
    });
  } catch (error) {
    console.error('Could not send separator:', error.message);
  }
});

client.login(token);
