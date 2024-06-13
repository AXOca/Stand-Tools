const { SlashCommandBuilder, TextInputStyle, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('comstats')
    .setDescription('Command Usage Statistics')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const { EmbedBuilder } = require('discord.js');
        const config = require('../config.json');

        fs.readFile('./CustomCommands.json', 'utf8', (err, rawRead) => {
            handleInteraction(JSON.parse(rawRead));
        })

        async function handleInteraction(entries) {

            const PAGE_SIZE = 5; // number of fields to display per page
            const embeds = []; //Embed pages to scroll through
            let currentPage = 0; //Current page variable initialized here

            for (let i = 0; i < entries.length; i += PAGE_SIZE) {
                const embed = new EmbedBuilder()
                    .setTitle('Command Statistics')
                    .setColor(config.embedColor);

                let description = `***Page no. ${embeds.length+1}***\n\n`  

                entries.slice(i, i + PAGE_SIZE).forEach(element => {
                    description += `→ **Command**: ${element.command}\n**Monthly Usage:** ${element.monthlyUsage}\n**Total Usage:** ${element.totalUsage}\n\n`
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
                        .setDisabled(currentPage === 0) // Disable left button when at the beginning
                )
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('right')
                        .setLabel('▶️')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === embeds.length - 1) // Disable right button when at the end
                )

            MSG = await interaction.reply({embeds:[embeds[0]], components: [row]});
            
            const collector = await MSG.createMessageComponentCollector({ idle: 20000 });
            //Watch for button presses
            collector.on('collect', async interaction => {
                if (interaction.customId === 'left') {
                    currentPage = Math.max(0, currentPage - 1);
                } else if (interaction.customId === 'right') {
                    currentPage = Math.min(embeds.length - 1, currentPage + 1);
                }
                
                row.components[0].setDisabled(currentPage === 0); // Disable left button when at the beginning
                row.components[1].setDisabled(currentPage === embeds.length - 1); // Disable right button when at the end
                
                await interaction.update({ embeds: [embeds[currentPage]], components: [row] });
            })
        }

    }
}