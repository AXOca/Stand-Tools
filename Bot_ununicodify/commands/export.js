const { SlashCommandBuilder, TextInputStyle, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('export')
    .setDescription('Export the warns database')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        let file;
        let config = require('../config.json');
        
        // Read database
        fs.readFile('./warns.json', 'utf8', async (err, rawRead) => {
            let data = JSON.parse(rawRead);
            
            const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setDescription(`**Succesfully exported ${data.length} warns**`)
            .addFields({name: 'Size', value:(Math.round(rawRead.length/1024*1000)/1000).toString()+ "KB"})
            .setTimestamp()

            await interaction.deferReply({ ephemeral: true });
            await interaction.editReply({ embeds: [embed], files: ['./warns.json']})
            sendLogs()
        })
        
        function sendLogs() {
            const logChannel = interaction.guild.channels.cache.get(config.deletedLogChannelID); //Fetch the logChannel from config
            const currentDate = Math.floor(Date.now() / 1000);
            
            const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setDescription(`**${interaction.user} requested warn db export**`)
            .setTimestamp()
            .addFields(
                {name:"Date",value:`<t:${currentDate}>`}
            )

            logChannel.send({ embeds:[embed] });

        }
    }
}