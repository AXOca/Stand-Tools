const { Client, Events, GatewayIntentBits, Collection, Partials, EmbedBuilder, DiscordAPIError, Permissions, VoiceChannel, ActivityType } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates], partials: [Partials.GuildMember, Partials.Message] });
let config = require('./config.json')
require('dotenv').config()

client.on('ready', () => {
    client.guilds.cache.forEach(guild => {
        // Check if the guild id is not equal to the config.guildId
        if (guild.id != config.guildId) {
          // Make the bot leave the guild
          guild.leave()
            .then(g => console.log(`Left the guild: ${g}`))
            .catch(console.error);
        }
      });
})

client.login(process.env.UNUNICODIFY_TOKEN);