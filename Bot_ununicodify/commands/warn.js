const { SlashCommandBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn users')
    .addUserOption(option =>
		option.setName('user')
        .setDescription('The person you want to warn')
        .setRequired(true))
    .addStringOption(option =>
        option.setName('reason')
        .setDescription('Reason for the warn'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const { EmbedBuilder } = require('discord.js');
        const config = require('../config.json');
        const date = new Date().toJSON();
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') ?? 'No reason provided';
        const logChannel = interaction.guild.channels.cache.get(config.deletedLogChannelID); //Fetch the logChannel from config
        let warnId = 0;

        // Update database
        fs.readFile('./warns.json', 'utf8', (err, rawRead) => {
            let data = JSON.parse(rawRead);
            if(data.length>0) warnId = data[data.length-1].warnId + 1
            const warn = {
                warnId:warnId,
                userId:user.id,
                userTag:user.tag,
                reason:reason,
                time:date,
                timestamp:Date.now()
            }
            data.push(warn);

            sendChannelEmbed(warn);
            sendDMEmbed(warn);
            fs.writeFile('./warns.json', JSON.stringify(data, null, 4), (err) => {if(err) console.log(err)});
        })

        function sendChannelEmbed(warn) {
            const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setDescription(`⚠️ **${user} has been warned!**`)
            .setFooter({ text:interaction.user.tag, iconURL:interaction.user.displayAvatarURL() })
            .setTimestamp()
            .addFields(
                {name: 'Reason:', value:reason},
                {name: 'WarnID', value:`#${warn.warnId}`}
            )
            interaction.reply({ embeds: [embed], ephemeral: true});
            logChannel.send({ embeds: [embed]})
        }
        function sendDMEmbed(warn) {
            const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setDescription(`⚠️ **${user}, you've been warned in: __*${interaction.guild.name}*__**`)
            .setFooter({ text:interaction.user.tag, iconURL:interaction.user.displayAvatarURL() })
            .setTimestamp()
            .addFields(
                {name: 'Reason:', value:reason},
                {name: 'WarnID', value:`#${warn.warnId}`}
            )
            user.send({ embeds: [embed] }).catch(error => {logChannel.send(`**Something went wrong sending a DM to ${user}**, error:` + "``" + error.rawError.message + "``")});
        }
    }
}
