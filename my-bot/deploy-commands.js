const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

// Replace with your bot's info
const clientId = '1295714784624513035';
const token = process.env.BOTTOKEN;

const commands = [];

// Path to the commands folder
const commandsPath = path.join(__dirname, 'commands');

// Get all .js files in the commands folder
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Load each command and push its data to the array
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if (command?.data) {
    commands.push(command.data.toJSON());
  } else {
    console.warn(`[WARNING] The command at ${filePath} is missing "data" or is not valid.`);
  }
}

// Deploy commands
const rest = new REST().setToken(token);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();
