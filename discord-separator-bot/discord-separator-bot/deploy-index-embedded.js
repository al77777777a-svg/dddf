'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {
  Client, GatewayIntentBits, AttachmentBuilder, EmbedBuilder,
  SlashCommandBuilder, ActivityType, PermissionFlagsBits, ChannelType
} = require('discord.js');

const token = process.env.DISCORD_TOKEN;
if (!token) { console.error('Missing DISCORD_TOKEN'); process.exit(1); }
const id = {
  guild: process.env.GUILD_ID || '1447961768776437795',
  review: process.env.REVIEW_CHANNEL_ID || '1447978433178239211',
  proofs: process.env.PROOFS_CHANNEL_ID || '1551213877717639181'
};
const brand = {
  name: process.env.BRAND_NAME || 'Vola Store',
  invite: process.env.STORE_INVITE || 'https://discord.gg/l-a',
  footer: process.env.BRAND_FOOTER || 'Made by mste'
};
const dataDir = process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, '.data');
fs.mkdirSync(dataDir, { recursive: true });
const dataFile = path.join(dataDir, 'settings.json');
const fallbackImage = path.resolve(__dirname, process.env.SEPARATOR_FILE || 'separator.webp');
const packagedSeparator = path.resolve(__dirname, 'separator-oryn-final.webp');
const packagedSeparatorVersion = 'oryn-2026-09-27';
const packagedSeparatorData = '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';
if (!fs.existsSync(packagedSeparator)) fs.writeFileSync(packagedSeparator, Buffer.from(packagedSeparatorData, 'base64'));
const maxImage = 8 * 1024 * 1024;
let settings = load();
let count = { messages: 0, reactions: 0, separators: 0, errors: 0 };
let separatorCounter = 0;
const queue = new Map();
const seen = new Set();
let lastError = 'none';

