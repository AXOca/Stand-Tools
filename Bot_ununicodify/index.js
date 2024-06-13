// Require the necessary discord.js classes
require('dotenv').config()
const fs = require('node:fs');
const path = require('node:path');
const { Client, Events, GatewayIntentBits, Collection, Partials, EmbedBuilder, DiscordAPIError, Permissions, VoiceChannel, ActivityType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('./config.json');
const dehoist = require('./function');
const date = new Date();
const request = require('request');

// Dehoisting Exclusions
const excludedUserIDs = ['1100712370009730062'];

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildModeration], partials: [Partials.GuildMember, Partials.Message] });

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
    if (!interaction.isChatInputCommand()) return;
	
    const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

//---------------- Backups -------------------------

const createBackup = () => {
	var date = new Date().toJSON().slice(0,19).replace(/:/g,'.');
	fs.readFile("./CustomCommands.json", "utf-8", (err, raw) => {
		fs.writeFile(`./backups/CustomCommands-${date}.json`, raw, (err) => {if(err) console.log(err)});
	})
	console.log(`Created CustomCommands backup: CustomCommands-${date}.json`)
}
createBackup()
setInterval(createBackup,604_800_000) //Create weekly backup of Custom Commands

//---------------- Custom Commands -----------------

var skipLog = false;
let CustomCommands = require('./CustomCommands.json');

client.on("messageCreate", async message => {
	let msgContent = message.content.toLowerCase();
	
	if(message.author.bot) return;
	if(msgContent == '!reloadcommands' || msgContent == '!reload') {
		if (!message.member.permissions.has("Administrator")) return message.channel.send(`${message.author}***, only people with the following permissions can run this command:*** ` + "``ADMINISTRATOR``")
		let reply = await message.channel.send(` ${message.author}***, Reloading commands..***`)

		fs.readFile('./CustomCommands.json', 'utf8', (err, rawRead) => {
			CustomCommands = JSON.parse(rawRead);
			console.log(CustomCommands);
			reply.edit(`${message.author}**, reloaded commands.**`)
		})
	}

	CustomCommands.forEach(CustomCommand => {
		if(msgContent == CustomCommand.command) {		
			let hasRole = false;
			if(config.commandsRoleID.length) {
				config.commandsRoleID.forEach(commandRole => {
					if(message.member.roles.cache.find(r => r.id == commandRole)) hasRole = true;
				})
			} else {
				if(message.member.roles.cache.find(r => r.id == config.commandsRoleID)) hasRole = true;

			}
			if(config.commandsRoleID >0 && !hasRole) return message.channel.send(`**${message.author}, you don't have sufficient roles to execute this command!**`)
			
			const logChannel = client.channels.cache.get(config.deletedLogChannelID);
			if(!CustomCommand.title || !CustomCommand.description) {
				logChannel.send(`**Something went wrong!**\n\n Please check the syntax of the following command:` + '``' + CustomCommand.command + '``' +`\n\nExecuted by: ${message.author}`); 
				message.channel.send(`${message.author}, an error occured whilst trying to execute the following command: \`\`${CustomCommand.command}\`\`.`).then((msg) => {
					setTimeout(() => {
						skipLog = true
						msg.delete()
						setTimeout(() => {skipLog = false},2000)
					},20000)
				})

				//Don't log the deleted message
				skipLog = true
				setTimeout(() => {skipLog = false},2000)
				return message.delete();
			}
			
			const embed = new EmbedBuilder()
			.setTitle(CustomCommand.title)
			.setDescription(CustomCommand.description)
			.setColor(config.embedColor)
			.setAuthor({ name:client.user.tag, iconURL:client.user.displayAvatarURL()})
			if(CustomCommand.color) {
				embed.setColor(CustomCommand.color);
			}
			if(CustomCommand.image) {
				embed.setImage(CustomCommand.image);
			}
			
			const row = new ActionRowBuilder()
			if(CustomCommand.button) {
				row.addComponents(
					new ButtonBuilder()
					.setStyle(ButtonStyle.Link)
					.setLabel(CustomCommand.button.label)
					.setURL(CustomCommand.button.URL)
					)
			}

			//Don't log the deleted message
			skipLog = true
			setTimeout(() => {skipLog = false},5000)
			message.delete();
			
			//Count command for statistics
			CustomCommand.totalUsage += 1;
			CustomCommand.monthlyUsage += 1;
			fs.writeFile('./CustomCommands.json', JSON.stringify(CustomCommands, null, 4), (err) => {if(err) console.log(err)});
			
			let attachments;
			if(CustomCommand.attachments && CustomCommand.attachments[0]) {
				attachments = CustomCommand.attachments.map(file => {return {attachment:`attachments/${file}`}});
			}

			//Send command reply
			if(CustomCommand.button) {
				message.channel.send({ embeds: [embed], components: [row], allowedMentions: { parse: [] }}).then(msg => {
					if(attachments) msg.reply({files:attachments});
				})
			} else {
				message.channel.send({ embeds: [embed], allowedMentions: { parse: [] }}).then(msg => {
					if(attachments) msg.reply({files:attachments});
				})
			}
		}
	})
});


