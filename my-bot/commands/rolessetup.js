const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  Colors,
  PermissionsBitField,
  ChannelType,
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const badgeData = {
  'Discord Employee': { color: 0x334dff },
  'Discord Partner': { color: 0x334dff },
  'Discord Moderator': { color: 0x334dff },
  'HypeSquad Events': { color: 0xffed33 },
  'Brilliance': { color: 0xff6b52 },
  'Bravery': { color: 0xcd8af4 },
  'Balance': { color: 0x69ffc2 },
  'BugHunter Terminator': { color: 0xfdff6f },
  'BugHunter': { color: 0x0dc645 },
  'Early Supporter': { color: 0x94def3 },
  'Active Developer': { color: 0x24ab0e },
  'Verified Developer': { color: 0x334dff },
  'Bot': { color: 0x3ec2ff },
  'Verified Bot': { color: 0x3ec2ff },
};

const configPath = path.join(__dirname, '../data/badgeRoles.json');

function loadConfig() {
  if (!fs.existsSync(configPath)) return {};
  return JSON.parse(fs.readFileSync(configPath));
}

function saveConfig(guildId, data) {
  const config = loadConfig();
  config[guildId] = data;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function logError(guild, error, fallbackText) {
  const config = loadConfig();
  const debugId = config[guild.id]?.debugChannel;
  const message = `❌ ${fallbackText}\n\`\`\`${error.message || error}\`\`\``;

  if (debugId) {
    const channel = guild.channels.cache.get(debugId);
    if (channel) {
      channel.send({ embeds: [new EmbedBuilder().setDescription(message).setColor(Colors.Red)] }).catch(() => {
        console.error(`[ERROR LOG] ${message}`);
      });
      return;
    }
  }

  console.error(`[ERROR LOG] ${message}`);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-roles')
    .setDescription('Setup roles for badge system (manual or automatic)'),

  async execute(interaction) {

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription('❌ You do not have the required permissions to run this command. Only server admins can use it.')
            .setColor(Colors.Red),
        ],
        ephemeral: true,
      });
    }

    const menu = new StringSelectMenuBuilder()
      .setCustomId('setup-roles-select')
      .setPlaceholder('Select the setup method')
      .addOptions([
        {
          label: 'Automatic Setup',
          value: 'auto',
          description: 'Create roles automatically based on badges',
        },
        {
          label: 'Manual Setup',
          value: 'manual',
          description: 'Manually configure roles for each badge',
        },
      ]);

    
      
    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('Badge Role Setup')
          .setDescription('Please choose a setup method for your badge roles:')
          .setColor(Colors.Blue),
      ],
      components: [row],
    });

    const selection = await interaction.channel.awaitMessageComponent({
      filter: (i) => i.user.id === interaction.user.id && i.customId === 'setup-roles-select',
      time: 60000,
    });

    const selected = selection.values[0];
    await selection.update({
      embeds: [
        new EmbedBuilder()
          .setDescription(`You selected **${selected === 'auto' ? 'Automatic' : 'Manual'} Setup**.`)
          .setColor(Colors.Grey),
      ],
      components: [],
    });

    if (selected === 'auto') {
      const creatingMsg = await interaction.followUp({
        embeds: [
          new EmbedBuilder()
            .setDescription('Creating roles and debug channel...')
            .setColor(Colors.Grey),
        ],
        fetchReply: true,
      });

      const rolesMap = {};
      const created = [];

      for (const [badge, { color }] of Object.entries(badgeData)) {
        try {
          const role = await interaction.guild.roles.create({
            name: badge,
            color,
            reason: `Auto-created badge role: ${badge}`,
            permissions: [],
          });
          rolesMap[badge] = role.id;
          created.push(role.name);
        } catch (err) {
          logError(interaction.guild, err, `Could not create role **${badge}**`);
        }
      }

      // Create debug channel
      let debugChannel;
      try {
        debugChannel = await interaction.guild.channels.create({
          name: 'badge-debug',
          type: 0,
          reason: 'Auto-created debug channel for badge role setup',
        });
      } catch (err) {
        logError(interaction.guild, err, 'Could not create debug channel');
      }

      saveConfig(interaction.guild.id, {
        roles: rolesMap,
        debugChannel: debugChannel?.id || null,
      });

      await creatingMsg.edit({
        embeds: [
          new EmbedBuilder()
            .setTitle('Roles and Channel Created')
            .setDescription(`✅ The roles and debug channel have been created successfully!`)
            .setColor(Colors.Green),
        ],
      });
    }

    else if (selected === 'manual') {
      const badges = Object.keys(badgeData);
      const rolesMap = {};
      let current = 0;

      const sendNextMenu = async () => {
        const badge = badges[current];
        const roles = interaction.guild.roles.cache
          .filter((r) => r.name !== '@everyone' && !r.managed)
          .map((r) => ({ label: r.name.slice(0, 100), value: r.id }))
          .slice(0, 25);

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(`manual-role-${current}`)
          .setPlaceholder(`Select a role for "${badge}"`)
          .addOptions(roles);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const msg = await interaction.followUp({
          embeds: [
            new EmbedBuilder()
              .setTitle(`Manual Setup - ${badge}`)
              .setDescription(`Select the role to assign to users with **${badge}**`)
              .setColor(Colors.Orange),
          ],
          components: [row],
          fetchReply: true,
        });

        const choice = await interaction.channel.awaitMessageComponent({
          filter: (i) => i.user.id === interaction.user.id && i.customId === `manual-role-${current}`,
          time: 60000,
        });

        rolesMap[badge] = choice.values[0];
        await choice.update({ components: [] });

        current++;
        if (current < badges.length) {
          await sendNextMenu();
        } else {
          // After role selection, ask for log channel
          const logSelectMenu = new StringSelectMenuBuilder()
            .setCustomId('select-log-channel')
            .setPlaceholder('Select a log channel')
          .addOptions(
            interaction.guild.channels.cache
              .filter((ch) => ch.type === ChannelType.GuildText) // Filter only text channels
              .map((ch) => ({
                label: ch.name.slice(0, 100),
                value: ch.id,
              }))
              .slice(0, 25)
          );

          const logRow = new ActionRowBuilder().addComponents(logSelectMenu);

          await interaction.followUp({
            embeds: [
              new EmbedBuilder()
                .setTitle('Select Debug Channel')
                .setDescription('Please select a channel to receive error logs.')
                .setColor(Colors.Blue),
            ],
            components: [logRow],
          });

          const channelChoice = await interaction.channel.awaitMessageComponent({
            filter: (i) => i.user.id === interaction.user.id && i.customId === 'select-log-channel',
            time: 60000,
          });

          const selectedChannel = channelChoice.values[0];
          await channelChoice.update({ components: [] });

          saveConfig(interaction.guild.id, {
            roles: rolesMap,
            debugChannel: selectedChannel,
          });

          await interaction.followUp({
            embeds: [
              new EmbedBuilder()
                .setTitle('Manual Setup Complete')
                .setDescription('Badge roles and debug channel have been set successfully!')
                .setColor(Colors.Green),
            ],
          });
        }
      };

      await sendNextMenu();
    }
  },
};
