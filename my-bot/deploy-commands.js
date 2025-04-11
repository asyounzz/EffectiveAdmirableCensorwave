// deploy-commands.js
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const clientId = '1295714784624513035';
const guildId = '972244217927712899';
const token = process.env.BOTTOKEN;

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  } else {
    console.log(`[WARNING] Command at ${filePath} is missing required "data" or "execute"`);
  }
}

const rest = new REST({ version: '9' }).setToken(process.env.BOTTOKEN);

// Register commands globally
(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(clientId), // Global commands registration
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();