//Clear monthly intervals
function resetMonthly() {
	const currentDate = new Date();
		
	// Check if the month has changed since last check
	if (currentDate.getDate() === 1) {
	// 	Update database
		fs.readFile('./CustomCommands.json', 'utf8', (err, rawRead) => {
			if(err) return;
			let commands = JSON.parse(rawRead);
			commands.forEach(command => { command.monthlyUsage = 0 })
			fs.writeFile('./CustomCommands.json', JSON.stringify(commands, null, 4), (err) => {if(err) console.log(err)});
		})
	}
}
resetMonthly();
setInterval(resetMonthly, 86400000); // Check every day (in milliseconds)

//Add usage parameters to commands if missing
fs.readFile('./CustomCommands.json', 'utf8', (err, rawRead) => {
	let commands = JSON.parse(rawRead);
	commands.forEach(command => {
		if(!command.monthlyUsage) {
			command.monthlyUsage = 0
		}
		if(!command.totalUsage) {
			command.totalUsage = 0
		}
	})
	fs.writeFile('./CustomCommands.json', JSON.stringify(commands, null, 4), (err) => {if(err) console.log(err)});
})

// ---------------------- DEHOIST USERNAMES ----------------------

let dehoistJoins = config.dehoistjoins;
let dehoistRenames = config.dehoistrenames;
let autoReban = config.autoReban;
//Listen for any changes to the config
fs.watch("./config.json", (eventType, filename) => {
	fs.readFile('./config.json', 'utf8', (err, rawRead) => {
		let data = JSON.parse(rawRead);
		dehoistJoins = data.dehoistjoins;
		dehoistRenames = data.dehoistrenames;
		autoReban = data.autoReban;
		console.log(`Received config update!\n→ dehoistJoins = ${dehoistJoins}\n→ dehoistRenames = ${dehoistRenames}\n→ autoReban = ${autoReban}`);
	})
});

//---------------------- DEHOIST NEW MEMBERS ----------------------
client.on('guildMemberAdd', member => {
    if(dehoistJoins) {
        // Check if the member is in the excluded list
        if (excludedUserIDs.includes(member.user.id)) {
            console.log(`Skipping dehoisting for excluded user: ${member.user.tag}`);
            return;
        }

        // Use the API directly to get the user object with the global_name property
        let options = {
            url: `https://discord.com/api/users/${member.user.id}`, //the endpoint URL
            method: 'GET', //the HTTP method
            headers: {
                'Authorization': `Bot ${process.env.UNUNICODIFY_TOKEN}` //the authorization header
            }
        };

        request(options, function(err, res, body) {
            if (err) {
                console.error("ERROR FETCHING USER USING RAW API" + err); //handle errors
            } else {
                let user = JSON.parse(body);
                dehoist(user, client);
            }
        });
        
        console.log(`➕ '${member.user.tag}' joined, checking for hoisted username.`);
    }
});

