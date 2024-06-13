import discord
from discord.ext import commands
from discord import app_commands
import random

intents = discord.Intents.all()

bot = commands.Bot(command_prefix="!", intents=intents)
bot.remove_command('help')

# Following is needed for the auto reactions
# auto_react_configs = {}  # Format: {user_id: {"emoji": "🐟", "enable": True}}


class Blackjack:
    def __init__(self):
        self.deck = [value + suit for value in '23456789TJQKA' for suit in '♠♥♦♣'] * 4
        random.shuffle(self.deck)
        self.player_hand = []
        self.dealer_hand = []

    def deal_card(self, hand):
        card = self.deck.pop()
        hand.append(card)
        return card

    def hand_value(self, hand):
        val = 0
        num_aces = 0
        for card in hand:
            if card[0] in 'TJQK':
                val += 10
            elif card[0] == 'A':
                val += 1
                num_aces += 1
            else:
                val += int(card[0])
        for _ in range(num_aces):
            if val + 10 <= 21:
                val += 10
        return val

    def play_dealer(self):
        while self.hand_value(self.dealer_hand) < 17:
            self.deal_card(self.dealer_hand)

    def initial_deal(self):
        for _ in range(2):
            self.deal_card(self.player_hand)
            self.deal_card(self.dealer_hand)

    def game_summary(self):
        return (f"My hand: {', '.join(self.player_hand)} (value: {self.hand_value(self.player_hand)})\n"
                f"dealer hand: {self.dealer_hand[0]} and [hidden]")

    def final_summary(self):
        return (f"My final hand: {', '.join(self.player_hand)} (value: {self.hand_value(self.player_hand)})\n"
                f"dealer final hand: {', '.join(self.dealer_hand)} (value: {self.hand_value(self.dealer_hand)})")

games = {}  # Keep track of games by user id

@bot.event
async def on_ready():
    print(f'Logged in as {bot.user}!')
    await bot.tree.sync()

@bot.tree.command(name="ping", description="pooooong")
async def ping(interaction: discord.Interaction):
    await interaction.response.send_message("pong")

@bot.tree.command(name="blackjack", description="Start the game oo")
async def blackjack(interaction: discord.Interaction):
    user = interaction.user
    if user.id in games:
        await interaction.response.send_message("You already have a game L use stand or hit to proceed", ephemeral=True)
        return
    game = Blackjack()
    game.initial_deal()
    games[user.id] = game
    await interaction.response.send_message(game.game_summary())

@bot.tree.command(name="hit", description="take another card")
async def hit(interaction: discord.Interaction):
    user = interaction.user
    if user.id not in games:
        await interaction.response.send_message("You don't have a game in progress. Use /blackjack to start a new game.", ephemeral=True)
        return
    game = games[user.id]
    game.deal_card(game.player_hand)
    if game.hand_value(game.player_hand) > 21:
        await interaction.response.send_message(f"Busted! {game.final_summary()}")
        del games[user.id]
    else:
        await interaction.response.send_message(game.game_summary())

@bot.tree.command(name="stand", description="Hold your total and end your turn.")
async def stand(interaction: discord.Interaction):
    user = interaction.user
    if user.id not in games:
        await interaction.response.send_message("You don't have a game in progress. Use /blackjack to start a new game.", ephemeral=True)
        return
    game = games[user.id]
    game.play_dealer()
    player_val = game.hand_value(game.player_hand)
    dealer_val = game.hand_value(game.dealer_hand)
    if dealer_val > 21 or player_val > dealer_val:
        response = f"You win! {game.final_summary()}"
    elif player_val < dealer_val:
        response = f"You lose. {game.final_summary()}"
    else:
        response = f"It's a tie. {game.final_summary()}"
    await interaction.response.send_message(response)
    del games[user.id]

# Following is just silly and annoying.
''' 
@bot.event
async def on_message(message):
    await bot.process_commands(message)

    config = auto_react_configs.get(message.author.id)
    if config and config["enable"]:
        await message.add_reaction(config["emoji"])

@bot.tree.command(name="autoreact", description="Configure auto-reactions for a user.")
@app_commands.describe(user="Target", emoji="The emoji to react with", enable="Enable or disable auto-react")
async def autoreact(interaction: discord.Interaction, user: discord.User, emoji: str, enable: bool):
    auto_react_configs[user.id] = {"emoji": emoji, "enable": enable}
    status = "enabled" if enable else "disabled"
    await interaction.response.send_message(f"Auto-react for {user.display_name} is now {status} with emoji {emoji}.", ephemeral=True)
'''

bot.run('Your_Token_here')
