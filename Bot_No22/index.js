// Require the necessary discord.js classes
require('dotenv').config()
const fs = require('node:fs');
const path = require('node:path');
const { Client, Events, GatewayIntentBits, Collection, Partials, EmbedBuilder, DiscordAPIError, Permissions, VoiceChannel, ActivityType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('./config.json');
const date = new Date();

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds], partials: [Partials.GuildMember] });

const { FAQBackup, localeBackup} = require("./functions/backups")
FAQBackup()
setInterval(FAQBackup,604_800_000);
localeBackup()
setInterval(localeBackup,604_800_000);


client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}


client.on(Events.InteractionCreate, async interaction => {
    const command = interaction.client.commands.get(interaction.commandName);
	
	//Handle modals
	if (interaction.isModalSubmit()) {
		try {
				if(interaction.customId === "queryModal") {
					const { searchModal } = require("./modals/searchModal");
					searchModal(interaction);
				} else if(interaction.customId === "addFAQModal") {
					const { addFAQModal } = require("./modals/addFAQModal");
					addFAQModal(interaction);
				}
		} catch (error) {
			console.log(error)
		}
	}

	if (!command) return;

	//Handle commands and autocomplete
	if (interaction.isChatInputCommand()){	
		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	} else if (interaction.isAutocomplete()) {
		try {
			await command.autocomplete(interaction);
		} catch (error) {
			console.log(error)
		}
	}


});

// When the client is ready, run this code (only once)
client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
	client.user.setPresence({activities: [{ name: `/FAQ`, type: ActivityType.Watching }]});

	let readyEmbed = new EmbedBuilder()
	.setFooter({text:c.user.username, iconURL:c.user.displayAvatarURL()})
	.setColor(config.embedColor)
	.setTitle(`:arrows_counterclockwise: **${c.user.tag} (re)started!**`)
	.setTimestamp()
	
	const logChannel = client.channels.cache.get(config.logchannelID); //Fetch the logChannel from config
	logChannel.send({embeds:[readyEmbed]})
	// if(client.user.id != '1066134112961835060') {
	// 	const testingLogChannel = client.channels.cache.get('1114647544824332360');
	// 		testingLogChannel.send({embeds:[embed]})
	// }
});

// Log in to Discord with your client's token
client.login(process.env.NO22_TOKEN);