//---------------------- DEHOIST RENAMES ----------------------
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    if(dehoistRenames) {
        // Check if the member is in the excluded list
        if (excludedUserIDs.includes(newMember.user.id)) {
            console.log(`Skipping dehoisting for excluded user: ${newMember.user.tag}`);
            return;
        }

        console.log(`⏩ '${newMember.user.tag}' potentially updated their username, checking for hoisted username.\n  → Second execution is bot updating nickname. Expected behavior.`);

        // Use the API directly to get the user object with the global_name property
        let options = {
            url: `https://discord.com/api/users/${newMember.user.id}`, //the endpoint URL
            method: 'GET', //the HTTP method
            headers: {
                'Authorization': `Bot ${process.env.UNUNICODIFY_TOKEN}` //the authorization header
            }
        };

        request(options, function(err, res, body) {
            if (err) {
                console.error("ERROR FETCHING USER USING RAW API" + err); //handle errors
            } else {
                let user = JSON.parse(body);
                dehoist(user, client, oldMember);
            }
        });
    }
});


//---------------------- LOG EDITED MESSAGES ----------------------

client.on("messageUpdate", (oldMessage, newMessage) => {
	if(oldMessage.guild.id != config.guildId) return console.log("Incorrect guild - skipping edited message");

	if(!oldMessage.partial) {
		if(oldMessage.content === newMessage.content) return
		if(newMessage.author.bot) return
	}
	try {
		if(newMessage.author.bot) return
	} catch {
		console.log(newMessage);
		return console.error(`newMessage.author.bot undefined error, please report!`);
	}

	console.log("Logging updated message");

	
	const logChannel = client.channels.cache.get(config.deletedLogChannelID);
	const oldDate = Math.floor(oldMessage.createdTimestamp / 1000);
	const newDate = Math.floor(newMessage.createdTimestamp / 1000);

	let oldMessageContents,
	newMessageContents
	if(oldMessage.partial) {
		oldMessageContents = `⚠️ *Partial Message*\n`
	} else if(!oldMessage.content) {
		oldMessageContents = `⚠️ *No message content*\n`
	}
	else if(oldMessage.content.length>1024) { //Prevent hitting embed character limit
		oldMessageContents = newMessage.content.substring(0,1001) + "\n**...**"
	} else {
		oldMessageContents = oldMessage.content;
	}
	if(newMessage.content.length>1024) { //Prevent hitting embed character limit
		newMessageContents = newMessage.content.substring(0,1001) + "\n**...**"
	} else if(!newMessage.content) {
		newMessageContents = `⚠️ *No message content*\n`
	} else {
		newMessageContents = newMessage.content;
	}
	
	if(!oldMessageContents) {
		oldMessageContents = "``No message content``"
	}
	if(!newMessageContents) {
		newMessageContents = "``No message content``"
	}
	
	const embed = new EmbedBuilder()
	.setColor(config.embedColor)
	.setDescription(`Message edited in: ${newMessage.channel} (${newMessage.channel.name})`)
	.setAuthor({ name:newMessage.author.tag, iconURL:newMessage.author.displayAvatarURL() })
	.addFields(
			{ name: 'Old content', value:oldMessageContents },
			{ name: 'New content', value:newMessageContents },
			{ name: 'Date', value: `<t:${oldDate}:F>\n↓\n<t:${newDate}:F>`},
			{ name: 'ID', value: '```js\nuserID:    ' + newMessage.author.id + '\nmessageID: ' + newMessage.id + '\n```'}
		)

	if(oldMessage.partial) {
		embed.addFields(
			{name: "ℹ️ Partial Message", value: "This is a message which cannot be logged, because it was not cached before removal."}
		)
	}

	logChannel.send({embeds: [embed]});

})

