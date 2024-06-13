const { SlashCommandBuilder, TextInputStyle, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType, EmbedBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder } = require('discord.js');
const config = require("../config.json")
const fs = require('fs')
const { fetchUserLocales, fetchUserLocale, UI} = require('../functions/fetchUserLocales');
const { searchQuestions } = require('../functions/searchQuestions');

let FAQ = require('../faq.json');


fs.watch("./faq.json", (eventType, filename) => {
	fs.readFile('./faq.json', 'utf8', (err, rawRead) => {
		try{
			let data = JSON.parse(rawRead);
			FAQ = data;
		} catch(err) {
			console.log("Invalid faq.json formatting, or file is still pending.")
		}
		console.log(`Received FAQ update!`);
	})
});

module.exports = {
	data: new SlashCommandBuilder()
		.setName('faq')
		.setDescription('Search frequently asked questions!')
		.addStringOption(option =>
			option.setName('query')
				.setDescription('Question to search for')
				.setAutocomplete(true)),
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused(); //Current argument string
		const locales = await fetchUserLocales();
		const user_locale = locales.find(user => user.id === interaction.user.id);
		const filtered = searchQuestions(focusedValue,user_locale,FAQ);

		await interaction.respond(
			filtered.map(question => ({ name: question.title, value: question.title })),
		);
	},
	async execute(interaction) {
		const arg = interaction.options.getString('query');
		const TR = await UI(interaction.user.id);
		if(arg) { //User entered query using /faq <query>
			//Immediately fetch best match when query is present
			const locales = await fetchUserLocales()	
			const user_locale = locales.find(user => user.id === interaction.user.id);
			const filtered = searchQuestions(arg,user_locale,FAQ);
			
			//Add the string selection options
			const select = new StringSelectMenuBuilder()
				.setCustomId('alternateQuestions')
				.setPlaceholder(`${TR.relevantquestions_selector} ${arg}`)
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
			let embed = new EmbedBuilder()
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
				ephemeral: true
			});

			//Collect interaction responses
			const collector = await response.createMessageComponentCollector({ time: 3_600_000 });
			collector.on('collect', async i => {
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
		} else { //Send FAQ welcome message

			let isAdmin = config.adminRoles.length && config.adminRoles.some(adminRole => interaction.member.roles.cache.has(adminRole));

			const langButton = new ButtonBuilder()
				.setCustomId('lang')
				.setLabel(`🌐 ${TR.introembed_lang_button}`)
				.setStyle(ButtonStyle.Secondary);
			const searchButton = new ButtonBuilder()
				.setCustomId('search')
				.setLabel(`🔎 ${TR.introembed_search_button}`)
				.setStyle(ButtonStyle.Primary);
			
			const addFAQButton = new ButtonBuilder()
				.setCustomId('addFAQ')
				.setLabel(`➕ ${TR.introembed_addfaq_button}`)
				.setStyle(ButtonStyle.Success);
			const delFAQButton = new ButtonBuilder()
				.setCustomId('delFAQ')
				.setLabel(`➖ ${TR.introembed_remfaq_button}`)
				.setStyle(ButtonStyle.Danger);


			const introRow = new ActionRowBuilder()
				.addComponents(langButton,searchButton)
			const adminRow = new ActionRowBuilder()
				.addComponents(addFAQButton,delFAQButton)

			const introEmbed = new EmbedBuilder()
				.setColor(config.embedColor)
				.setFooter({ text:interaction.user.username, iconURL:interaction.user.displayAvatarURL() })
				.setTimestamp()
				.setTitle(TR.introembed_title)
				.setDescription(TR.introembed_description)
			
				//Send the response
			const response = await interaction.reply({
				embeds:[introEmbed],
				components:isAdmin ? [introRow,adminRow]:[introRow],
				ephemeral:true
			});

			//Collect interaction responses
			const collector = response.createMessageComponentCollector({componentType:ComponentType.Button, time: 3_600_000})
			collector.on('collect', async buttonInteraction => {
				if(buttonInteraction.customId == "search") {
					// Create the modal
					const modal = new ModalBuilder()
						.setCustomId('queryModal')
						.setTitle(TR.faq)

					// Create the text input components
					const query = new TextInputBuilder()
						.setCustomId('query')
						.setLabel(TR.searchfaqform_querylabel)
						.setPlaceholder(TR.searchfaqform_templatequery)
						.setStyle(TextInputStyle.Short);

					const firstActionRow = new ActionRowBuilder().addComponents(query);

					// Add inputs to the modal
					modal.addComponents(firstActionRow);

					// Show the modal to the user
					await buttonInteraction.showModal(modal)

				} else if(buttonInteraction.customId == "lang") { //Send language 
					//Disable the lang button on the FAQ introduction, to make sure only one collector is active at a time
					langButton.setDisabled(true)
					await interaction.editReply({embeds:[introEmbed],components:isAdmin ? [introRow,adminRow]:[introRow]});
					const locales = await fetchUserLocales()	
					const user_locale = locales.find(user => user.id === buttonInteraction.user.id) || "EN";
					const langSelect = new StringSelectMenuBuilder()
						.setCustomId('langSelect')
						.setPlaceholder(`🌐 ${TR.langselector}`)
					FAQ.forEach(locale => {
						if(locale.locale == user_locale.locale) {
							langSelect.addOptions(
								new StringSelectMenuOptionBuilder()
									.setLabel(`${locale.locale} (${TR.langcurrent})`)
									.setValue(locale.locale)
							)
						} else {
							langSelect.addOptions(
								new StringSelectMenuOptionBuilder()
								.setLabel(locale.locale)
								.setValue(locale.locale)
							)
						}
					})
					const row = new ActionRowBuilder().addComponents(langSelect);
					const selectorreply = await buttonInteraction.reply({components:[row],fetchReply:true})

					//Collect language input
					const langCollector = await selectorreply.awaitMessageComponent(i => i.user.id === interaction.user.id)
					if (langCollector.customId == 'langSelect') {
						const lang = langCollector.values[0]
						let found = false
						locales.forEach(user => {
							if(user.id == langCollector.user.id) {
								user.locale = lang;
								found = true
							}
						})
						if(!found) {
							locales.push({"id":langCollector.user.id,"locale":lang})
						}

						await fs.writeFileSync('./user_locale.json', JSON.stringify(locales, null, 4), (err) => {if(err) console.log(err)});
						
						const TR = await UI(interaction.user.id);

						//Build the embed
						const updatedEmbed = new EmbedBuilder()
						.setColor(config.embedColor)
						.setFooter({ text:interaction.user.username, iconURL:interaction.user.displayAvatarURL() })
						.setTimestamp()
						.setTitle(`${TR.langupdateembed_title} **${lang}**`)
						await langCollector.update({embeds: [updatedEmbed], components: []})
						
						//Re-enable the lang button on the FAQ introduction
						langButton.setDisabled(false)
						await interaction.editReply({embeds:[introEmbed],components:isAdmin ? [introRow,adminRow]:[introRow]});
					}
				} else if(buttonInteraction.customId == "addFAQ") {
					// Create the modal
					const addFAQModal = new ModalBuilder()
						.setCustomId('addFAQModal')
						.setTitle(TR.addfaqform_title)

					// Create the text input components
					const title = new TextInputBuilder()
						.setCustomId('title')
						.setLabel(TR.addfaqform_qtitle_label)
						.setPlaceholder(TR.addfaqform_qtitle_placeholder)
						.setStyle(TextInputStyle.Short)
						.setMaxLength(265)
					// Create the text input components
					const answer = new TextInputBuilder()
						.setCustomId('answer')
						.setLabel(TR.addfaqform_qanswer_label)
						.setPlaceholder(TR.addfaqform_qanswer_placeholder)
						.setStyle(TextInputStyle.Paragraph)
						.setMaxLength(1024)
					// Create the text input components
					const tags = new TextInputBuilder()
						.setCustomId('tags')
						.setLabel(TR.addfaqform_tags_label)
						.setPlaceholder(TR.addfaqform_tags_placeholder)
						.setStyle(TextInputStyle.Short)
						.setRequired(false)

					const ActionRow1 = new ActionRowBuilder().addComponents(title);
					const ActionRow2 = new ActionRowBuilder().addComponents(answer);
					const ActionRow3 = new ActionRowBuilder().addComponents(tags);


					// Add inputs to the modal
					addFAQModal.addComponents(ActionRow1,ActionRow2,ActionRow3);

					// Show the modal to the user
					await buttonInteraction.showModal(addFAQModal)
				} else if(buttonInteraction.customId == "delFAQ") {
					const delFAQSelector = new StringSelectMenuBuilder()
						.setCustomId('delFAQSelector')
						.setPlaceholder(TR.delfaq_selector)


						//Find index of EN locale (Should be 0)
						const index = FAQ.findIndex((lang) => {return lang.locale === "EN"})
						FAQ[index].questions.forEach(question => {
							delFAQSelector.addOptions(
								new StringSelectMenuOptionBuilder()
								.setLabel(question.title)
								.setValue(question.title)
							)
						})

					const row = new ActionRowBuilder().addComponents(delFAQSelector);
					const delFAQReply = await buttonInteraction.reply({content:TR.delfaq, components:[row], fetchReply: true, ephemeral: true})

					//Collect interaction responses
					const collector = await delFAQReply.createMessageComponentCollector({componentType:ComponentType.StringSelect, time: 3_600_000})
					collector.on('collect', async i2 => {
						if(i2.customId != "delFAQSelector") return
						const qtitle = i2.values[0]
						const confirmationEmbed = new EmbedBuilder()
							.setTitle(TR.delfaq_confirmation_title)
							.setDescription(`${TR.delfaq_confirmation_description}: \`${qtitle}\``)
							.setColor(config.embedColor)
							.setFooter({ text:interaction.user.username, iconURL:interaction.user.displayAvatarURL() })
							.setTimestamp()
						const confirm = new ButtonBuilder()
							.setCustomId('confirm')
							.setLabel(TR.delfaq_confirmation_confirmbutton)
							.setStyle(ButtonStyle.Danger)
						const cancel = new ButtonBuilder()
							.setCustomId('cancel')
							.setLabel(TR.delfaq_confirmation_cancelbutton)
							.setStyle(ButtonStyle.Secondary)
						const row = new ActionRowBuilder()
							.addComponents(cancel,confirm);

						const confirmReply = await i2.update({embeds:[confirmationEmbed],components:[row],ephemeral:true,fetchReply:true})
						collector.stop()

						const confirmCollector = await confirmReply.createMessageComponentCollector({componentType:ComponentType.Button, time: 3_600_000})
						confirmCollector.on('collect', async i2 => {
							if(i2.customId == "cancel") {
								confirmationEmbed.setTitle(TR.delfaq_cancel_title)
									.setDescription(`${delfaq_cancel_description} \`${qtitle}\``)

								i2.update({embeds:[confirmationEmbed],components:[]})
								confirmCollector.stop()
							} else if(i2.customId == "confirm") {
								//Delete question(s) from the database
								fs.readFile("./faq.json", "utf8", (err, raw) => {
									let data = JSON.parse(raw);
									if(err) return console.error("Error reading DB whilst deleting question.")
									//Find index of EN locale (should be 0)
									const ENindex = data.findIndex((lang) => {return lang.locale === "EN"})
									//Fetch the index property of the selected question (based on title)
									const Qindex = data[ENindex].questions.find((question) => {return question.title === qtitle}).index
									
									data.forEach(lang => {
										//Find array index of the question
										const arrindex = lang.questions.findIndex(question => {return question.index === Qindex})
										if(arrindex<0) return
										lang.questions.splice(arrindex,1)
									})
								 	fs.writeFile('./faq.json', JSON.stringify(data, null, 4), (err) => {if(err) console.log(err)});
								})
								confirmationEmbed.setTitle(TR.delfaq_completed_title)
									.setDescription(`${TR.delfaq_completed_description} \`${qtitle}\``)
								i2.update({embeds:[confirmationEmbed],components:[]})
								confirmCollector.stop()

							}
						})
					})
				}
			})
		}
	},
}