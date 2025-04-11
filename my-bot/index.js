const { Client, Collection, GatewayIntentBits, Events, PresenceUpdateStatus, REST } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const { Routes } = require('discord-api-types/v10');
const clientId = '1295714784624513035';
const express = require('express')
const app = express()
const port = process.env.PORT || 4000;

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

// Initialize the bot client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection();

// Load the commands from the 'commands' directory
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

// Define the badge map (badge name -> role name)
const badgeMap = {
  'Staff': 'Discord Employee',
  'Partner': 'Discord Partner',
  'CertifiedModerator': 'Discord Moderator',
  'HypeSquad': 'HypeSquad Events',
  'HypeSquadOnlineHouse1': 'Bravery',
  'HypeSquadOnlineHouse2': 'Brilliance',
  'HypeSquadOnlineHouse3': 'Balance',
  'BugHunterLevel2': 'BugHunter Terminator',
  'BugHunterLevel1': 'BugHunter',
  'PremiumEarlySupporter': 'Early Supporter',
  'ActiveDeveloper': 'Active Developer',
  'VerifiedDeveloper': 'Verified Developer',
  'Bot': 'Bot',
  'VerifiedBot': 'Verified Bot',
};

// Load the badgeRoles.json data
const badgeRolesFile = path.join(__dirname, 'data/badgeRoles.json');
let badgeRolesData = {};

// Load the data from badgeRoles.json
if (fs.existsSync(badgeRolesFile)) {
  badgeRolesData = JSON.parse(fs.readFileSync(badgeRolesFile, 'utf8'));
  console.log("badgeRoles.json loaded successfully.");
} else {
  console.error("badgeRoles.json not found!");
  process.exit(1);
}

// Function to get the server's configuration
function getServerConfig(guildId) {
  if (badgeRolesData[guildId]) {
    return badgeRolesData[guildId];
  }
  return null;
}

// Function to check and assign badge roles
async function assignBadgeRoles(member) {
  const config = getServerConfig(member.guild.id);
  if (!config || !config.enableBadgeRoles) {
    console.log(`Badge system is disabled or no config found for guild: ${member.guild.id}`);
    return; // If no config or the badge system is disabled, do nothing
  }

  // Fetch the member's badges
  const badges = member.user.flags.toArray();
  console.log(`Badges for ${member.user.tag}:`, badges); // Log the badges for the member

  const rolesToAssign = [];

  // Iterate through the badges and map them to roles
  badges.forEach((badge) => {
    // Check if the badge exists in the badgeMap
    const roleName = badgeMap[badge];
    if (roleName) {
      // Now, find the corresponding role ID in badgeRoles.json based on the badge's mapped role name
      const roleId = config.roles[roleName];
      if (roleId) {
        // Find the role by its ID
        const role = member.guild.roles.cache.get(roleId);
        if (role) {
          console.log(`Role found for ${member.user.tag}: ${roleName}`); // Log found roles
          rolesToAssign.push(role);
        } else {
          console.log(`Role not found for ${member.user.tag}: ${roleName} (ID: ${roleId})`); // Log missing roles
        }
      } else {
        console.log(`No role ID found for ${member.user.tag}: ${roleName}`); // Log missing role ID
      }
    }
  });

  if (rolesToAssign.length === 0) {
    console.log(`No roles to assign for ${member.user.tag}`); // Log if no roles to assign
    return; // No roles to assign
  }

  // Try to assign the roles
  try {
    await member.roles.add(rolesToAssign);
    console.log(`Assigned roles to ${member.user.tag}:`, rolesToAssign.map(role => role.name));
  } catch (error) {
    console.error(`Failed to assign roles to ${member.user.tag}: ${error.message}`);

    // Check if the bot has permission to send messages in the debug channel
    const debugChannel = member.guild.channels.cache.get(config.debugChannel);
    if (debugChannel) {
      try {
        await debugChannel.send(`Error assigning roles to ${member.user.tag}: ${error.message}`);
      } catch (channelError) {
        // If the bot can't send a message to the debug channel, notify the server owner
        const owner = await member.guild.fetchOwner();
        if (owner) {
          owner.send(`Error assigning roles to ${member.user.tag}: ${error.message}`);
        }
      }
    } else {
      // If there's no debug channel, send the message to the server owner
      const owner = await member.guild.fetchOwner();
      if (owner) {
        owner.send(`Error assigning roles to ${member.user.tag}: ${error.message}`);
      }
    }
  }
}

// Event listener for when a new member joins the server
client.on(Events.GuildMemberAdd, async (member) => {
  console.log(`New member joined: ${member.user.tag}`);
  await assignBadgeRoles(member); // Check and assign badge roles
});

// Interaction event handling
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: '❌ There was an error executing this command!',
      ephemeral: true,
    });
  }
});

// Handle Uncaught Exceptions to prevent the bot from crashing
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Optionally, you can also log it to a file or a channel
  // process.exit(1); // This would kill the bot, but remove it to keep it alive
});

// Handle Unhandled Promise Rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  // Optionally log it or take action, but don't allow it to kill the bot
});

// Handle errors on the interaction handler
client.on('interactionCreate', async (interaction) => {
  try {
    if (!interaction.isCommand()) return;

    // Handle command execution here...
  } catch (error) {
    console.error('Error in interaction:', error);
    // Optionally log to a debug channel or take specific actions
    // You can also send a fallback response to the user if needed
  }
});

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  client.user.setPresence({
    activities: [{ name: 'your badges.', type: 3 }],
    status: 'online',
  });
});


// Log in to Discord
client.login(process.env.BOTTOKEN);