//---------------------- LOG VC STATE UPDATES ----------------------
client.on("voiceStateUpdate", (oldState, newState) => {
	if(newState.guild.id != config.guildId) return console.log("Incorrect guild - skipping voice update")
	const currentDate = Math.floor(Date.now() / 1000);
	const logChannel = client.channels.cache.get(config.deletedLogChannelID); //Fetch the logChannel from config
	const user = client.users.cache.get(newState.id);
	
	const embed = new EmbedBuilder()
	.setColor(config.embedColor)
	.setAuthor({ name:user.tag, iconURL:user.displayAvatarURL()})

	// Check if the user joined a voice channel
	if(oldState.channelId === null && newState.channelId !== null) {
	  embed.setDescription(`**${user} joined <#${newState.channelId}>**`)
	  embed.addFields(
		{ name: 'Date', value: `<t:${currentDate}:F>`}
	  )
	}
	// Check if the user left a voice channel
	if(oldState.channelId !== null && newState.channelId === null) {
		embed.setDescription(`**${user} left <#${oldState.channelId}>**`)
		embed.addFields(
			{ name: 'Date', value: `<t:${currentDate}:F>`}
		)
	}
	if(oldState.channelId !== null && newState.channelId !== null) {
		if(oldState.channel === newState.channel) return;
		embed.setDescription(`**${user} moved voice channels**`)
		embed.addFields(
			{ name: "Previous Channel", value: `<#${oldState.channelId}>`},
			{ name: "New Channel", value: `<#${newState.channelId}>`},
			{ name: 'Date', value: `<t:${currentDate}:F>`}
		)
	}

	logChannel.send({ embeds: [embed]})
	console.log("Logging voice update");
})

//---------------------- LOG DELETED MESSAGES ----------------------

let newMessage = false;
let deletedMessages = new Map();
let intervalTimer;
client.on("messageDelete", async (msg) => {
	if(skipLog) return
	var shouldSkip = false

	//Delete self-messages
	if(!msg.partial) {
		//Delete CustomCommands
		CustomCommands.forEach( CustomCommand => { //Do not log bot deleting CustomCommand commands
			if(msg.content == CustomCommand.command || msg.guild.id!=config.guildId) shouldSkip = true;
		})

		if(msg.author.id == client.user.id) shouldSkip = true
	
		//Delete Account IDs
		if(hasAccountID(msg)) shouldSkip = true

	}

	if(shouldSkip) return console.log("Skipping deleted msg log");


	deletedMessages.set(msg.id,msg);
	newMessage = true;
	collectDeleted(false, msg);
})

client.on('messageDeleteBulk', async messages => {
	const [firstValue] = messages.values(); //Define "first" value in map for shared properties such as channel
	if(firstValue.guild.id != config.guildId) return

	logBulk(messages);
});

function collectDeleted(loop, deletedMessage) {
	//console.log(`collectDeleted() ran, newMessage ${newMessage}, loop ${loop}`);
	if(newMessage) { //Reset timer for bundle check
		clearTimeout(intervalTimer)
		intervalTimer = setTimeout(collectDeleted,config.bulkDeleteIntervalMS,true, deletedMessage);
	} else if(loop) { //No new messages upon check, reset window and bulk log
		if(deletedMessages.size > 1) { //Multiple msgs were deleted
			logBulk(deletedMessages);
		} else { //One message was deleted
			logSingle(deletedMessage);
		}
		//Reset deletedMessages set
		deletedMessages = new Map();
	}
	newMessage = false;
}

