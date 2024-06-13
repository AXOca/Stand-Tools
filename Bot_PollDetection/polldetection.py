import discord
import aiohttp
import logging

logging.basicConfig(filename='bot_log.log', level=logging.INFO, format='%(asctime)s:%(levelname)s:%(message)s')

intents = discord.Intents.default()
intents.messages = True
intents.guilds = True
client = discord.Client(intents=intents)

async def fetch_message(channel_id, message_id, token):
    url = f"https://discord.com/api/v10/channels/{channel_id}/messages/{message_id}"
    headers = {'Authorization': f'Bot {token}'}
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as response:
            if response.status == 200:
                return await response.json()
            else:
                return None

@client.event
async def on_ready():
    logging.info(f'Logged in as {client.user.name} (ID: {client.user.id})')

@client.event
async def on_guild_join(guild):
    logging.info(f"Joined new guild: {guild.name} (ID: {guild.id})")
    print(f"Joined new guild: {guild.name} (ID: {guild.id})")

@client.event
async def on_message(message):
    if message.author == client.user:
        return

    if message.content == '':
        raw_data = await fetch_message(message.channel.id, message.id, 'your_token_here')
        if raw_data and 'poll' in raw_data:
            try:
                await message.delete()
                response_message = await message.channel.send("Nuh uh. https://tenor.com/view/nuh-uh-beocord-no-lol-gif-24435520")
                await response_message.delete(delay=0.5)
                logging.info(f"Poll detected and deleted from {message.author} in {message.channel}")
            except discord.Forbidden:
                await message.add_reaction('🇳')
                await message.add_reaction('🇴')
                await message.add_reaction('🇵')
                await message.add_reaction('🇪')
                await message.add_reaction('🇷')
                await message.add_reaction('🇲')
                await message.add_reaction('🇸')
                logging.error(f"Failed to delete poll message from {message.author} in {message.channel} due to missing permissions.")
        else:
            pass
    else:
        pass

client.run('Your_token_here')
