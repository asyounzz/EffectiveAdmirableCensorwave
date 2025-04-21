const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Path to store.json for per-server storage
const storePath = path.join(__dirname, '..', 'store.json');

// Badge map
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
  'Verified Bot': 'VerifiedBot'
};

// Initialize store if it doesn't exist
if (!fs.existsSync(storePath)) {
  fs.writeFileSync(storePath, JSON.stringify({}, null, 2), 'utf8');
}

let history;
try {
  const raw = fs.readFileSync(storePath, 'utf8');
  history = JSON.parse(raw);
  if (typeof history !== 'object') history = {}; // Ensure it's an object
} catch (e) {
  console.error('Error reading store.json:', e);
  history = {};
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('badgechart')
    .setDescription('View the evolution of badge counts over the last 7 days.')
    .addStringOption(option =>
      option.setName('badge')
        .setDescription('Select a badge to view a specific chart.')
        .setRequired(true)
        .addChoices(...Object.keys(badgeMap).map(key => ({ name: key, value: key })))
    )
    .addBooleanOption(option =>
      option.setName('shownumbers')
        .setDescription('Whether to show the badge count numbers under the chart')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      // Check if interaction.guild exists
      if (!interaction.guild) {
        return await interaction.editReply({
          content: 'This command must be used in a server.',
          ephemeral: true
        });
      }

      const guildId = interaction.guild.id;
      const selectedBadge = interaction.options.getString('badge');
      const showNumbers = interaction.options.getBoolean('shownumbers');

      // Initialize the server data if not already present
      if (!history[guildId]) {
        history[guildId] = {
          history: []
        };
      }

      const guildHistory = history[guildId].history;

      // If history is empty, scan current members and initialize
      if (guildHistory.length === 0) {
        await interaction.guild.members.fetch();

        const counts = {};
        for (const badge of Object.keys(badgeMap)) counts[badge] = 0;

        interaction.guild.members.cache.forEach(member => {
          const flags = member.user.flags?.toArray() || [];
          for (const [name, value] of Object.entries(badgeMap)) {
            if (flags.includes(value)) counts[name]++;
          }
          if (member.user.bot) counts['Bot']++;
          if (member.user.flags?.has('VerifiedBot')) counts['Verified Bot']++;
        });

        guildHistory.push(counts);
        history[guildId].history = guildHistory; // Update the history for this server
        fs.writeFileSync(storePath, JSON.stringify(history, null, 2), 'utf8');
      }

      const labels = guildHistory.map((_, i) => `Day ${i + 1}`);
      let datasets;

      if (selectedBadge) {
        datasets = [{
          label: selectedBadge,
          data: guildHistory.map(day => day[selectedBadge] || 0),
          borderColor: 'rgba(75, 192, 192, 1)',
          fill: false
        }];
      } else {
        return await interaction.editReply({
          embeds: [new EmbedBuilder()
            .setColor('Red')
            .setDescription('Please select a badge to view the chart. The combined chart for all badges is too large to render.')
          ]
        });
      }

      const chartConfig = {
        type: 'line',
        data: {
          labels,
          datasets
        },
        options: {
          plugins: {
            legend: { display: true },
            datalabels: {
              display: showNumbers || false,
              align: 'top',
              font: { weight: 'bold' }
            }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }
      };

      // Properly encode the URL without deprecated Punycode
      const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}`;

      const response = await fetch(chartUrl);
      const buffer = await response.buffer();
      const attachment = new AttachmentBuilder(buffer, { name: 'badgechart.png' });

      const embed = new EmbedBuilder()
        .setTitle(`Badge Evolution for ${selectedBadge}`)
        .setDescription('Evolution of badge counts over the last 7 days.')
        .setImage('attachment://badgechart.png')
        .setColor('Blue');

      await interaction.editReply({ embeds: [embed], files: [attachment] });

    } catch (err) {
      console.error('Error handling the badge chart command:', err);
      await interaction.editReply({ content: 'An error occurred while generating the badge chart. Please try again later.' });
    }
  }
};