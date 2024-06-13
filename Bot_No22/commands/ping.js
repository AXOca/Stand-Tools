const { SlashCommandBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot ping')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const { EmbedBuilder } = require('discord.js');
        const config = require('../config.json');

        const pingEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle("🏓 Pong!")
        .setDescription(`Latency is ${Date.now() - interaction.createdTimestamp}ms. API Latency is ${Math.round(interaction.client.ws.ping)}ms`)
        .setFooter({ text:interaction.user.tag, iconURL:interaction.user.displayAvatarURL() })
        .setTimestamp()
        interaction.reply({ embeds: [pingEmbed], ephemeral: true});
    }
}