function logSingle(msg) {
	console.log("Logging single message delete");

	const channel = client.channels.cache.get(config.deletedLogChannelID);
	const currentDate = Math.floor(Date.now() / 1000);
	let contents = ""

	const embed = new EmbedBuilder()
	.setColor(config.embedColor)
	.setDescription(`Message deleted in: ${msg.channel} (${msg.channel.name})`)

	if(msg.content) {
		contents += msg.content
	}
	if(msg.attachments.size > 0) {
		contents += "\n``Message contains attachments``"
	}
	if(msg.embeds.length > 0) {
		contents += "\n``Message contains embeds``"
	}
	if(!contents) {
		contents = "``No message content``"
	}

	if(contents.length>1024) { //Prevent hitting embed character limit
		formattedContents = contents.substring(0,1001) + "\n**...**"
	} else {
		formattedContents = contents;
	}

	if (msg.partial) {
		console.log("Detected msg.partial")
		embed.setAuthor({ name:client.user.tag, iconURL:client.user.displayAvatarURL()})
		embed.addFields(
			{ name: '⚠️ Content', value:"Message content unavailable" },
			{ name: 'Date', value: `<t:${currentDate}:F>`},
			{ name: '⚠️ ID', value: '```js\nuserID:    ' + 'userID unavailable' + '\nmessageID: ' + msg.id + '\n```'}
		)
	} else {
		embed.setAuthor({ name:msg.author.tag, iconURL:msg.author.displayAvatarURL() })
		embed.addFields(
			{ name: 'Content', value:formattedContents },
			//{ name: 'Content', value:msg.embeds.length>0 ? "``Message contains embeds``" : msg.content}, //>0 true and false conditions are switched, no idea why...
			//{ name: 'Content', value:msg.attachments.length>0 ? "Message contains attachments" : msg.embeds.length>0 ? "``Message contains embeds``" : msg.content}, //>0 true and false conditions are switched, no idea why...
			{ name: 'Date', value: `<t:${currentDate}:F>`},
			{ name: 'ID', value: '```js\nuserID:    ' + msg.author.id + '\nmessageID: ' + msg.id + '\n```'}
		)
	}		

	if(msg.attachments.size > 0 ) {
		let files = []
		msg.attachments.forEach(attachment => {
			files.push(attachment.attachment);
		})
		channel.send({ embeds: [embed], files: files})
	} else {
		channel.send({ embeds: [embed]});
	}
	console.log("Finished single message delete log")
}

function logBulk(messages) {
	console.log("Logging bulk message delete");

	const logChannel = client.channels.cache.get(config.deletedLogChannelID); //Fetch the logChannel from config
	const currentDate = Math.floor(Date.now() / 1000);
	const [firstValue] = messages.values(); //Define "first" value in map for shared properties such as channel

	let channel = firstValue.channel;
	let size = messages.size; //Amount of deleted messages
	
	let files = []
	let contents = ""; //Group message contents in string
	let allPartial = true;
	messages.forEach(message => {
		if(message.author) {
			allPartial = false;
			if(message.content) {
				contents += `<@${message.author.id}>, [${message.author.tag}]: ${message.content}\n`
			} else {
				contents += `${message.author.id}>, [${message.author.tag}]: ` + '`No message content / embed`\n'
			}
		} else {
			contents += `⚠️ *Partial Message*\n`
		}
		//contents += message.author ? `<@${message.author.id}>, [${message.author.tag}]: ${message.content ? message.content : '`No message content / embed`'}\n` : "⚠️ *Partial Message*\n"
		
		message.attachments.forEach(attachment => {
			files.push(attachment.attachment);
		})
	})

	if(contents.length>1024) {
		formattedContents = contents.substring(0,1001) + "\n**...**"
	} else {
		formattedContents = contents;
	}

	if(allPartial) {
		formattedContents = `⚠️ *Partial Message* (x${messages.size})`
	}

	const embed = new EmbedBuilder()
		.setAuthor({name:client.user.username, iconURL:client.user.displayAvatarURL()})
		.setColor(config.embedColor)
		.setDescription(`**${size}** messages deleted in: ${channel} (${channel.name})`)
		.addFields(
			{ name: 'Contents', value:formattedContents },
			{ name: 'Date', value: `<t:${currentDate}:F>`}
			)

	if(contents.includes('⚠️ *Partial Message*\n')) {
		embed.addFields(
			{name: "ℹ️ Partial Message", value: "This is a message which cannot be logged, because it was not cached before removal."}
		)
	}

	if(files[0]) {
		logChannel.send({ embeds: [embed], files: files})
	} else {
		logChannel.send({embeds: [embed]});
	}
}

//-------------------------------------------------------- DELETE ACCOUNT ID's --------------------------------------------------------//

function hasAccountID(message) {
	/*
	if(message.content.startsWith('https://')) return;
	if(message.content.startsWith('```')) return;
	let codingRegex = /[{}>#$]/g;
	if(codingRegex.test(message.content)) return;

	let regex = /\b[a-zA-Z0-9]{31}\b/; // Token regex
	if(regex.test(message.content)) return true;
	*/
    // Temporarily disable account ID detection by always returning false.
    return false;

}

