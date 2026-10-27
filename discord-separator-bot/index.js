'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {
  Client,
  GatewayIntentBits,
  Events,
  AttachmentBuilder,
  PermissionFlagsBits,
} = require('discord.js');

// ---------------- Config (Railway -> Variables) ----------------
// Only DISCORD_TOKEN is required. Everything else has a default.
// Old variable names (TOKEN, CHANNEL_ID, REACTION_ID...) still work.
const env = (...names) => {
  for (const n of names) if (process.env[n] && process.env[n].trim()) return process.env[n].trim();
  return '';
};
const list = (v) => v.split(',').map((s) => s.trim()).filter(Boolean);

const TOKEN = env('DISCORD_TOKEN', 'TOKEN', 'BOT_TOKEN');
const GUILD_ID = env('GUILD_ID'); // optional: restrict to one server
const CHANNEL_IDS = list(env('CHANNEL_IDS', 'CHANNEL_ID', 'REVIEW_CHANNEL_ID') || '1447978433178239211');
// Reactions: unicode (⭐), custom <:name:id>, or a bare emoji ID. Comma-separated.
const REACTIONS = list(env('REACTIONS', 'REACTION_ID', 'REVIEW_REACTION_ID') || '1550600087833673930');
const FALLBACK_REACTION = env('FALLBACK_REACTION') || '⭐'; // used if the custom emoji is unusable
const INTERVAL = Math.max(1, Number(env('SEPARATOR_INTERVAL')) || 1); // separator after every N messages
const SEPARATOR_ENABLED = env('SEPARATOR_ENABLED') !== 'false';
const SEPARATOR_FILE = path.resolve(__dirname, env('SEPARATOR_FILE') || 'separator.gif');
const SEPARATOR_URL = env('SEPARATOR_URL'); // fallback only (Discord CDN links expire)
// ---------------------------------------------------------------

if (!TOKEN) {
  console.error('Missing DISCORD_TOKEN. Add it in Railway -> Variables.');
  process.exit(1);
}

// No privileged intents: the bot never reads message text, so no
// "Used disallowed intents" crash and no Developer Portal toggles needed.
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

const warned = new Set();
const warnOnce = (key, text) => {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(text);
};
const logErr = (area, err) => {
  const hint =
    err && err.code === 50013 ? ' (Missing Permissions: check channel permissions)'
    : err && err.code === 50001 ? ' (Missing Access: bot cannot see this channel)'
    : '';
  console.error(`[${area}] ${(err && (err.code || err.message)) || err}${hint}`);
};

async function addReaction(message, emoji) {
  try {
    await message.react(emoji);
  } catch (err) {
    const permissionProblem = err && (err.code === 50013 || err.code === 50001);
    if (!permissionProblem && emoji !== FALLBACK_REACTION) {
      warnOnce(
        'emoji:' + emoji,
        `Emoji "${emoji}" is not usable (the bot must be in the server that owns it). Using ${FALLBACK_REACTION} instead.`
      );
      try {
        await message.react(FALLBACK_REACTION);
        return;
      } catch (err2) {
        return logErr('reaction', err2);
      }
    }
    logErr('reaction', err);
  }
}

async function sendSeparator(channel) {
  try {
    if (fs.existsSync(SEPARATOR_FILE)) {
      const name = 'vola-separator' + path.extname(SEPARATOR_FILE);
      await channel.send({ files: [new AttachmentBuilder(SEPARATOR_FILE, { name })] });
    } else if (SEPARATOR_URL) {
      await channel.send({ content: SEPARATOR_URL });
    } else {
      warnOnce('nosep', `Separator file not found: ${SEPARATOR_FILE}`);
    }
  } catch (err) {
    logErr('separator', err);
  }
}

const counters = new Map();
const queues = new Map();

async function handle(message) {
  for (const emoji of REACTIONS) await addReaction(message, emoji);
  if (!SEPARATOR_ENABLED) return;
  const n = (counters.get(message.channelId) || 0) + 1;
  if (n < INTERVAL) return void counters.set(message.channelId, n);
  counters.set(message.channelId, 0);
  await sendSeparator(message.channel);
}

client.on(Events.MessageCreate, (message) => {
  if (message.author.bot || message.system || !message.guild) return;
  if (GUILD_ID && message.guildId !== GUILD_ID) return;
  if (!CHANNEL_IDS.includes(message.channelId)) return;
  // One queue per channel keeps reaction -> separator in the right order.
  const previous = queues.get(message.channelId) || Promise.resolve();
  queues.set(
    message.channelId,
    previous.then(() => handle(message)).catch((err) => logErr('handler', err))
  );
});

client.once(Events.ClientReady, async (c) => {
  console.log(`Logged in as ${c.user.tag}`);
  console.log('Channels :', CHANNEL_IDS.join(', '));
  console.log('Reactions:', REACTIONS.join(' '), `(fallback ${FALLBACK_REACTION})`);
  console.log('Separator:', SEPARATOR_ENABLED
    ? (fs.existsSync(SEPARATOR_FILE) ? `${path.basename(SEPARATOR_FILE)} every ${INTERVAL} message(s)` : 'FILE MISSING')
    : 'disabled');

  const need = ['ViewChannel', 'SendMessages', 'AttachFiles', 'AddReactions', 'ReadMessageHistory'];
  for (const id of CHANNEL_IDS) {
    const ch = await c.channels.fetch(id).catch(() => null);
    if (!ch || !ch.guild) {
      console.error(`❌ Channel ${id}: not found / no access. Is the bot in that server?`);
      continue;
    }
    const me = await ch.guild.members.fetchMe().catch(() => null);
    const perms = me && ch.permissionsFor(me);
    const missing = need.filter((p) => !perms || !perms.has(PermissionFlagsBits[p]));
    console.log(missing.length ? `❌ #${ch.name}: missing ${missing.join(', ')}` : `✅ #${ch.name}: permissions OK`);
  }
});

client.on(Events.Error, (err) => logErr('client', err));
process.on('unhandledRejection', (err) => logErr('unhandledRejection', err));

client.login(TOKEN).catch((err) => {
  console.error('Login failed:', err.message);
  process.exit(1);
});
