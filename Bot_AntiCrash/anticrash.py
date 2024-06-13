import discord
import re
import aiohttp
from discord.ext import commands
import asyncio
import logging

logging.basicConfig(level=logging.INFO)

intents = discord.Intents().all()
bot = commands.Bot(command_prefix="!", intents=intents)

bot.remove_command('help')

TOKEN = ''  # Token here

suspicious_pattern = re.compile(r"(?:[\u200E\u200F\u202A\u202B\u202C\u202D\u202E\u2066\u2067\u2068\u2069]){10,}")

# Semaphore to limit concurrent downloads and memory tracking
max_memory = 150 * 1024 * 1024  # 150 MB
current_memory_used = 0
memory_semaphore = asyncio.Semaphore(value=1)

@bot.event
async def on_ready():
    print(f'Logged in as {bot.user} (ID: {bot.user.id})')
    print('------')

async def check_message_for_suspicious_attachment(message):
    global current_memory_used
    if message.attachments:
        for attachment in message.attachments:
            if attachment.size <= 20 * 1024 * 1024:  # File size limit of 20 MB
                await memory_semaphore.acquire()
                try:
                    if current_memory_used + attachment.size > max_memory:
                        logging.warning("Memory limit exceeded, waiting before retrying...")
                        return False  # Opting to return False immediately for this example
                    current_memory_used += attachment.size
                finally:
                    memory_semaphore.release()

                async with aiohttp.ClientSession() as session:
                    async with session.get(attachment.url) as response:
                        if response.status == 200:
                            file_content = await response.read()

                            # Release memory after download
                            await memory_semaphore.acquire()
                            current_memory_used -= attachment.size
                            memory_semaphore.release()

                            # Try decode
                            for encoding in ['utf-8', 'utf-16']:
                                try:
                                    text_content = file_content.decode(encoding)
                                    if suspicious_pattern.search(text_content):
                                        logging.info(f"Detected suspicious file: {attachment.filename}")
                                        return True
                                    break
                                except UnicodeDecodeError:
                                    continue
                            else:
                                logging.info(f"File {attachment.filename} could not be decoded with known encodings, ignored.")
                return False
    return False

@bot.event
async def on_message(message):
    # Check for suspicious files
    if await check_message_for_suspicious_attachment(message):
        await message.delete()
        logging.info(f"A message with a potentially harmful attachment was removed.")

bot.run(TOKEN)
