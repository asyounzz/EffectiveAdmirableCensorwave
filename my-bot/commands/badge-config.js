const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Path to the badgeRoles.json file
const configPath = path.join(__dirname, '../data/badgeRoles.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('badge-config')
    .setDescription('View the current badge roles configuration for the server'),

  async execute(interaction) {
    // Read the configuration file
    let config = {};
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath));
    }

    const guildId = interaction.guild.id;
    const serverConfig = config[guildId];

    if (!serverConfig) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('No Badge Roles Configuration Found')
            .setDescription('There is no badge role configuration for this server.')
            .setColor(Colors.Red),
        ],
      });
    }

    const { roles, debugChannel } = serverConfig;

    // Fetch the log channel using the ID from the config
    let logChannel = interaction.guild.channels.cache.get(debugChannel);

    // If channel isn't cached, fetch it from the API
    if (!logChannel) {
      logChannel = await interaction.guild.channels.fetch(debugChannel).catch(() => null);
    }

    // Create an embed for the server configuration
    const embed = new EmbedBuilder()
      .setTitle('Badge Roles Configuration')
      .setDescription(`Here is the current badge role configuration for this server:`)
      .setColor(Colors.Blue);

    // Add badge roles to the embed with mentions
    let rolesDescription = '';
    for (const [badge, roleId] of Object.entries(roles)) {
      const role = interaction.guild.roles.cache.get(roleId);
      rolesDescription += `**${badge}:** ${role ? `<@&${role.id}>` : 'Role not found'}\n`;
    }

    embed.addFields({
      name: 'Badge Roles:',
      value: rolesDescription || 'No badge roles configured.',
    });

    // Add log channel information to the embed with mention
    embed.addFields({
      name: 'Log Channel:',
      value: logChannel ? `<#${logChannel.id}>` : 'Log channel not set or deleted.',
    });

    await interaction.reply({
      embeds: [embed],
    });
  },
};
