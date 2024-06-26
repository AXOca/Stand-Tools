import discord
from discord.ext import commands, tasks
import json
import time
import os

with open('config.json', 'r') as f:
    config = json.load(f)

TOKEN = config['bot_token']
ROLE_ID = config['role_id']
MESSAGE_TEMPLATE = config['message_template']
GUILD_ID = config['guild_id']
LOG_CHANNEL_ID = config['log_channel_id']

intents = discord.Intents.default()
intents.message_content = True
intents.members = True

bot = commands.Bot(command_prefix='!', intents=intents)

# get role duration and increment usage count
def get_role_duration_and_increment(user_id):
    log_file = 'role_log.json'
    if os.path.exists(log_file):
        with open(log_file, 'r') as f:
            role_log = json.load(f)
    else:
        role_log = {}

    if user_id in role_log:
        role_log[user_id]['count'] += 1
    else:
        role_log[user_id] = {'count': 1}

    role_duration = 2 ** (role_log[user_id]['count'] - 1) * 3600
    role_log[user_id]['expires_at'] = time.time() + role_duration

    with open(log_file, 'w') as f:
        json.dump(role_log, f, indent=4)

    return role_duration, role_log[user_id]['expires_at'], role_log[user_id]['count']

# task to remove expired roles
@tasks.loop(minutes=1)
async def check_role_expirations():
    log_file = 'role_log.json'
    if os.path.exists(log_file):
        with open(log_file, 'r') as f:
            role_log = json.load(f)
    else:
        return

    guild = bot.get_guild(GUILD_ID)
    role = guild.get_role(ROLE_ID)
    log_channel = guild.get_channel(LOG_CHANNEL_ID)
    current_time = time.time()

    for user_id, info in list(role_log.items()):
        if info.get('expires_at') is not None and current_time >= info['expires_at']:
            member = guild.get_member(int(user_id))
            if member:
                await member.remove_roles(role)
                if log_channel:
                    await log_channel.send(f"Role removed from {member.mention} (ID: {member.id}).")
            info['expires_at'] = None  # clear the expiration time but keep the count

    with open(log_file, 'w') as f:
        json.dump(role_log, f, indent=4)

@bot.event
async def on_ready():
    check_role_expirations.start()
    print(f'Logged in as {bot.user}')
    
    # Debugging: Log all roles in the guild
    # guild = bot.get_guild(GUILD_ID)
    # if guild:
    #    print("Roles in the guild:")
    #    for role in guild.roles:
    #        print(f"Role: {role.name}, ID: {role.id}")
    
    try:
        # sync global commands -> without this commands won't sync
        await bot.tree.sync()
        # sync guild-specific commands
        await bot.tree.sync(guild=discord.Object(id=GUILD_ID))
        print("Commands synced successfully")
    except Exception as e:
        print(f"Failed to sync commands: {e}")

@bot.tree.context_menu(name="TSB-M")
async def tsb_message(interaction: discord.Interaction, message: discord.Message):
    print(f"TSB (Message) context menu clicked for message by {message.author}")
    await handle_tsb(interaction, message.author)

@bot.tree.context_menu(name="TSB-U")
async def tsb_user(interaction: discord.Interaction, user: discord.User):
    print(f"TSB (User) context menu clicked for user {user}")
    await handle_tsb(interaction, user)

async def handle_tsb(interaction, user):
    guild = interaction.guild
    role = guild.get_role(ROLE_ID)
    print(f"Fetched Role: {role}")
    if role is None:
        await interaction.response.send_message("Role not found. Please check the ROLE_ID in the config.", ephemeral=True)
        return
    
    member = guild.get_member(user.id)
    log_channel = guild.get_channel(LOG_CHANNEL_ID)

    if not member:
        await interaction.response.send_message("User not found in this guild.", ephemeral=True)
        return

    role_duration, expires_at, usage_count = get_role_duration_and_increment(str(user.id))
    await member.add_roles(role)

    timestamp = int(expires_at)
    expiry_date = f"<t:{timestamp}:f>"

    message = MESSAGE_TEMPLATE.replace("<t:timestamp:f>", expiry_date)
    await user.send(message)

    if log_channel:
        await log_channel.send(
            f"{interaction.user.mention} banned {member.mention} from #support-and-help for {role_duration // 3600} hours. Ban expires at {expiry_date}."
        )

    await interaction.response.send_message(f"{member.mention} has been banned from #support-and-help for {role_duration // 3600} hours. Ban expires at {expiry_date}.", ephemeral=True)

@bot.tree.command(name="removetsb", description="Remove the temporary support ban from a user")
@discord.app_commands.describe(user="The user to remove the ban from")
async def remove_tsb(interaction: discord.Interaction, user: discord.Member):
    guild = interaction.guild
    role = guild.get_role(ROLE_ID)
    print(f"Fetched Role for Removal: {role}")
    if role is None:
        await interaction.response.send_message("Role not found. Please check the ROLE_ID in the config.", ephemeral=True)
        return

    log_channel = guild.get_channel(LOG_CHANNEL_ID)

    log_file = 'role_log.json'
    if os.path.exists(log_file):
        with open(log_file, 'r') as f:
            role_log = json.load(f)
    else:
        await interaction.response.send_message("No role log found.", ephemeral=True)
        return

    if str(user.id) in role_log:
        if role_log[str(user.id)]['expires_at'] is None:
            await interaction.response.send_message(f"{user.mention} is currently not banned.", ephemeral=True)
        else:
            role_log[str(user.id)]['expires_at'] = None  # clear the expiration time but keep the count
            with open(log_file, 'w') as f:
                json.dump(role_log, f, indent=4)

            await user.remove_roles(role)
            if log_channel:
                await log_channel.send(f"{interaction.user.mention} removed the ban from {user.mention}.")

            await interaction.response.send_message(f"The ban from {user.mention} has been removed.", ephemeral=True)
    else:
        await interaction.response.send_message("This user does not have a logged ban.", ephemeral=True)

bot.run(TOKEN)
