const fs = require('node:fs');
const config = require('../config.json')
const { EmbedBuilder} = require('discord.js')
let TR = require('../ui-locales.json');

fs.watch("./ui-locales.json", (eventType, filename) => {
	fs.readFile('./ui-locales.json', 'utf8', (err, rawRead) => {
		try{
			let data = JSON.parse(rawRead);
			TR = data;
		} catch(err) {
			console.log("Invalid ui-locales.json formatting, or file is still pending.")
		}
		console.log(`Received ui-locales.json update!`);
	})
});

function fetchUI(language) { //Fetch ui-locales.json (of a certain lang)
	if(language) {
		return TR.find(lang => lang.locale == language)
	} else {
		return TR;
	}
}

function fetchUserLocales() { //Fetch user_locale.json
	return new Promise((resolve, reject) => {
	  fs.readFile("./user_locale.json", "utf8", (err, raw) => {
		if (err) reject(err) // Reject the promise if there is an error
		let data = JSON.parse(raw);
		resolve(data); // Resolve the promise with the data
	  })
	})
  }
async function fetchUserLocale(id) { //Fetch the locale of a user
	const locales = await fetchUserLocales();
	const user_locale = locales.find(user => user.id === id) || "EN";
	return user_locale.locale
}
async function UI(id,elem) { //fetch a UI element of a corresponding user
	const user_locale = await fetchUserLocale(id)
	let ui_locale = TR.find(lang => lang.locale == user_locale)
	if(ui_locale == undefined) {
		ui_locale = TR[0]
		// let translationMissingEmbed = new EmbedBuilder()
		// .setFooter({text:"Frequently Asked Questions"})
		// .setColor(config.embedColor)
		// .setTitle(`An error occured whilst fetching translations`)
		// .setDescription(`**User:** \`${id}\`\n**Locale:** \`${user_locale}\`\n\nPlease double check \`ui-locales.json\`, or re-import the ${user_locale} translations.`)
		// .setTimestamp()
		// const logChannel = client.channels.cache.get(config.logchannelID); //Fetch the logChannel from config
		// logChannel.send({embeds:[translationMissingEmbed]})
		console.error(`An error occured whilst fetching translations. Defaulting to English. User: ${id}, Locale: ${user_locale}`)
	}
	if(elem) {
		return ui_locale.translations[elem]
	} else {
		return ui_locale.translations
	}
}
module.exports = {fetchUserLocales,fetchUserLocale,UI,TR,fetchUI}