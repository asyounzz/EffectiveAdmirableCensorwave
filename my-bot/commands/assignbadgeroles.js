const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Colors, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../data/badgeRoles.json');

// Badge Map to convert badge names to Discord's official badge flag names
const badgeMap = {
  'Discord Employee': 'Staff',
  'Discord Partner': 'Partner',
  'Discord Moderator': 'CertifiedModerator',
  'HypeSquad Events': 'HypeSquad',
  'Bravery': 'HypeSquadOnlineHouse1',
  'Brilliance': 'HypeSquadOnlineHouse2',
  'Balance': 'HypeSquadOnlineHouse3',
  'BugHunter Terminator': 'BugHunterLevel2',
  'BugHunter': 'BugHunterLevel1',
  'Early Supporter': 'PremiumEarlySupporter',
  'Active Developer': 'ActiveDeveloper',
  'Verified Developer': 'VerifiedDeveloper',
  'Bot': 'Bot',
  'Verified Bot': 'VerifiedBot',
};

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
    .setName('assign-badge-role')
    .setDescription('Manually assign badge roles to all members based on their badges.'),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const config = loadConfig();

    // Ensure configuration exists for the guild
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

    const rolesMap = config[guildId]?.roles;
    if (!rolesMap) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('No Badge Roles Configured')
            .setDescription('No badge roles have been configured for this server.')
            .setColor(Colors.Red),
        ],
      });
    }

    // Check if the user has the necessary permissions (Admin)
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

    // Create a button to stop the process (only usable by the command author)
    const stopButton = new ButtonBuilder()
      .setCustomId('stop-process')
      .setLabel('Stop Process')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(stopButton);

    // Send initial response with estimated time
    const memberCount = await interaction.guild.members.fetch();
    const estimatedTime = Math.ceil(memberCount.size * 2); // Assume 2 seconds per member for simplicity

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('Assigning Badge Roles')
          .setDescription(`This process will check and assign badge roles to all members.\nEstimated time: **${estimatedTime} seconds**.`)
          .setColor(Colors.Yellow),
      ],
      components: [row],
    });

    // Create a collector for the stop button
    const filter = (i) => i.user.id === interaction.user.id && i.customId === 'stop-process';
    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: estimatedTime * 1000,
    });

    let stopProcess = false;

    collector.on('collect', async (buttonInteraction) => {
      await buttonInteraction.update({
        embeds: [
          new EmbedBuilder()
            .setTitle('Process Stopped')
            .setDescription('The badge role assignment process has been stopped.')
            .setColor(Colors.Red),
        ],
        components: [],
      });

      stopProcess = true;
    });

    // Fetch all members and iterate through them
    const members = await interaction.guild.members.fetch();
    let processed = 0;
    let errors = 0;
    const totalMembers = members.size;

    // Update time estimate dynamically
    const updateTimeEstimate = () => {
      const remaining = totalMembers - processed;
      const remainingTime = Math.ceil(remaining * 2); // 2 seconds per member
      const minutes = Math.floor(remainingTime / 60);
      const seconds = remainingTime % 60;

      return `Estimated remaining time: **${minutes}m ${seconds}s**`;
    };

    for (const [memberId, member] of members) {
      if (stopProcess) break;

      // Fetch all badges that the member has
      const memberBadges = member.user.flags.toArray(); // This checks the user's badges

      // Loop through all badges and check if we have a role for it
      for (const badge of memberBadges) {
        // Get the badge name using badgeMap
        const badgeName = Object.keys(badgeMap).find(key => badgeMap[key] === badge);

        // If the badge exists and there's a role for it
        if (badgeName && rolesMap[badgeName]) {
          try {
            const roleId = rolesMap[badgeName];  // Fetch the role ID from rolesMap using badge name
            const role = interaction.guild.roles.cache.get(roleId);
            if (role) {
              // Assign the role to the member
              await member.roles.add(role);
              console.log(`Assigned role "${role.name}" to ${member.user.tag} for badge "${badgeName}"`);
            } else {
              errors++;
              console.log(`Role not found for badge "${badgeName}"`);
            }
          } catch (error) {
            errors++;
            console.log(`Error assigning role for badge "${badgeName}": ${error.message}`);
          }
        }
      }

      processed++;

      // Update progress and remaining time (every 10 members)
      if (processed % 10 === 0 || processed === members.size) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle('Assigning Badge Roles')
              .setDescription(`Processed **${processed}** / **${members.size}** members.\nErrors: ${errors}\n${updateTimeEstimate()}`)
              .setColor(Colors.Yellow),
          ],
          components: [row],
        });
      }
    }

    // Final response
    if (!stopProcess) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Badge Role Assignment Complete')
            .setDescription(`Successfully assigned badge roles to **${processed}** members.\nThere were **${errors}** errors.`)
            .setColor(Colors.Green),
        ],
        components: [],
      });
    }
  },
};
