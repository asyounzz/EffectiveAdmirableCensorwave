const { SlashCommandBuilder, EmbedBuilder, Colors, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../data/badgeRoles.json');

// Load configuration from JSON file
function loadConfig() {
  if (!fs.existsSync(configPath)) return {};
  return JSON.parse(fs.readFileSync(configPath));
}

// Save configuration to JSON file
function saveConfig(guildId, data) {
  const config = loadConfig();
  config[guildId] = data;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('toggle-badge-roles')
    .setDescription('Enable or disable badge role assignment for new members.')
    .addBooleanOption(option =>
      option.setName('enabled')
        .setDescription('Enable or disable the badge role system for new members')
        .setRequired(true)
    ),
  

  async execute(interaction) {
    // Check if the user is an admin
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Insufficient Permissions')
            .setDescription('You must be an administrator to use this command.')
            .setColor(Colors.Red),
        ],
      });
    }

    const enabled = interaction.options.getBoolean('enabled');
    const config = loadConfig();
    const guildId = interaction.guild.id;

    if (!config[guildId]) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('No Config Found')
            .setDescription('There is no badge configuration for this server. Please set up the badge system first.')
            .setColor(Colors.Red),
        ],
      });
    }

    // Update the config file with the new setting
    if (!config[guildId]) {
      config[guildId] = {};
    }
    config[guildId].enableBadgeRoles = enabled;

    saveConfig(guildId, config[guildId]);

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('Badge Role Assignment')
          .setDescription(`The badge role assignment system has been **${enabled ? 'enabled' : 'disabled'}** for new members.`)
          .setColor(enabled ? Colors.Green : Colors.Red),
      ],
    });
  },
};
