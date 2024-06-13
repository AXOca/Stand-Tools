const { client, SlashCommandBuilder, TextInputStyle, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Set or list timeouts!')
    .addSubcommand(subcommand =>
        subcommand.setName('add')
        .setDescription('Set a custom timeout')
        
        .addUserOption(option =>
            option.setName('user')
            .setDescription('The person you want to time out')
            .setRequired(true))
            .addStringOption(option =>
                option.setName('reason')
                .setDescription('Reason for the timeout'))
                
        .addIntegerOption(option =>
            option.setName('days')
            .setDescription('Amount of days to time out')
            .setMaxValue(28))
        .addIntegerOption(option =>
            option.setName('hours')
            .setDescription('Amount of hours to time out')
            .setMaxValue(672))
        .addIntegerOption(option =>
            option.setName('minutes')
            .setDescription('Amount of minutes to time out')
            .setMaxValue(40320))
    )
    .addSubcommand(subcommand =>
        subcommand.setName('list')
        .setDescription('List all active timeouts')
    )
                            
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const { EmbedBuilder } = require('discord.js');
        const subcommand = interaction.options.getSubcommand();
        const config = require('../config.json');
        const date = new Date();
        
        const logChannel = interaction.guild.channels.cache.get(config.deletedLogChannelID); //Fetch the logChannel from config

        if(subcommand == "add") {
            const user = interaction.options.getUser('user');
            const member = interaction.guild.members.cache.get(user.id)
            const reason = interaction.options.getString('reason') ?? 'No reason provided';

            const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTimestamp()
            .setFooter({ text:interaction.user.tag, iconURL:interaction.user.displayAvatarURL() })


            const time = ( interaction.options.getInteger('days')*24*60 + interaction.options.getInteger('hours')*60 + interaction.options.getInteger('minutes') )*60*1000
            const timeDate = new Date(time);
            const readableTime =  `${Math.floor(time / 86400000)} days ${timeDate.getUTCHours() % 24} hours ${timeDate.getMinutes()} minutes`

            if(time == 0) {
                embed.setDescription(`**⚠️ There was an issue timing out ${user}!**`);
                embed.addFields(
                    {name: 'Error', value:'Timeout duration too small! Duration has to be anywhere inbetween 0-28 days.'},
                    {name: 'Duration', value:readableTime}
                )
                return interaction.reply({embeds:[embed], ephemeral: true})
            } else if(time > 28*24*60*60*1000) {
                embed.setDescription(`**⚠️ There was an issue timing out ${user}!**`);
                embed.addFields(
                    {name: 'Error', value:'Timeout duration too large! Duration has to be anywhere inbetween 0-28 days.'},
                    {name: 'Duration', value:readableTime}
                );
                return interaction.reply({embeds:[embed], ephemeral: true})
            }

            const startDate = Math.floor(Date.now() / 1000);
            const endDate = Math.floor(Date.now() / 1000 + time/1000);
            let error = false;

            member.timeout(time).then(() => {
                embed.setDescription(`**⏲️ Succesfully timed out ${user}!**`);
                embed.addFields(
                    {name: 'Duration', value:readableTime},
                    {name: 'Reason', value:reason},
                    {name: 'Date', value:`<t:${startDate}:F>\n↓ (<t:${endDate}:R>) ↓\n<t:${endDate}:F>`}    
                )
                interaction.reply({embeds:[embed], ephemeral: true});
            })
            .catch((err) => {
                error = true;
                embed.setDescription(`**⚠️ There was an issue timing out ${user} (${user.tag})!**`);
                if(err.rawError.message == "Missing Permissions") {
                    embed.addFields({name: 'RawError:', value: "`" + err.rawError.message + "`"});
                } else {
                    embed.addFields({name: 'RawError:', value: '``Undefined error, see console for further information.``'});
                }
                return interaction.reply({embeds:[embed], ephemeral: true});
            });

            setTimeout(() => {
                if(!error) logChannel.send({embeds:[embed]})
            },1000)
        } else if(subcommand == "list") {

            // Fetch all members in a guild
            interaction.guild.members.fetch().then(async members => {
                // Filter only timed out members
                let timedOutMembers = members.filter(member => member.communicationDisabledUntil>date);
                const entries = Array.from(timedOutMembers.values());
                
                const PAGE_SIZE = 10; // number of fields to display per page
                const embeds = []; //EMbed pages to scroll through
                
                for (let i = 0; i < entries.length; i += PAGE_SIZE) {
                  const embed = new EmbedBuilder()
                    .setTitle('Timed Out Members')
                    .setColor(config.embedColor);
                
                  let description = `***Page no. ${embeds.length+1}***\n\n`  

                  entries.slice(i, i + PAGE_SIZE).forEach(element => {
                    //console.log([element.user.username,element.communicationDisabledUntil])
                    description += `→ **User**: ${element}\n**Until:** <t:${Math.floor(element.communicationDisabledUntil/1000)}>\n\n`
                    //embed.addFields({name: element, value: String(element.communicationDisabledUntil)});
                });
                  embed.setDescription(description);
                  embeds.push(embed); //Add page to embeds array
                }
               
                //Add buttons
                const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                    .setCustomId('left')
                    .setLabel('◀️')
                    .setStyle(ButtonStyle.Primary)
    
                )
                .addComponents(
                    new ButtonBuilder()
                    .setCustomId('right')
                    .setLabel('▶️')
                    .setStyle(ButtonStyle.Primary)
                )

                MSG = await interaction.reply({embeds:[embeds[0]], components: [row], ephemeral: true});

                let currentPage = 0;
                const collector = await MSG.createMessageComponentCollector({ idle: 20000 });
                //Watch for button presses
                collector.on('collect', async interaction => {
                    if (interaction.customId === 'left') {
                        currentPage = Math.max(0, currentPage - 1);
                    } else if (interaction.customId === 'right') {
                        currentPage = Math.min(embeds.length - 1, currentPage + 1);
                    }
                    await interaction.update({ embeds: [embeds[currentPage]], components: [row], ephemeral:true });
                })
            })

        }
    }
}
