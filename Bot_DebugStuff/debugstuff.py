import discord
import asyncio
from discord.ext import commands

intents = discord.Intents().all()

bot = commands.Bot(command_prefix="!", intents=intents)

bot.remove_command('help')

@bot.event
async def on_ready():
    print(f'Logged in as {bot.user}')

EMBED_COLOR = 0xFF00FF

class BanNotificationView(discord.ui.View):
    def __init__(self, bot, user_id, guild, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.bot = bot
        self.user_id = user_id
        self.guild = guild

    @discord.ui.button(label="This is fine", style=discord.ButtonStyle.green)
    async def confirm_button_callback(self, interaction: discord.Interaction, button: discord.ui.Button):
        # Acknowledge the interaction first
        await interaction.response.defer()
        # Delete the original message
        await interaction.delete_original_response()

    @discord.ui.button(label="False Positive", style=discord.ButtonStyle.red)
    async def false_positive_callback(self, interaction: discord.Interaction, button: discord.ui.Button):
        # Acknowledge the interaction first
        await interaction.response.defer()
        # Unban the user
        user = await self.bot.fetch_user(self.user_id)
        if user:
            await self.guild.unban(user)
        # Delete the original message
        await interaction.delete_original_response()

class IgnoreFailedInteraction(discord.ui.View):
    def __init__(self, max_queue_size, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.queue = []
        self.max_queue_size = max_queue_size
        self.join_button = discord.ui.Button(label="Join Queue", style=discord.ButtonStyle.green)
        self.add_item(self.join_button)

    @discord.ui.button(label="Join Queue", style=discord.ButtonStyle.green)
    async def join_queue_callback(self, interaction: discord.Interaction, button):
        user_id = interaction.user.id
        self.queue.append(user_id)

        if len(self.queue) >= self.max_queue_size:
            self.join_button.disabled = True

        queue_embed = discord.Embed(title="Queue Status", description=f"Current Queue Size: {len(self.queue)}/{self.max_queue_size}")
        await interaction.response.edit_message(embed=queue_embed, view=self)

recent_bans = set()

@bot.event
async def on_member_ban(guild, user):
    try:
        async for entry in guild.audit_logs(limit=1, action=discord.AuditLogAction.ban):
            if entry.target.id in recent_bans:
                continue

            if entry.user.id == 1199712375209738362:  # Monitor specific user/bot
                channel = bot.get_channel(1158848772063895622)
                if channel:
                    ban_time = entry.created_at.strftime("%Y-%m-%d %H:%M:%S UTC")
                    embed = discord.Embed(title=':hammer: Ban Alert!', color=discord.Color.red())
                    embed.add_field(name='User:', value=f"{entry.target.mention} ({entry.target.display_name})", inline=False)
                    embed.add_field(name='Banned By:', value=entry.user.mention, inline=False)
                    embed.add_field(name='Time:', value=f'{ban_time} (<t:{int(entry.created_at.timestamp())}:R>)', inline=False)
                    embed.add_field(name='Reason:', value=entry.reason or 'No reason provided.', inline=False)
                    view = BanNotificationView(bot, entry.target.id, guild)
                    await channel.send(embed=embed, view=view, allowed_mentions=discord.AllowedMentions.none())

                    recent_bans.add(entry.target.id)

                await asyncio.sleep(1)

        if len(recent_bans) > 10:
            recent_bans.clear()

    except Exception as e:
        print(f"An error occurred: {e}")

@bot.event
async def on_message(message):
    if message.author == bot.user or not message.guild:
        return

    await bot.process_commands(message)

@bot.command()
async def checkban(ctx, *, discord_id: str):
    if ctx.channel.id != 956618713396822036:
        await ctx.message.add_reaction("\U0001F971")  # Yawning Face emoji
        return

    try:
        user_id = int(discord_id)

        user_ban = None
        async for ban in ctx.guild.bans():
            if ban.user.id == user_id:
                user_ban = ban
                break

        if user_ban:
            await ctx.send(f"{user_ban.user} beamed for: {user_ban.reason or 'No reason provided.'}")
        else:
            await ctx.send("Nope, not beamed.")

    except ValueError:
        # If the discord_id is not a valid integer
        await ctx.message.add_reaction("\u2753")  # Question Mark emoji
    except Exception as e:
        # Handle any other exceptions
        print(f"An error occurred: {e}")
        await ctx.send("Kodama didn't handled this exception yet.")

@bot.command()
async def unban(ctx, *, discord_id: str):
    print(f"Unban command invoked in channel {ctx.channel.id} for ID {discord_id}")
    if ctx.channel.id != 956618713396822036:
        await ctx.message.add_reaction("\U0001F971")  # Unicode for Yawning Face emoji
        return

    try:
        # Convert the provided id to an integer
        user_id = int(discord_id)

        # Create a user object using the id
        user = await bot.fetch_user(user_id)

        # Unban the user
        await ctx.guild.unban(user)
        await ctx.message.add_reaction("\u2705")  # Unicode for White Check Mark emoji
        print(f"Successfully unbanned user ID {discord_id}")
    except discord.NotFound:
        # User not found or not banned
        await ctx.message.add_reaction("\u2753")  # Unicode for Question Mark emoji
        print(f"User ID {discord_id} not found or not banned")
    except ValueError:
        # If the discord_id is not a valid integer
        await ctx.message.add_reaction("\u2753")
        print(f"Invalid user ID format: {discord_id}")
    except Exception as e:
        # Handle any other exceptions
        print(f"An error occurred while unbanning user ID {discord_id}: {e}")
        await ctx.message.add_reaction("\u2753")

@bot.command()
async def exportbans(ctx):
    if ctx.channel.id != 956618713396822036:
        await ctx.message.add_reaction("\U0001F971")  # Yawning Face emoji
        return

    try:
        ban_data = []

        async for ban in ctx.guild.bans():
            ban_data.append(f"{ban.user.id} {ban.reason or 'No reason provided.'}")

        ban_data_str = "\n".join(ban_data)

        file_name = "bans_export.txt"
        with open(file_name, "w", encoding="utf-8") as file:
            file.write(ban_data_str)

        with open(file_name, "rb") as file:
            await ctx.send(file=discord.File(file, file_name))

    except Exception as e:
        print(f"An error occurred: {e}")
        await ctx.send("Kodama didn't handled this exception yet.")

@bot.command()
async def bansearch(ctx, *, search_term: str):
    # Check if the command is used in the specific channel
    if ctx.channel.id != 956618713396822036:
        await ctx.message.add_reaction("\U0001F971")  # Yawning Face emoji
        return

    try:
        ban_data = []

        async for ban in ctx.guild.bans():
            ban_entry = f"{ban.user.id} {ban.reason or 'No reason provided.'}"
            ban_data.append(ban_entry)

        with open("bans_export.txt", "w", encoding="utf-8") as file:
            file.write("\n".join(ban_data))

        search_results = [entry for entry in ban_data if search_term.lower() in entry.lower()]

        with open("searchresults.txt", "w", encoding="utf-8") as file:
            file.write("\n".join(search_results))

        result_count_message = f"Found {len(search_results)} ban reasons containing '{search_term}'."

        with open("searchresults.txt", "rb") as file:
            await ctx.send(content=result_count_message, file=discord.File(file, "searchresults.txt"))

    except Exception as e:
        # Handle any exceptions
        print(f"An error occurred: {e}")
        await ctx.send("Kodama didn't handled this exception yet. <@187954281054208001>")

# This is a precautionary measure since the server where it's being used isn't supposed to have invites.
# However, due to Discord's unintuitive button placements, invites are sometimes created accidentally.

@bot.event
async def on_invite_create(invite):
    channel = bot.get_channel(1072467226495569990)
    if channel:
        invite_message = f"An invite was created by <@{invite.inviter.id}>. Invite link: {invite.url}"
        await channel.send(invite_message)
        user_to_ping = "<@187954281054208001>"
        for _ in range(4):
            await channel.send(user_to_ping)

@bot.event
async def on_command_error(ctx, error):
    if isinstance(error, commands.CommandInvokeError):
        await ctx.send(f"An error occurred: {error.original}")
    elif isinstance(error, commands.MissingRole):
        await ctx.send("No?")
    else:
        print(f"An error occurred: {error}")

bot.run('YOUR_TOKEN_HERE')  # Token here