function defaults() {
  return {
    reviewChannel: id.review,
    proofsChannel: id.proofs,
    reviewEmoji: process.env.REVIEW_REACTION_ID || '1550600087833673930',
    proofsEmoji: process.env.PROOFS_REACTION_ID || '1550607999805030490',
    interval: Number(process.env.SEPARATOR_INTERVAL || 1),
    reviewEnabled: true,
    proofsEnabled: true,
    separatorEnabled: true,
    separatorFile: null,
    statusMode: process.env.STATUS_MODE || 'auto',
    statusText: process.env.STATUS_TEXT || brand.name + ' • /help',
    statusUrl: process.env.STATUS_URL || null,
    subscriptionExpiresAt: null
  };
}
function load() {
  let loaded;
  try { loaded = Object.assign(defaults(), JSON.parse(fs.readFileSync(dataFile, 'utf8'))); } catch { loaded = defaults(); }
  if (!loaded.separatorVersion) {
    loaded.separatorFile = packagedSeparator;
    loaded.separatorVersion = packagedSeparatorVersion;
  }
  return loaded;
}
function save() { const tmp = dataFile + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(settings, null, 2), { mode: 0o600 }); fs.renameSync(tmp, dataFile); }
save();
if (!settings.subscriptionExpiresAt) { const configured = Date.parse(process.env.SUBSCRIPTION_EXPIRES_AT || ''); settings.subscriptionExpiresAt = Number.isFinite(configured) ? configured : Date.now() + Math.max(1, Number(process.env.SUBSCRIPTION_DAYS || 30)) * 86400000; save(); }
function subscriptionActive() { return Number(settings.subscriptionExpiresAt) > Date.now(); }
function subscriptionDaysLeft() { return Math.max(0, Math.ceil((Number(settings.subscriptionExpiresAt) - Date.now()) / 86400000)); }
function subscriptionText() { const when = new Date(Number(settings.subscriptionExpiresAt)).toLocaleString('en-GB', { timeZone: 'Asia/Dubai' }); return subscriptionActive() ? '🟢 الاشتراك فعال' + String.fromCharCode(10) + 'المتبقي: ' + subscriptionDaysLeft() + ' يوم' + String.fromCharCode(10) + 'ينتهي: ' + when : '🔴 الاشتراك منتهي' + String.fromCharCode(10) + 'انتهى: ' + when + String.fromCharCode(10) + 'استخدم /renew بعد الدفع.'; }
function log(area, error) { count.errors++; lastError = area + ': ' + (error.code || error.message || 'error'); console.error('[' + area + '] ' + lastError); }
function imageType(buffer) {
  if (!buffer || buffer.length > maxImage) throw new Error('الصورة لازم تكون أقل من 8MB.');
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png';
  if (/^GIF8[79]a$/.test(buffer.subarray(0, 6).toString('ascii'))) return 'gif';
  if (buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) return 'jpg';
  if (buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') return 'webp';
  throw new Error('الملف لازم يكون PNG أو GIF أو JPG أو WEBP.');
}
async function readImage(attachment) {
  if (!attachment || !attachment.url) throw new Error('ارفع ملفًا مع الأمر.');
  const url = new URL(attachment.url);
  if (url.protocol !== 'https:' || !['cdn.discordapp.com', 'media.discordapp.net'].includes(url.hostname) || !url.pathname.startsWith('/attachments/')) throw new Error('ارفع الملف كمرفق داخل دسكورد.');
  if (attachment.size > maxImage) throw new Error('الملف لازم يكون أقل من 8MB.');
  const response = await fetch(url, { redirect: 'error' });
  if (!response.ok) throw new Error('تعذر تحميل الملف.');
  const chunks = []; let size = 0;
  for await (const chunk of response.body) { size += chunk.length; if (size > maxImage) throw new Error('الملف كبير.'); chunks.push(chunk); }
  const buffer = Buffer.concat(chunks); imageType(buffer); return buffer;
}
function separator() {
  const file = settings.separatorFile && fs.existsSync(settings.separatorFile) ? settings.separatorFile : fallbackImage;
  if (!fs.existsSync(file)) throw new Error('ارفع صورة الفاصل أولًا باستخدام /setimage.');
  return new AttachmentBuilder(file, { name: 'vola-separator' + path.extname(file) });
}
function parseEmoji(value) {
  const text = String(value || '').trim();
  if (!text) throw new Error('اكتب إيموجي واحد.');
  if (/^<a?:[\w~]+:\d{17,20}>$/.test(text) || /^\d{17,20}$/.test(text)) return text;
  try { const url = new URL(text); if (url.hostname === 'cdn.discordapp.com' && /^\/emojis\/\d{17,20}\.(png|gif|webp)$/.test(url.pathname)) return url.pathname.split('/')[2].split('.')[0]; } catch {}
  if ([...text].length <= 3) return text;
  throw new Error('اكتب إيموجي، رقمه، أو رابط CDN من دسكورد.');
}
function embed(title, body) { return new EmbedBuilder().setColor(0xc3c7ce).setTitle(brand.name + '  /  ' + title).setDescription(body).setFooter({ text: brand.footer + ' • v2.0' }).setTimestamp(); }
function admin(i) { return i.memberPermissions && i.memberPermissions.has(PermissionFlagsBits.ManageGuild); }
function owner(i) { const o = client.application.owner; return o && (o.id === i.user.id || o.members && o.members.has(i.user.id)); }
function channel(target) { return target === 'review' ? settings.reviewChannel : settings.proofsChannel; }
function targetOption(o) { return o.setName('target').setDescription('الروم').setRequired(true).addChoices({ name: 'Review', value: 'review' }, { name: 'Proofs', value: 'proofs' }); }
function cmd(name, description, isAdmin) { const c = new SlashCommandBuilder().setName(name).setDescription(description).setDMPermission(false); if (isAdmin) c.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild); return c; }
const commands = [
  cmd('help', 'دليل البوت وروابط المتجر'),
  cmd('setup', 'إعداد تلقائي للرومات والفواصل', true),
  cmd('subscription', 'عرض حالة الاشتراك'),
  cmd('renew', 'تجديد الاشتراك لعدد من الأيام', true).addIntegerOption(o => o.setName('days').setDescription('عدد الأيام').setRequired(true).setMinValue(1).setMaxValue(3650)),
  cmd('panel', 'لوحة إعدادات الإدارة', true),
  cmd('stats', 'حالة البوت والإحصائيات', true),
  cmd('diagnose', 'فحص الرومات والصلاحيات', true),
  cmd('test', 'تجربة الفاصل الحالي', true),
  cmd('setimage', 'تغيير صورة أو GIF الفاصل', true).addAttachmentOption(o => o.setName('image').setDescription('PNG GIF JPG WEBP أقل من 8MB').setRequired(true)),
  cmd('setreaction', 'تغيير ريأكشن Review أو Proofs', true).addStringOption(o => o.setName('emoji').setDescription('إيموجي أو رقمه أو رابط CDN').setRequired(true).setMaxLength(300)).addStringOption(targetOption),
  cmd('setchannel', 'تغيير روم Review أو Proofs', true).addStringOption(targetOption).addChannelOption(o => o.setName('channel').setDescription('روم نصي').addChannelTypes(ChannelType.GuildText).setRequired(true)),
  cmd('interval', 'الفاصل بعد عدد من الرسائل', true).addIntegerOption(o => o.setName('messages').setDescription('من 1 إلى 100').setRequired(true).setMinValue(1).setMaxValue(100)),
  cmd('toggle', 'تشغيل أو إيقاف ميزة', true).addStringOption(o => o.setName('feature').setDescription('الميزة').setRequired(true).addChoices({ name: 'Review', value: 'review' }, { name: 'Proofs', value: 'proofs' }, { name: 'الفاصل', value: 'separator' })).addBooleanOption(o => o.setName('enabled').setDescription('تشغيل أو إيقاف').setRequired(true)),
  cmd('status', 'تغيير حالة البوت', true).addStringOption(o => o.setName('mode').setDescription('النوع').setRequired(true).addChoices({ name: 'تلقائي', value: 'auto' }, { name: 'Watching', value: 'watching' }, { name: 'Playing', value: 'playing' }, { name: 'Listening', value: 'listening' }, { name: 'Streaming', value: 'streaming' })).addStringOption(o => o.setName('text').setDescription('النص').setMaxLength(100)).addStringOption(o => o.setName('url').setDescription('Streaming: Twitch أو YouTube').setMaxLength(300)),
  cmd('profile', 'تغيير بايو أو صورة أو بنر البوت', true).addStringOption(o => o.setName('bio').setDescription('حتى 400 حرف').setMaxLength(400)).addAttachmentOption(o => o.setName('avatar').setDescription('صورة البوت')).addAttachmentOption(o => o.setName('banner').setDescription('بنر البوت'))
].map(c => c.toJSON());

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
function status() {
  if (!subscriptionActive()) { client.user.setPresence({ status: 'invisible', activities: [] }); return; }
  const modes = { playing: ActivityType.Playing, watching: ActivityType.Watching, listening: ActivityType.Listening, streaming: ActivityType.Streaming };
  if (settings.statusMode === 'auto') { client.user.setPresence({ status: 'online', activities: [{ name: brand.name + ' • /help', type: ActivityType.Watching }] }); return; }
  const type = modes[settings.statusMode] || ActivityType.Watching;
  client.user.setPresence({ status: 'online', activities: [{ name: settings.statusText, type: type, ...(type === ActivityType.Streaming ? { url: settings.statusUrl } : {}) }] });
}
function help() { const nl = String.fromCharCode(10); return { embeds: [embed('COMMUNITY ASSISTANT', 'أهلًا بك في ' + brand.name + '.' + nl + 'ريأكشنات وفواصل مرتبة للتقييمات والإثباتات.').addFields({ name: 'REVIEW', value: '<#' + channel('review') + '>' + nl + (settings.reviewEnabled ? '🟢 يعمل' : '⏸ متوقف') + ' • فاصل كل ' + settings.interval + ' رسالة', inline: true }, { name: 'PROOFS', value: '<#' + channel('proofs') + '>' + nl + (settings.proofsEnabled ? '🟢 يعمل' : '⏸ متوقف'), inline: true }, { name: 'ADMIN', value: '/panel • /setimage • /setreaction • /setchannel' + nl + '/interval • /toggle • /status • /profile • /diagnose' })], components: [] }; }
function panel() { const nl = String.fromCharCode(10); return { embeds: [embed('CONTROL PANEL', 'كل إعداد محفوظ لهذه النسخة فقط.').addFields({ name: 'Review', value: '<#' + channel('review') + '>' + nl + (settings.reviewEnabled ? '🟢' : '⏸') + ' ' + settings.reviewEmoji, inline: true }, { name: 'Proofs', value: '<#' + channel('proofs') + '>' + nl + (settings.proofsEnabled ? '🟢' : '⏸') + ' ' + settings.proofsEmoji, inline: true }, { name: 'الفاصل', value: (settings.separatorEnabled ? '🟢 يعمل' : '⏸ متوقف') + ' • كل ' + settings.interval + ' رسالة' }, { name: 'بيع البوت', value: 'نفس الملف لكل عميل، مع DISCORD_TOKEN وGUILD_ID وBRAND_NAME ورومات مختلفة لكل نسخة.' })] }; }
function stats() { const nl = String.fromCharCode(10); return { embeds: [embed('BOT STATUS', 'الاتصال: ' + client.ws.ping + ' ms' + nl + 'وقت التشغيل: ' + Math.floor(process.uptime() / 60) + ' دقيقة' + nl + 'الذاكرة: ' + Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB' + nl + nl + 'الرسائل: ' + count.messages + nl + 'الريأكشنات: ' + count.reactions + nl + 'الفواصل: ' + count.separators + nl + 'الأخطاء: ' + count.errors + nl + 'آخر خطأ: ' + lastError)] }; }
async function diagnose(guild) { const me = await guild.members.fetchMe(); const lines = []; for (const pair of [['Review', 'review'], ['Proofs', 'proofs']]) { const ch = await guild.channels.fetch(channel(pair[1])).catch(() => null); if (!ch) { lines.push('❌ ' + pair[0] + ': الروم غير موجود.'); continue; } const p = ch.permissionsFor(me); const needed = ['ViewChannel', 'ReadMessageHistory', 'AddReactions']; if (pair[1] === 'review' && settings.separatorEnabled) needed.push('SendMessages', 'AttachFiles'); const missing = needed.filter(x => !p || !p.has(PermissionFlagsBits[x])); lines.push(missing.length ? '❌ ' + pair[0] + ': ناقص ' + missing.join(', ') : '✅ ' + pair[0] + ': الصلاحيات جاهزة.'); } lines.push(fs.existsSync(settings.separatorFile || fallbackImage) ? '✅ صورة الفاصل موجودة.' : '❌ استخدم /setimage.'); lines.push(process.env.RAILWAY_VOLUME_MOUNT_PATH || process.env.DATA_DIR ? '✅ التخزين الدائم مفعّل.' : '⚠️ أضف DATA_DIR=/data في Railway.'); return { embeds: [embed('DIAGNOSE', lines.join(String.fromCharCode(10)))] }; }
async function reply(i, body) { return i.deferred || i.replied ? i.editReply(body) : i.reply(body); }
async function autoSetup(guild) {
  const canManage = guild.members.me && guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels);
  if (!canManage) throw new Error('أعطِ البوت صلاحية Manage Channels ثم أعد /setup.');
  const findExisting = async (idValue, names) => {
    const current = idValue ? await guild.channels.fetch(idValue).catch(() => null) : null;
    if (current && current.type === ChannelType.GuildText) return current;
    return guild.channels.cache.find(c => c.type === ChannelType.GuildText && names.includes(c.name.toLowerCase())) || null;
  };
  const review = await findExisting(settings.reviewChannel, ['review', 'reviews', 'تقييم', 'التقييمات']);
  const proofs = await findExisting(settings.proofsChannel, ['proofs', 'proof', 'إثبات', 'الإثباتات']);
  const make = (name) => guild.channels.create({ name, type: ChannelType.GuildText, reason: 'Vola Store automatic setup' });
  const reviewChannel = review || await make('review');
  const proofsChannel = proofs || await make('proofs');
  settings.reviewChannel = reviewChannel.id;
  settings.proofsChannel = proofsChannel.id;
  save();
  return { reviewChannel, proofsChannel };
}
async function interaction(i) {
  if (!i.isChatInputCommand()) return;
  if (i.commandName === 'renew' && !owner(i)) return i.reply({ content: 'تجديد الاشتراك لمالك البوت فقط.', ephemeral: true });
  if (!['help', 'subscription', 'renew'].includes(i.commandName) && !admin(i)) return i.reply({ content: 'هذا الأمر للإدارة فقط.', ephemeral: true });
  if (!subscriptionActive() && !['subscription', 'renew'].includes(i.commandName)) return i.reply({ content: 'انتهى اشتراك هذا البوت. جدّد الاشتراك أولًا.', ephemeral: true });
  if (i.commandName === 'profile' && !owner(i)) return i.reply({ content: 'تعديل هوية البوت لمالك التطبيق فقط.', ephemeral: true });
  await i.deferReply({ ephemeral: true });
  try {
    const o = i.options; const name = i.commandName;
    if (name === 'help') return reply(i, help());
    if (name === 'subscription') return reply(i, { embeds: [embed('SUBSCRIPTION', subscriptionText())] });
    if (name === 'renew') { const days = o.getInteger('days', true); const start = Math.max(Date.now(), Number(settings.subscriptionExpiresAt) || 0); settings.subscriptionExpiresAt = start + days * 86400000; save(); status(); return reply(i, { embeds: [embed('RENEWED', 'تم تجديد الاشتراك ✅' + String.fromCharCode(10) + subscriptionText())] }); }
    if (name === 'setup') { const result = await autoSetup(i.guild); const nl = String.fromCharCode(10); return reply(i, { embeds: [embed('AUTO SETUP', 'تم تجهيز البوت تلقائيًا ✅' + nl + 'Review: <#' + result.reviewChannel.id + '>' + nl + 'Proofs: <#' + result.proofsChannel.id + '>' + nl + 'الفاصل والراكشنات يعملان الآن.') ] }); }
    if (name === 'panel') return reply(i, panel());
    if (name === 'stats') return reply(i, stats());
    if (name === 'diagnose') return reply(i, await diagnose(i.guild));
    if (name === 'test') return reply(i, { content: 'هذه معاينة خاصة بك:', files: [separator()] });
    if (name === 'setimage') { const bytes = await readImage(o.getAttachment('image', true)); const ext = imageType(bytes); const file = path.join(dataDir, 'separator.' + ext); fs.writeFileSync(file, bytes, { mode: 0o600 }); settings.separatorFile = file; save(); return reply(i, { embeds: [embed('SAVED', 'تم تغيير صورة الفاصل ✅')] }); }
    if (name === 'setreaction') { const target = o.getString('target') || 'review'; settings[target + 'Emoji'] = parseEmoji(o.getString('emoji', true)); save(); return reply(i, { embeds: [embed('SAVED', 'تم تغيير ريأكشن ' + target + ' ✅')] }); }
    if (name === 'setchannel') { const target = o.getString('target', true); settings[target + 'Channel'] = o.getChannel('channel', true).id; save(); return reply(i, { embeds: [embed('SAVED', 'تم تغيير روم ' + target + ' ✅')] }); }
    if (name === 'interval') { settings.interval = o.getInteger('messages', true); save(); separatorCounter = 0; return reply(i, { embeds: [embed('SAVED', 'الفاصل الآن بعد كل ' + settings.interval + ' رسالة ✅')] }); }
    if (name === 'toggle') { const f = o.getString('feature', true); const on = o.getBoolean('enabled', true); settings[f === 'separator' ? 'separatorEnabled' : f + 'Enabled'] = on; save(); return reply(i, panel()); }
    if (name === 'status') { const mode = o.getString('mode', true); const url = o.getString('url'); if (mode === 'streaming' && (!url || !/^https:\/\/(www\.)?(twitch\.tv|youtube\.com)\/.+/.test(url))) throw new Error('Streaming يحتاج رابط Twitch أو YouTube.'); settings.statusMode = mode; settings.statusText = o.getString('text') || brand.name + ' • /help'; settings.statusUrl = mode === 'streaming' ? url : null; save(); status(); return reply(i, { embeds: [embed('SAVED', 'تم تحديث حالة البوت ✅')] }); }
    if (name === 'profile') { const bio = o.getString('bio'); const avatar = o.getAttachment('avatar'); const banner = o.getAttachment('banner'); if (!bio && !avatar && !banner) throw new Error('أرسل bio أو avatar أو banner.'); const edit = {}; if (bio) edit.description = bio; if (avatar) edit.icon = await readImage(avatar); if (banner) edit.coverImage = await readImage(banner); await client.application.edit(edit); if (avatar) await client.user.setAvatar(edit.icon); return reply(i, { embeds: [embed('PROFILE SAVED', 'تم تحديث البايو والصورة والبنر ✅')] }); }
  } catch (error) { log(i.commandName, error); return reply(i, { embeds: [embed('NOTICE', error.code === 50013 ? 'البوت ناقص صلاحيات. استخدم /diagnose.' : error.message || 'تعذر تنفيذ الأمر.')] }); }
}
client.on('interactionCreate', i => interaction(i).catch(e => log('interaction', e)));
client.on('messageCreate', async message => { if (!subscriptionActive() || message.author.bot || message.guildId !== id.guild || seen.has(message.id)) return; const target = message.channelId === channel('review') && settings.reviewEnabled ? 'review' : message.channelId === channel('proofs') && settings.proofsEnabled ? 'proofs' : null; if (!target) return; seen.add(message.id); const previous = queue.get(message.channelId) || Promise.resolve(); const current = previous.then(async () => { count.messages++; try { await message.react(target === 'review' ? settings.reviewEmoji : settings.proofsEmoji); count.reactions++; } catch (e) { log('reaction', e); } if (target !== 'review' || !settings.separatorEnabled) return; separatorCounter++; if (separatorCounter < settings.interval) return; separatorCounter = 0; try { await message.channel.send({ files: [separator()] }); count.separators++; } catch (e) { log('separator', e); } }).finally(() => { if (queue.get(message.channelId) === current) queue.delete(message.channelId); }); queue.set(message.channelId, current); });
async function resolveGuild() {
  const configured = await client.guilds.fetch(id.guild).catch(() => null);
  if (configured) return configured;
  if (client.guilds.cache.size === 1) {
    const only = client.guilds.cache.first();
    id.guild = only.id;
    console.warn('[commands] GUILD_ID not found; using the only connected guild automatically.');
    return only;
  }
  throw new Error('GUILD_ID غير صحيح، والبوت موجود في أكثر من سيرفر.');
}
client.once('ready', async () => { console.log(brand.name + ' online; data=' + dataDir); status(); setInterval(status, 60000).unref(); try { await client.application.fetch(); const guild = await resolveGuild(); await guild.commands.set(commands); console.log('Registered ' + commands.length + ' commands in ' + guild.id + '.'); } catch (e) { log('commands', e); } });
client.on('error', e => log('client', e));
client.login(token).catch(e => { log('login', e); process.exit(1); });
