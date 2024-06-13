const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType, EmbedBuilder } = require('discord.js');
const config = require("../config.json")
const fs = require("fs");

const { updateFAQ } = require("../commands/faq")
const { fetchFAQ } = require('../functions/fetchFAQ');


async function addFAQModal(interaction) {
	const title = interaction.fields.getTextInputValue('title');
	const answer = interaction.fields.getTextInputValue('answer');
	const tags = interaction.fields.getTextInputValue('tags');

	const embed = new EmbedBuilder()
	.setColor(config.embedColor)
	.setFooter({ text:interaction.user.username, iconURL:interaction.user.displayAvatarURL() })
	.setTimestamp()

	//Check if a question with this title already exists
	FAQ = await fetchFAQ()
	//Fetch index of the EN locale
	const ENIndex = FAQ.findIndex(locale => {return locale.locale === "EN"})
	let duplicate = false;
	FAQ[ENIndex].questions.forEach(question => {
		if(title == question.title) duplicate = question
	})
	if(duplicate) {
		embed.setTitle("Duplicate question!")
			.setDescription(`Question title alreay exist!\n\n**Question title:** ${title}\n\n**Your answer:** ${answer}\n**Existing answer:** ${duplicate.answer}`)
		return interaction.reply({embeds:[embed]})
	}

	//Split tags intro array, and force lowercase
	const formattedTags = tags.split(/\s*,\s*|\s+$/).filter(tag => tag !== "").map(tag => tag.toLowerCase());

	//Create an array of all question index properties
	const indexlist = FAQ[ENIndex].questions.map(question => question = question.index)
	//Determine the new index, by fetching the largest index + 1
	const index = Math.max(...indexlist)+1

	//Form question object
	let newQuestion = {
		"title":title,
		"answer":answer,
		"tags":formattedTags,
		"index":index
	}

	//Add question to DB
	fs.readFile("./faq.json", "utf8", (err, raw) => {
		if (err) return console.log(err)
		let data = JSON.parse(raw);
		//Find index of EN locale (Should be 0)
		const index = data.findIndex((item) => {return item.locale === "EN"})
		data[index].questions.push(newQuestion)
		fs.writeFile('./faq.json', JSON.stringify(data, null, 4), (err) => {if(err) console.log(err)});
	})

	embed.setTitle("Added question!")
		.setDescription(`Question: \`${title}\`\nAnswer: \`${answer}\``)
	
	interaction.reply({embeds:[embed]})

}

module.exports = {addFAQModal}