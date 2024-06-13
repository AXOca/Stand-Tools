# Discord Anticrash

This Discord bot was created during a time when a specific pattern of invisible characters could crash Discord clients if uploaded as an attachment. This issue was directly related to how Discord shows previews for text files.

While this problem has been resolved, this bot serves as a precautionary measure to detect and remove potentially harmful attachments containing the suspicious pattern.

## Features

- Monitors messages for attachments with suspicious invisible characters.
- Deletes messages containing harmful attachments to prevent client crashes.

## Note

This bot is designed to help mitigate risks, even though the specific issue it addresses is no longer a concern. Better safe than sorry!

## Dependencies

- `discord.py`
- `aiohttp`
- `re`
- `asyncio`
- `logging`
