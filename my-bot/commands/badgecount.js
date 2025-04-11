const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('scanbadges')
    .setDescription('Scan all members and show how many have each badge'),

  async execute(interaction) {
    const startTime = Date.now();
    await interaction.deferReply();

    const members = await interaction.guild.members.fetch();

    const badgeOrder = [
      ['<:discord_employee:1359464851357044791> ', 'Discord Employee'],
      ['<:discord_partner:1359468134364348508> ', 'Discord Partner'],
      ['<:discord_certifiedmoderator:1359468333560496191> ', 'Discord Moderator'],
      ['<:discord_hypesquadevents:1359468496635035660> ', 'HypeSquad Events'],
      ['<:discord_hypesquadbrilliance:1359468816522023024> ', 'Brilliance'],
      ['<:discord_hypesquadbravery:1359469251781464206> ', 'Bravery'],
      ['<:discord_hypesquadbalance:1359468896603607191> ', 'Balance'],
      ['<:discord_bughunterterminator:1359469709329956937> ', 'BugHunter Terminator'],
      ['<:discord_bughunter:1359469667147714662> ', 'BugHunter'],
      ['<:discord_earlysupporter:1359470409027813406> ', 'Early Supporter'],
      ['<:discord_activedeveloper:1359470440921305119> ', 'Active Developer'],
      ['<:discord_botdev:1359472102406750211> ', 'Verified Developer'],
      ['<:discord_nitro:1359470786913767527> ', 'Nitro (not exact)'],
      ['<a:discord_serverbooster:1359470818903724113> ', 'Server Booster (not exact)'],
      ['<:discord_bo:1359471191978545335> ', 'Bot'],
      ['<:discord_certifiedbot:1359471226539606178> ', 'Verified Bot'],
    ];

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
      'Nitro (not exact)': null,
      'Server Booster (not exact)': null,
    };

    const badgeCounts = {};
    const usersByBadge = {};

    for (const [, label] of badgeOrder) {
      badgeCounts[label] = 0;
      usersByBadge[label] = [];
    }

    for (const [, member] of members) {
      const user = member.user;
      const flags = user.flags?.toArray() || [];
      const isBot = user.bot;
      const isVerifiedBot = isBot && user.flags?.has('VerifiedBot');

      for (const [label, flag] of Object.entries(badgeMap)) {
        if (flag === 'Bot' && isBot) {
          badgeCounts[label]++;
          usersByBadge[label].push(user.tag);
        } else if (flag === 'VerifiedBot' && isVerifiedBot) {
          badgeCounts[label]++;
          usersByBadge[label].push(user.tag);
        } else if (flags.includes(flag)) {
          badgeCounts[label]++;
          usersByBadge[label].push(user.tag);
        }
      }

      if (!isBot && user.avatar?.startsWith('a_')) {
        badgeCounts['Nitro (not exact)']++;
        usersByBadge['Nitro (not exact)'].push(user.tag);
      }

      if (!isBot && member.premiumSince) {
        badgeCounts['Server Booster (not exact)']++;
        usersByBadge['Server Booster (not exact)'].push(user.tag);
      }
    }

    const calcTime = `${Date.now() - startTime}ms`;

    const embed = new EmbedBuilder()
      .setTitle('🏷️ Server Badge Overview')
      .setColor(0x5865F2)
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setDescription([
        `👥 Total Members: **${members.size}**`,
        '',
        badgeOrder.map(([emoji, label]) => `${emoji} ${label} **${badgeCounts[label]}**`).join('\n'),
        '',
        `🕒 **Calculation Time:** ${calcTime}`,
      ].join('\n'));

    const menu = new StringSelectMenuBuilder()
      .setCustomId('select-badge')
      .setPlaceholder('Select a badge to see the members')
      .addOptions(
        badgeOrder.map(([emoji, label]) => ({
          label: label,
          value: label,
        }))
      );

    const row = new ActionRowBuilder().addComponents(menu);
    const msg = await interaction.editReply({ embeds: [embed], components: [row] });

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 60_000,
    });

    collector.on('collect', async (i) => {
      const selected = i.values[0];
      const users = usersByBadge[selected] || [];
      let page = 0;

      const chunks = users.length
        ? Array.from({ length: Math.ceil(users.length / 10) }, (_, i) => users.slice(i * 10, (i + 1) * 10))
        : [[]];

      await i.deferReply({ ephemeral: true });

      const getPageEmbed = () => ({
        embeds: [
          new EmbedBuilder()
            .setTitle(`👥 Users with "${selected}"`)
            .setDescription(chunks[page].join('\n') || 'No users found.')
            .setFooter({ text: `Page ${page + 1}/${chunks.length}` })
            .setColor(0x5865F2),
        ],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('prev')
              .setLabel('Previous')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(page === 0),
            new ButtonBuilder()
              .setCustomId('next')
              .setLabel('Next')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(page === chunks.length - 1)
          ),
        ],
        ephemeral: true,
        fetchReply: true,
      });

      const pageMessage = await i.followUp(getPageEmbed());

      const btnCollector = pageMessage.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60_000,
      });

      btnCollector.on('collect', async (btnInteraction) => {
        if (btnInteraction.user.id !== i.user.id)
          return btnInteraction.reply({ content: 'You cannot interact with this.', ephemeral: true });

        if (btnInteraction.customId === 'prev') page--;
        if (btnInteraction.customId === 'next') page++;

        await btnInteraction.update(getPageEmbed());
      });

      btnCollector.on('end', () => {
        pageMessage.edit({ components: [] }).catch(() => {});
      });
    });
  },
};