client.on("messageCreate", (message) => {
	const logChannel = client.channels.cache.get(config.deletedLogChannelID); //Fetch the logChannel from config

	if(!hasAccountID(message)) return
	console.log("Found ID, deleting message."/*,message.content.match(regex)*/);
	message.delete()

	let warningEmbed = new EmbedBuilder()
	.setAuthor({name:client.user.username, iconURL:client.user.displayAvatarURL()})
	.setColor(config.embedColor)
	.setDescription(`**⚠️ ${message.author}, don't share your Account ID!**\n\nIt appears that you recently attempted to share your Account ID. Please avoid doing so. If staff members request it, providing the first 5 digits should suffice`)
	
	let regex = /\b[a-zA-Z0-9]{31}\b/g; // Token regex
	let messageContent = message.content.replace(regex, '``<TOKEN>``')

	let logEmbed = new EmbedBuilder()
	.setAuthor({name:client.user.username, iconURL:client.user.displayAvatarURL()})
	.setColor('#FF0000')
	.setDescription(`**⚠️ ${message.author} shared their Account ID. Deleting message.**\n\n**Content:** ${messageContent}`)

	message.channel.send({embeds:[warningEmbed]}).then(msg => setTimeout(() => {
		//Don't log the deleted message
		skipLog = true
		setTimeout(() => {skipLog = false},2000)
		msg.delete()
	}, 20000));
	logChannel.send({embeds:[logEmbed]})
})

//-------------------------------------------------------- LOG BANS --------------------------------------------------------//

client.on('guildBanAdd', async (member) => {
	if(!autoReban) return;

	console.log("Guildbanadd event fired"); //-
	const banned = await member.guild.fetchAuditLogs({
        type: 22, //MEMBER_BAN_ADD
        limit: 1
    });

	bannedUser = banned.entries.first()
	const { executor, target } = bannedUser;

	//Ignore other guilds
	if(member.guild.id != config.guildId) return
	//Ignore self-bans
	if(executor.id == client.user.id) return
	//Ignore IDs in config
	let hasID = false;
	if(config.noRebanID.length) {
		config.noRebanID.forEach(id => {
			if(executor.id == id) hasID = true;
		})
	}
	if(hasID) return

	//Update ban reason
	try {
		await member.guild.members.unban(member.user.id);
		console.log("Unbanned someone") //-
	} catch {
		return console.log(`Missing ban permissions for ${member.user.username}`);
	}
	let reason = `Banned by ${executor.username} - ${bannedUser.reason ? bannedUser.reason : "No reason specified"}`
	await member.guild.members.ban(member.user, {reason: reason});
	console.log("Banned someone") //-

	// Log ban to audit channel
	const logChannel = client.channels.cache.get(config.deletedLogChannelID); //Fetch the logChannel from config
	const currentDate = Math.floor(Date.now() / 1000);
	let banEmbed = new EmbedBuilder()
	.setAuthor({name:executor.username, iconURL:executor.displayAvatarURL()})
	.setColor('#FF0000')
	.setDescription(`**⛔ ${target.username} has been banned!**\n\n**Executor:** ${executor}\n\n**Target:** ${target}\n\n**Reason:** \`${reason}\`\n<t:${currentDate}:F>`)
	.setTimestamp()
	.setFooter({text:client.user.username,iconURL:client.user.displayAvatarURL()})

	logChannel.send({embeds:[banEmbed]})
	console.log(`${executor.username} banned ${target.username} for ${bannedUser.reason || "no reason"}`);
});


//-------------------------------------------------------- LOG KICKS --------------------------------------------------------//

