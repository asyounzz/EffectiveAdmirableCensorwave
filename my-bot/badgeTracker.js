const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// Badge map: display name => internal Discord flag
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

const storePath = path.join(__dirname, 'store.json');

// Load data from store.json
function loadData() {
  if (!fs.existsSync(storePath)) return {};
  try {
    const raw = fs.readFileSync(storePath, 'utf8');
    const data = JSON.parse(raw);
    return typeof data === 'object' && data !== null ? data : {};
  } catch {
    return {};
  }
}

// Save data to store.json
function saveData(data) {
  fs.writeFileSync(storePath, JSON.stringify(data, null, 2));
}

// Count users with each badge in a guild
async function countBadges(guild) {
  const counts = {};
  for (const badge of Object.keys(badgeMap)) {
    counts[badge] = 0;
  }

  try {
    await guild.members.fetch();

    for (const member of guild.members.cache.values()) {
      const flags = member.user.flags?.toArray() || [];
      const isBot = member.user.bot;

      for (const [displayName, flag] of Object.entries(badgeMap)) {
        if (flag === 'Bot' && isBot) counts[displayName]++;
        else if (flag === 'VerifiedBot' && flags.includes('VerifiedBot')) counts[displayName]++;
        else if (flags.includes(flag)) counts[displayName]++;
      }
    }
  } catch (err) {
    console.error(`Failed to count badges in guild ${guild.name}:`, err);
  }

  return counts;
}

// Perform daily badge tracking for all servers
async function runDailyBadgeTracking() {
  const data = loadData();

  for (const guild of client.guilds.cache.values()) {
    const counts = await countBadges(guild);

    if (!data[guild.id]) {
      data[guild.id] = { history: [] };
    }

    data[guild.id].history.push(counts);

    // Keep only the last 7 days of history
    if (data[guild.id].history.length > 7) {
      data[guild.id].history.shift();
    }
  }

  saveData(data);
  console.log(`[${new Date().toISOString()}] Badge data stored.`);
}

// Schedule tracking at midnight daily
cron.schedule('0 0 * * *', runDailyBadgeTracking);

// Run tracking on bot ready
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  runDailyBadgeTracking();
});

client.login(process.env.BOTTOKEN);