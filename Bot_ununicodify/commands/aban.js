const { SlashCommandBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('aban')
    .setDescription('Update the ban reason on a certain member')
    .addStringOption(option =>
		option.setName('user')
        .setDescription('The user you want to select')
        .setRequired(true))
    .addStringOption(option =>
        option.setName('reason')
        .setDescription('Reason for the ban'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const { EmbedBuilder } = require('discord.js');
        const config = require('../config.json');
        const userid = interaction.options.getString('user');
        const reason = interaction.options.getString('reason') ?? 'No reason provided';
        const logChannel = interaction.guild.channels.cache.get(config.deletedLogChannelID); //Fetch the logChannel from config

        //Fetch the corresponding log
        const auditLogs = await interaction.guild.fetchAuditLogs(
            {
                type: 22, /*MEMBER_BAN_ADD*/
                /*user: userid,*/
                limit: 10
            });
        const filteredEntries = auditLogs.entries.filter(entry => entry.target.id === userid);
        if(!filteredEntries) return interaction.reply("No audit log matches found!")
        const mostRecentEntry = filteredEntries.first();
        const { executor, target } = mostRecentEntry;

        //Update ban reason
        try {
            await interaction.guild.members.unban(userid);
        } catch {
            return interaction.reply({content: `Missing ban permissions for "${userid}", or user is not banned.`, ephemeral: "true"});
        }
        let banReason = `Banned by ${interaction.user.username} - ${reason || "No reason specified"}`
        interaction.guild.members.ban(userid, {reason: banReason});


        // Log ban to audit channel
        const currentDate = Math.floor(Date.now() / 1000);
        let banEmbed = new EmbedBuilder()
        .setAuthor({name:interaction.user.username, iconURL:interaction.user.displayAvatarURL()})
        .setColor('#FF0000')
        .setDescription(`**⛔ Ban reason updated for ${target.username}!**\n\n**Executor:** ${interaction.user}\n\n**Target:** ${target}\n\n**New Reason:** \`${banReason}\`\n\n**Previous Reason:** \`${mostRecentEntry.reason}\`\n<t:${currentDate}:F>`)
        .setTimestamp()
        .setFooter({text:interaction.client.user.username,iconURL:interaction.client.user.displayAvatarURL()})
    
        logChannel.send({embeds:[banEmbed]});
        interaction.reply({embeds:[banEmbed], ephemeral: true});
        console.log(`${interaction.user.tag} updated ban reason for ${target.username} to: ${banReason || "no reason"}`);
    }
}
