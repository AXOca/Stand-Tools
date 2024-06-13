const { SlashCommandBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('ws')
    .setDescription('Silently warn users')
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
        let warnId;

        // Update database
        fs.readFile('./warns.json', 'utf8', (err, rawRead) => {
            let data = JSON.parse(rawRead);
            warnId = data[data.length-1].warnId + 1
            const warn = {
                warnId:warnId,
                userId:user.id,
                reason:reason,
                time:date,
                timestamp:Date.now()
            }
            data.push(warn);

            sendChannelEmbed(warn);
            fs.writeFile('./warns.json', JSON.stringify(data, null, 4), (err) => {if(err) console.log(err)});
        })

        function sendChannelEmbed(warn) {
            const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setDescription(`⚠️ **${user} has been silently warned!**`)
            .setFooter({ text:interaction.user.tag, iconURL:interaction.user.displayAvatarURL() })
            .setTimestamp()
            .addFields(
                {name: 'Reason:', value:reason},
                {name: 'WarnID', value:`#${warn.warnId}`}
            )
            interaction.reply({ embeds: [embed], ephemeral: true});
            logChannel.send({ embeds: [embed]})
        }
    }
}