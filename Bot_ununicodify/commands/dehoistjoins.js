const { SlashCommandBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');


module.exports = {
    data: new SlashCommandBuilder()
    .setName('dehoistjoins')
    .setDescription('Dehoists usernames immediately upon joining.')
    .addBooleanOption(option =>
		option.setName('enable')
        .setDescription('Whether or not new players should automatically be dehoisted')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const { EmbedBuilder } = require('discord.js');
        config = require('../config.json');
        
        // Update config to match enabled state
        fs.readFile('./config.json', 'utf8', (err, rawRead) => {
            let data = JSON.parse(rawRead);
            data.dehoistjoins = interaction.options.getBoolean('enable');
            fs.writeFile('./config.json', JSON.stringify(data, null, 4), (err) => {if(err) console.log(err)});
        });

        //Build RichEmbed reply
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setDescription("⚠️ **Note**: This command applies to all users ranked **below** the Bot's role.")

        if(interaction.options.getBoolean('enable')) {
            embed.setTitle("Now monitoring and dehoisting all new player joins!")
        } else {
            embed.setTitle("No longer monitoring and dehoisting new player joins")
        }
        await interaction.reply({ embeds: [embed]});
    }
}
