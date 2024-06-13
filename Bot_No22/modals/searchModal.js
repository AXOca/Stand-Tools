const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require("../config.json")


const { fetchUserLocales, UI} = require('../functions/fetchUserLocales');
const { searchQuestions } = require('../functions/searchQuestions');
const { fetchFAQ } = require('../functions/fetchFAQ');

async function searchModal(interaction) {
	const TR = await UI(interaction.user.id);
	
	let FAQ = await fetchFAQ()
	const query = interaction.fields.getTextInputValue('query')
	const locales = await fetchUserLocales()	
	const user_locale = locales.find(user => user.id === interaction.user.id);
	const filtered = searchQuestions(query,user_locale,FAQ);
	
	//Add the string selection options
	const select = new StringSelectMenuBuilder()
		.setCustomId('alternateQuestions')
		.setPlaceholder(`${TR.relevantquestions_selector} ${query}`)
	filtered.forEach(question => {
		select.addOptions(
			new StringSelectMenuOptionBuilder()
				.setLabel(question.title)
				.setValue(question.title)
		)
	})
	const row = new ActionRowBuilder()
		.addComponents(select);

	//Add the string selection options
	const publicize = new ButtonBuilder()
	.setCustomId('publicize')
	.setLabel(`📎 Publicize`)
	.setStyle(ButtonStyle.Primary);
	let isAdmin = config.adminRoles.length && config.adminRoles.some(adminRole => interaction.member.roles.cache.has(adminRole));
	const adminRow = new ActionRowBuilder()
	.addComponents(publicize)


	//Build the embed
	const answer = filtered[0]
	const embed = new EmbedBuilder()
	.setColor(config.embedColor)
	.setFooter({ text:interaction.user.username, iconURL:interaction.user.displayAvatarURL() })
	.setTimestamp()
	if(answer) {
		embed.setTitle(answer.title).setDescription(answer.answer)
	} else {
		embed.setTitle(TR.nomatchesembed_title).setDescription(TR.nomatchesembed_description)
	}

	//Send the response
	const response = await interaction.reply({
		components: answer ? (isAdmin ? [row,adminRow] : [row]) : [],
		embeds: [embed],
		content: answer ? `*${TR.bestmatch}*` : "",
		ephemeral: true,
		fetchReply:true
	});

	//Collect interaction responses
	const collector = await response.createMessageComponentCollector({time: 3_600_000})
	collector.on('collect', async i => {
		console.log("Received embed FAQ answer interaction")
		if(i.customId == "alternateQuestions") {
			const qtitle = i.values[0]
			const locales = await fetchUserLocales()	
			const user_locale = locales.find(user => user.id === i.user.id);
			const filtered = searchQuestions(qtitle,user_locale,FAQ);
			const answer = filtered[0]
			//Build the embed
			embed.setTitle(answer.title)
				.setDescription(answer.answer)
			await i.update({embeds: [embed]})
		} else if(i.customId == "publicize") {
			collector.stop()
			interaction.deleteReply()
			interaction.channel.send({
				components: [],
				embeds: [embed],
				content: "",
				ephemeral: false
			})
		}
	});
}

module.exports = {searchModal}