//Log Kicks
client.on('guildMemberRemove', async member => {
	const fetchedLogs = await member.guild.fetchAuditLogs({
		limit: 1,
		type: '20',
	});
	// Since we only have 1 audit log entry in this collection, we can simply grab the first one
	const kickLog = fetchedLogs.entries.first();
	if (!kickLog) return

	const { executor, target, reason } = kickLog;
	//Ignore other guilds
	if(member.guild.id != config.guildId) return
	//Ignore self-kick
	if(executor.id == client.user.id) return
	//Ignore IDs in config
	let hasID = false;
	if(config.noRebanID.length) {
		config.noRebanID.forEach(id => {
			if(executor.id == id) hasID = true;
		})
	}
	if(hasID) return

    // We now grab the user object of the person who kicked our member
    // Let us also grab the target of this action to double check things

    if (kickLog.createdAt < member.joinedAt) { 
        return
    }

    // And now we can update our output with a bit more information
    // We will also run a check to make sure the log we got was for the same kicked member
    if (target.id === member.id) {
        	// Log kick to audit channel
			const logChannel = client.channels.cache.get(config.deletedLogChannelID); //Fetch the logChannel from config
			const currentDate = Math.floor(Date.now() / 1000);
			let kickEmbed = new EmbedBuilder()
			.setAuthor({name:executor.username, iconURL:executor.displayAvatarURL()})
			.setColor('#FF0000')
			.setDescription(`**⛔ ${target.username} has been kicked!**\n\n**Executor:** ${executor}\n\n**Target:** ${target}\n\n**Reason:** \`${reason ?? "No reason specified"}\`\n<t:${currentDate}:F>`)
			.setTimestamp()
			.setFooter({text:client.user.username,iconURL:client.user.displayAvatarURL()})

			logChannel.send({embeds:[kickEmbed]})
    }
});

client.on('guildBanAdd', async (member) => {

	console.log("Guildbanadd event fired"); //-
	const banned = await member.guild.fetchAuditLogs({
        type: 22, //MEMBER_BAN_ADD
        limit: 1
    });

	bannedUser = banned.entries.first()
	const { executor, target } = bannedUser;

	//Ignore other guilds
	if(member.guild.id != config.guildId) return
	//Ignore self-bans
	if(executor.id == client.user.id) return
	//Ignore IDs in config
	let hasID = false;
	if(config.noRebanID.length) {
		config.noRebanID.forEach(id => {
			if(executor.id == id) hasID = true;
		})
	}
	if(hasID) return

	//Update ban reason
	try {
		await member.guild.members.unban(member.user.id);
		console.log("Unbanned someone") //-
	} catch {
		return console.log(`Missing ban permissions for ${member.user.username}`);
	}
	let reason = `Banned by ${executor.username} - ${bannedUser.reason ? bannedUser.reason : "No reason specified"}`
	await member.guild.members.ban(member.user, {reason: reason});
	console.log("Banned someone") //-

	// Log ban to audit channel
	const logChannel = client.channels.cache.get(config.deletedLogChannelID); //Fetch the logChannel from config
	const currentDate = Math.floor(Date.now() / 1000);
	let banEmbed = new EmbedBuilder()
	.setAuthor({name:executor.username, iconURL:executor.displayAvatarURL()})
	.setColor('#FF0000')
	.setDescription(`**⛔ ${target.username} has been banned!**\n\n**Executor:** ${executor}\n\n**Target:** ${target}\n\n**Reason:** \`${reason}\`\n<t:${currentDate}:F>`)
	.setTimestamp()
	.setFooter({text:client.user.username,iconURL:client.user.displayAvatarURL()})

	logChannel.send({embeds:[banEmbed]})
	console.log(`${executor.username} banned ${target.username} for ${bannedUser.reason || "no reason"}`);
});

//-----------------------------------------------------------------------------------------------------------------------------//

// When the client is ready, run this code (only once)
client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
	const logChannel = client.channels.cache.get(config.deletedLogChannelID); //Fetch the logChannel from config
	const testingLogChannel = client.channels.cache.get('1114647544824332360');

	
	
	let embed = new EmbedBuilder()
	.setFooter({text:c.user.username, iconURL:c.user.displayAvatarURL()})
	.setColor(config.embedColor)
	.setTitle(`:arrows_counterclockwise: **${c.user.tag} (re)started!**`)
	.setTimestamp()

	//logChannel.send({embeds:[embed]})
	if(client.user.id != '00661341002900835060') {
		testingLogChannel.send({embeds:[embed]})
	}
});

// Log in to Discord with your client's token
client.login(process.env.UNUNICODIFY_TOKEN);