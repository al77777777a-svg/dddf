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
function load() { try { return Object.assign(defaults(), JSON.parse(fs.readFileSync(dataFile, 'utf8'))); } catch { return defaults(); } }
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
async function autoSetup(guild) {
  const me = await guild.members.fetchMe();
  if (!me.permissions.has(PermissionFlagsBits.ManageChannels)) throw new Error('أعطِ البوت صلاحية Manage Channels ثم أعد /setup.');
  const findExisting = async (idValue, names) => {
    const current = idValue ? await guild.channels.fetch(idValue).catch(() => null) : null;
    if (current && current.type === ChannelType.GuildText) return current;
    return guild.channels.cache.find(c => c.type === ChannelType.GuildText && names.includes(c.name.toLowerCase())) || null;
  };
  const review = await findExisting(settings.reviewChannel, ['review', 'reviews', 'تقييم', 'التقييمات']);
  const proofs = await findExisting(settings.proofsChannel, ['proofs', 'proof', 'إثبات', 'الإثباتات']);
  const make = name => guild.channels.create({ name, type: ChannelType.GuildText, reason: 'Vola Store automatic setup' });
  const reviewChannel = review || await make('review');
  const proofsChannel = proofs || await make('proofs');
  settings.reviewChannel = reviewChannel.id;
  settings.proofsChannel = proofsChannel.id;
  save();
  return { reviewChannel, proofsChannel };
}
async function reply(i, body) { return i.deferred || i.replied ? i.editReply(body) : i.reply(body); }
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
    if (name === 'setup') { const result = await autoSetup(i.guild); const nl = String.fromCharCode(10); return reply(i, { embeds: [embed('AUTO SETUP', 'تم تجهيز البوت تلقائيًا ✅' + nl + 'Review: <#' + result.reviewChannel.id + '>' + nl + 'Proofs: <#' + result.proofsChannel.id + '>' + nl + 'الفاصل والراكشنات يعملان الآن.')] }); }
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
client.once('ready', async () => { console.log(brand.name + ' online; data=' + dataDir); status(); setInterval(status, 60000).unref(); try { await client.application.fetch(); const guild = await client.guilds.fetch(id.guild); await guild.commands.set(commands); console.log('Registered ' + commands.length + ' commands.'); } catch (e) { log('commands', e); } });
client.on('error', e => log('client', e));
client.login(token).catch(e => { log('login', e); process.exit(1); });
