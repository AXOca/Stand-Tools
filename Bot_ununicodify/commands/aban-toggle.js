const { SlashCommandBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');


module.exports = {
    data: new SlashCommandBuilder()
    .setName('aban-toggle')
    .setDescription('Updates ban reason immediately after someone is banned, to keep easier track of audit logs.')
    .addBooleanOption(option =>
		option.setName('enable')
        .setDescription('Whether or not bans should be redefined.')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const { EmbedBuilder } = require('discord.js');
        config = require('../config.json');
        
        // Update config to match enabled state
        fs.readFile('./config.json', 'utf8', (err, rawRead) => {
            let data = JSON.parse(rawRead);
            data.autoReban = interaction.options.getBoolean('enable');
            fs.writeFile('./config.json', JSON.stringify(data, null, 4), (err) => {if(err) console.log(err)});
        });

        //Build RichEmbed reply
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setDescription("⚠️ **Note**: This command applies to all users ranked **below** the Bot's role. Ignored roles can be changed in the config.")

        if(interaction.options.getBoolean('enable')) {
            embed.setTitle("Now monitoring and rebanning all bans!")
        } else {
            embed.setTitle("No longer monitoring and rebanning all bans!")
        }
        await interaction.reply({ embeds: [embed]});
    }
}
