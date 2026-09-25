const { Client, GatewayIntentBits, AttachmentBuilder, SlashCommandBuilder, REST, Routes, PermissionFlagsBits } = require('discord.js');
const token = process.env.DISCORD_TOKEN;
const channelId = process.env.CHANNEL_ID || '1447978433178239211';
const guildId = process.env.GUILD_ID || '1447961768776437795';
const appId = process.env.DISCORD_APP_ID || '1553114265756369027';
const separatorFile = process.env.SEPARATOR_FILE || './separator.webp';
let reactionId = process.env.REACTION_ID || '1553117153857765477';
let separatorUrl = null;
if (!token) {
  console.error('Missing DISCORD_TOKEN environment variable.');
  process.exit(1);
}
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});
const commands = [
  new SlashCommandBuilder()
    .setName('setimage')
    .setDescription('تغيير صورة الفاصل')
    .addAttachmentOption(option => option.setName('image').setDescription('الصورة الجديدة').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder()
    .setName('setreaction')
    .setDescription('تغيير التفاعل')
    .addStringOption(option => option.setName('emoji').setDescription('الإيموجي أو رقم الإيموجي').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder()
    .setName('test')
    .setDescription('تجربة صورة الفاصل والتفاعل')
].map(command => command.toJSON());
function getEmojiId(value) {
  const match = value.match(/^<a?:\\w+:(\\d+)>$/);
  return match ? match[1] : value;
}
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  try {
    const rest = new REST({ version: '10' }).setToken(token);
    await rest.put(Routes.applicationGuildCommands(appId, guildId), { body: commands });
    console.log('Slash commands registered.');
  } catch (error) {
    console.error('Could not register slash commands:', error.message);
  }
});
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild);
  if (interaction.commandName === 'setimage') {
    if (!isAdmin) return interaction.reply({ content: 'هذا الأمر للإدارة فقط.', ephemeral: true });
    const image = interaction.options.getAttachment('image');
    if (!image.contentType?.startsWith('image/')) {
      return interaction.reply({ content: 'ارفع ملف صورة فقط.', ephemeral: true });
    }
    separatorUrl = image.url;
    return interaction.reply({ content: 'تم تغيير صورة الفاصل ✅', ephemeral: true });
  }
  if (interaction.commandName === 'setreaction') {
    if (!isAdmin) return interaction.reply({ content: 'هذا الأمر للإدارة فقط.', ephemeral: true });
    reactionId = getEmojiId(interaction.options.getString('emoji'));
    return interaction.reply({ content: 'تم تغيير التفاعل ✅', ephemeral: true });
  }
  if (interaction.commandName === 'test') {
    return interaction.reply({ files: [separatorUrl || new AttachmentBuilder(separatorFile, { name: 'separator.webp' })] });
  }
});
client.on('messageCreate', async message => {
  if (message.author.bot || message.channel.id !== channelId) return;
  try {
    await message.react(reactionId);
  } catch (error) {
    console.error('Could not add reaction:', error.message);
  }
  try {
    await message.channel.send({
      files: [separatorUrl || new AttachmentBuilder(separatorFile, { name: 'separator.webp' })]
    });
  } catch (error) {
    console.error('Could not send separator:', error.message);
  }
});
client.login(token);
