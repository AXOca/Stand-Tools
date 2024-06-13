const { SlashCommandBuilder, TextInputStyle, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { fetchFAQ } = require("../functions/fetchFAQ");
const { fetchUI } = require("../functions/fetchUserLocales")
const fs = require("fs")
const config = require("../config.json")

const { parseImportFAQ, parseImportUI } = require("../functions/parseTr")

module.exports = {
    data: new SlashCommandBuilder()
    .setName('import')
    .setDescription('Import a translation file to update the translations')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addAttachmentOption((option)=> option
    .setRequired(true)
    .setName("file")
    .setDescription("Import your updated 'exportfile.txt' here")),
    async execute(interaction) {
        const attachmenturl = interaction.options.get('file').attachment.url;
        const response = await fetch(attachmenturl);
        const data = await response.text()

        let faqresponse = await parseImportFAQ(data);
        let uiresponse = await parseImportUI(data);

        updateFAQ()
        updateUI()
        console.log("Updated FAQ & UI")
        async function updateFAQ() {
            let faq = await fetchFAQ()
            let localeFound = false
            faq.forEach(lang => { //If it is an existing language, update the corresponding FAQ questions.
                if (lang.locale === faqresponse.locale) {
                    localeFound = true
                  lang.questions = faqresponse.questions;
                }
            });
            if(!localeFound) { //If it is a new language, push it to the FAQ array.
                faq.push(faqresponse);
            }
            fs.writeFileSync('./faq.json', JSON.stringify(faq, null, 4), (err) => {if(err) console.log(err)});
            console.log("Updated FAQ")
        }
        
        async function updateUI() {
            let ui = await fetchUI()
            let localeFound = false
            ui.forEach(lang => { //If it is an existing language, update the corresponding UI translations
                if(lang.locale === uiresponse.locale) {
                    localeFound = true
                    lang.translations = uiresponse.translations
                }
            })
            if(!localeFound) { //If it is a new language, push it to the UI array.
                ui.push(uiresponse)
            }
            fs.writeFileSync('./ui-locales.json', JSON.stringify(ui, null, 4), (err) => {if(err) console.log(err)});
            console.log("Updated UI")
        }

        //interaction.channel.send('```js\n' + JSON.stringify(faqresponse,0,1) + "\n```")
        //interaction.channel.send('```js\n' + JSON.stringify(uiresponse,0,1) + "\n```")

        const importEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle("📨 Updated translations")
        .setDescription(`UI & FAQ translations have been updated for the language: \`${uiresponse.locale}\``)
        .setFooter({ text:interaction.user.tag, iconURL:interaction.user.displayAvatarURL() })
        .setTimestamp()
        interaction.reply({ embeds: [importEmbed], ephemeral: true});
    }
}


