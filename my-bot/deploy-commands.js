const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const chalk = require('chalk');

const clientId = '1295714784624513035';
const token = process.env.BOTTOKEN;

const commands = [];
const commandNames = [];

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log(chalk.cyan(`\nLoading ${commandFiles.length} command(s) from ./commands...\n`));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  try {
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
      commandNames.push(command.data.name);
      console.log(chalk.green(`✔ Loaded: ${command.data.name}`));
    } else {
      console.log(chalk.yellow(`⚠ Skipped: ${file} is missing "data" or "execute"`));
    }
  } catch (err) {
    console.log(chalk.red(`✖ Error loading ${file}:`), err);
  }
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(chalk.blue('\nDeploying global application (/) commands...\n'));

    const data = await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    );

    console.log(chalk.green(`\n✅ Successfully deployed ${data.length} global command(s):`));
    console.log(chalk.magentaBright(`- ${commandNames.join('\n- ')}`));
  } catch (error) {
    console.error(chalk.red('\n❌ Failed to deploy commands:'), error);
  }
})();
