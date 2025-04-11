const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Path to the badgeRoles.json file
const configPath = path.join(__dirname, '../data/badgeRoles.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reset-config')
    .setDescription('Reset the badge roles configuration for this server')
    .setDefaultMemberPermissions(0x8), // Only admins can use this command

  async execute(interaction) {
    // Check if the user has the Administrator permission
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Permission Denied')
            .setDescription('You must have the `Administrator` permission to use this command.')
            .setColor(Colors.Red),
        ],
        ephemeral: true, // Make the reply ephemeral so only the user sees it
      });
    }

    // Read the configuration file
    let config = {};
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath));
    }

    const guildId = interaction.guild.id;

    // Check if the server has a configuration
    if (!config[guildId]) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('No Configuration Found')
            .setDescription('There is no badge role configuration to reset for this server.')
            .setColor(Colors.Yellow),
        ],
        ephemeral: true,
      });
    }

    // Delete the configuration for the server
    delete config[guildId];

    // Write the updated configuration back to the file
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Send a confirmation message
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('Configuration Reset')
          .setDescription('The badge roles configuration has been successfully reset for this server.')
          .setColor(Colors.Green),
      ],
    });
  },
};
