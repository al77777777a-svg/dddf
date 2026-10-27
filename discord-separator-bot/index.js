const fs = require('node:fs');
const path = require('node:path');
const {
  Client,
  GatewayIntentBits,
  Events,
  AttachmentBuilder,
} = require('discord.js');

// ---------- Config (set these as Variables on Railway) ----------
const TOKEN = process.env.DISCORD_TOKEN;
// Channels the bot works in, comma-separated IDs: 123,456
const CHANNEL_IDS = (process.env.CHANNEL_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
// Reactions to add, comma-separated. Unicode or custom: ⭐,<:name:123456789>
const REACTIONS = (process.env.REACTIONS || '⭐')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
// Fallback only. Discord CDN links expire, so prefer the local GIF file.
const SEPARATOR_URL = process.env.SEPARATOR_URL || '';
const SEPARATOR_FILE = path.join(__dirname, 'vola-separator.gif');
// -----------------------------------------------------------------

if (!TOKEN) {
  console.error('Missing DISCORD_TOKEN environment variable.');
  process.exit(1);
}
if (CHANNEL_IDS.length === 0) {
  console.warn('CHANNEL_IDS is empty, so the bot will not react anywhere.');
}

const hasSeparatorFile = fs.existsSync(SEPARATOR_FILE);
if (!hasSeparatorFile && !SEPARATOR_URL) {
  console.warn('No vola-separator.gif file and no SEPARATOR_URL: separator disabled.');
}

// No MessageContent intent needed, so no "disallowed intents" crash.
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.once(Events.ClientReady, (c) => {
  console.log(`Logged in as ${c.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
  if (!message.guild || message.author.bot) return;
  if (!CHANNEL_IDS.includes(message.channelId)) return;

  // 1) Reactions
  for (const emoji of REACTIONS) {
    try {
      await message.react(emoji);
    } catch (err) {
      console.error(`Could not react with "${emoji}":`, err.message);
    }
  }

  // 2) Separator
  try {
    if (hasSeparatorFile) {
      await message.channel.send({ files: [new AttachmentBuilder(SEPARATOR_FILE)] });
    } else if (SEPARATOR_URL) {
      await message.channel.send({ content: SEPARATOR_URL });
    }
  } catch (err) {
    console.error('Could not send separator:', err.message);
  }
});

client.on(Events.Error, (err) => console.error('Client error:', err));
process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));

client.login(TOKEN);
