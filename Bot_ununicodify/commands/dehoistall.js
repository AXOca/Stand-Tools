const { SlashCommandBuilder, TextInputStyle, PermissionFlagsBits, client } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('dehoistall')
    .setDescription('Cycles all hoisted usernames through ununicodify and updates usernames accordingly.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const request = require('request');
        const { EmbedBuilder } = require('discord.js');
        config = require('../config.json');
        const dehoist = require('../function')
        
		var ETA = 1
		
        //Dehoist all GuildMembers
        interaction.guild.members.fetch().then(users => {
			index = 0
			ETA = Math.round(users.size * config.rateLimitMS / 1000 * 100) / 100
			sendEmbed()
            users.forEach((guildMember) => {
				index += 1
                setTimeout(() => {
					
                    //use the API directly to get the user object with the global_name property
                    let options = {
                        url: `https://discord.com/api/users/${guildMember.user.id}`, //the endpoint URL
                        method: 'GET', //the HTTP method
                        headers: {
                            'Authorization': `Bot ${process.env.UNUNICODIFY_TOKEN}` //the authorization header
                        }
                        };

                    request(options, function(err, res, body) {
                        if (err) {
                            console.error("ERROR FETCHING USER USING RAW API" + err); //handle errors
                        } else {
                            let user = JSON.parse(body);
                            dehoist(user, interaction.client);
                        }
		            });

				}, index * config.rateLimitMS);
            });
        })

		function sendEmbed() {
			//Build RichEmbed reply
			const embed = new EmbedBuilder()
				.setColor(config.embedColor)
				.setTitle("Dehoisting all usernames...")
				.setDescription(`⚠️ **Note**: This command applies to all users ranked **below** the Bot's role. Estimated execution time: ${ETA}s`)
			interaction.reply({ embeds: [embed]});
		}
    }
}



