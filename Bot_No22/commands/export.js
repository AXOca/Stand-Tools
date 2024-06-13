const { SlashCommandBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');
const { fetchFAQ } = require("../functions/fetchFAQ");
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fs = require("fs")

const { parseExport } = require("../functions/parseTr")

module.exports = {
    data: new SlashCommandBuilder()
    .setName('export')
    .setDescription('Export a template file including all questions, answers and bot UI translation element tags.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
        option.setName('language')
            .setDescription('The language you want to export.')
            .setRequired(true)
            .setMaxLength(2)),
    async execute(interaction) {
        const lang = interaction.options.getString('language').toUpperCase();
        const config = require('../config.json');
        const faq = await fetchFAQ()

        //Check if the language is valid
        const localeList = faq.map(locale => {return locale.locale}) //?
        const localeExists = localeList.indexOf(lang) > -1;
        if(!localeExists) {
            const invalidLangEmbed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle("Oops! That language does not exist.")
            .setDescription(`Please select a valid language, "${lang}" does not exist.\n\nIf you want to add a new language, export a language you'd like to use as a template, and change the first line of the export file! *(Note: The language identifier cannot be longer than two characters.)*`)
            .setFooter({ text:interaction.user.tag, iconURL:interaction.user.displayAvatarURL() })
            .setTimestamp()
            return interaction.reply({ embeds: [invalidLangEmbed], ephemeral: true})
        }

        //Initialise the export file
        const exportfile = await parseExport(lang)
        const buffer = Buffer.from(exportfile, 'utf-8');
        const attachment = new AttachmentBuilder(buffer, { name: 'exportfile.txt' });

        const exportEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle("🈳 Here's your language template!")
        .setDescription(`Use this template to update translations, or change the language tag to add a new language. **Do NOT change** any of the tag identifiers.\n💡 When finished, you can upload the file using </import:1158843355237716038>\n\n**To add new questions, use the *"Add Question"* button instead.** This adds the question to the base file in English, allowing translations in other languages to be updated.`)
        .setFooter({ text:interaction.user.tag, iconURL:interaction.user.displayAvatarURL() })
        .setTimestamp()
        interaction.reply({ embeds: [exportEmbed], files:[attachment], ephemeral: true});
    }
}
