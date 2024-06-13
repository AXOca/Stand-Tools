const { SlashCommandBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('warnlist')
    .setDescription('Warn users')
    .addUserOption(option =>
		option.setName('user')
        .setDescription('Filter based on userId'))
    .addIntegerOption(option =>
        option.setName('id')
        .setDescription('Filter based on WarnId'))
    .addStringOption(option => 
        option.setName('reason')
        .setDescription('Filter based on reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const { EmbedBuilder } = require('discord.js');
        const config = require('../config.json');
        const user = interaction.options.getUser('user');
        const id = interaction.options.getInteger('id')
        const reason = interaction.options.getString('reason');

        // Read database
        fs.readFile('./warns.json', 'utf8', (err, rawRead) => {
            let data = JSON.parse(rawRead);
            
            let filters = true;
            let description = "**Active filters:**"
            if(user) description += '\n`User:`' + `${user}`;
            if(id) description += '\n`WarnId:` ' + id;
            if(reason) description += '\n`Reason:` ' + reason;
            if(!user && !id && !reason) {
                filters = false;
                description += `\n*None*`
            }

            let results = []
            data.forEach(warn => {
                if(user && user.id == warn.userId) results.push(warn)
                else if(id && id == warn.warnId) results.push(warn)
                else if(reason && reason == warn.reason) results.push(warn)
            });

            if(results.length == 0 && filters) {
                results = "*No results*"
            } else if(results.length == 0) results = data
            
            //List max 5 results
            let shortened = false;
            if(results.length>5) {   
                results.length = 5;
                shortened = true;
            }

            
            const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`Warn Lookup Results`)
            .setDescription(description)

            if(results == "*No results*") {
                embed.addFields(
                    { name: `No results`, value: `Turn off filters to see all results.`}
                )
                return interaction.reply({ embeds: [embed], ephemeral: true});
            }
            
            results.forEach(async (warn, index, array) => {
                let user;
                try {
                    await interaction.guild.members.fetch(warn.userId).then(e => user = e.user);
                } catch {
                    user = 'undefined'
                }
                embed.addFields(
                    { name:`• Warn #${warn.warnId}`, value:`**User:** ${user}\n**Logged Tag:** ${warn.userTag}\n**Reason:** ${warn.reason}\n<t:${Math.floor(warn.timestamp/1000)}>`}
                )
                if(index+1 == results.length) {
                    if(shortened) {
                        embed.addFields(
                            { name:'And more...', value:'If you want to see more results, export the databse using </export:1075112480642187385>'}
                        )
                    }
                    interaction.reply({ embeds: [embed], ephemeral: true})
                }
            })
        })
    }
}