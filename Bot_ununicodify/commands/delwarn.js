const { client, SlashCommandBuilder, TextInputStyle, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('delwarn')
    .setDescription('Delete a warn')
    .addIntegerOption(option =>
        option.setName('id')
        .setDescription('WarnID to filter')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const { EmbedBuilder } = require('discord.js');
        const config = require('../config.json');
        const date = new Date().toJSON();
        const warnId = interaction.options.getInteger('id');
        const logChannel = interaction.guild.channels.cache.get(config.deletedLogChannelID); //Fetch the logChannel from config

        let toBeDeleted = {};

        // Read database
        fs.readFile('./warns.json', 'utf8', (err, rawRead) => {
            let data = JSON.parse(rawRead);
            let deletedWarn;
            if(!data[0]) return sendNoWarnFound();

            data.forEach((warn, i, array) => {              
                if(warn.warnId == warnId) {
                    sendChannelEmbed(warn);
                    toBeDeleted.warn = warn;
                    toBeDeleted.index = i
                } 
            })

            if(JSON.stringify(toBeDeleted) == "{}") {
                sendNoWarnFound()
            }

            fs.writeFile('./warns.json', JSON.stringify(data, null, 4), (err) => {if(err) console.log(err)});
        })

        function sendNoWarnFound() {
            const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setDescription(`**Warn #${warnId} is not registered in the database!**\nFailed to delete.`)
            .setFooter({ text:interaction.user.tag, iconURL:interaction.user.displayAvatarURL() })
            .setTimestamp()
            interaction.reply({ embeds: [embed]})
        }

        async function sendChannelEmbed(warn) {
            let member;
            try{
                member = await interaction.guild.members.fetch(warn.userId).then(e => user = e.user);
            } catch {
                member = warn.userTag;
            }
            
            //const member = await interaction.guild.members.fetch(warn.userId) ? await interaction.guild.members.fetch(warn.userId).then(e => user = e.user) : warn.userTag;
            //const member = await interaction.guild.members.fetch(warn.userId).then(e => user = e.user)
            const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setDescription(`**You're about to remove warn #${warn.warnId}!**\nPlease confirm to continue.`)
            .setFooter({ text:interaction.user.tag, iconURL:interaction.user.displayAvatarURL() })
            .setTimestamp()
            .addFields(
                {name: 'Member', value:`${member}`},
                {name: 'Reason', value:warn.reason},
                {name: 'WarnID', value:`#${warn.warnId}`}
            )

            const row = new ActionRowBuilder()
			.addComponents(
                new ButtonBuilder()
                .setCustomId('confirm')
                .setLabel('Confirm')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✔️'),

            )
            .addComponents(
                new ButtonBuilder()
                .setCustomId('deny')
                .setLabel('Deny')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('✖️')
            )
            MSG = await interaction.reply({ embeds: [embed], ephemeral: true, components: [row]});

            const collector = await MSG.createMessageComponentCollector({ idle: 20000 });

            //Watch for button presses
            collector.on('collect', async interaction => {
    
                let user;
                const member = user ? await interaction.guild.members.fetch(warn.userId).then(e => user = e.user) : warn.userTag;
                if(interaction.customId == "confirm") {
                    //Update database
                    fs.readFile('./warns.json', 'utf8', (err, rawRead) => {
                        let data = JSON.parse(rawRead);
                        data.splice(toBeDeleted.index,1)
                        fs.writeFile('./warns.json', JSON.stringify(data, null, 4), (err) => {if(err) console.log(err)});
                    })
                    const embed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setDescription(`✔️ **Successfully deleted #${toBeDeleted.warn.warnId}!**`)
                    .setFooter({ text:interaction.user.tag, iconURL:interaction.user.displayAvatarURL() })
                    .setTimestamp()
                    .addFields(
                        {name: 'Member', value:`${member}`},
                        {name: 'Reason', value:toBeDeleted.warn.reason},
                        {name: 'WarnID', value:`#${toBeDeleted.warn.warnId}`}
                    )
                    interaction.reply({ embeds: [embed], ephemeral: true});
                    logChannel.send({embeds: [embed]});
    
                } else if(interaction.customId == "deny") {
                    const embed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setDescription(`✖️ **No longer deleting warn #${toBeDeleted.warn.warnId}!**`)
                    .setFooter({ text:interaction.user.tag, iconURL:interaction.user.displayAvatarURL() })
                    .setTimestamp()
                    .addFields(
                        {name: 'Member', value:`${user}`},
                        {name: 'Reason', value:toBeDeleted.warn.reason},
                        {name: 'WarnID', value:`#${toBeDeleted.warn.warnId}`}
                    )
                    interaction.reply({ embeds: [embed], ephemeral: true})
                }
            });
        }

    }
}
