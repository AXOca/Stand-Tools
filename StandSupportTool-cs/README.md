# Stand Support Tool

Initial concept was made with Python on this project: [SST](https://github.com/AXOca/Stand-Tools/tree/main/SST)

Afterwards, I talked to a friend who tried doing the same in C#. He invited me to his repo, and I added a lot of features and optimized it. I also edited the design (which is much easier in Visual Studio than what I did previously in python). Now, it's at least a tiny bit stand look-a-like like the website. That's it.

## Functions

### Full Reset of Stand
- Backup logic to ensure data is saved before reset.

### Clear Cache of Stand
- Deletes BIN and Cache files to free up space and resolve issues.

### Copy Log to Clipboard
- Logic to ensure logs do not exceed Discord's file size limits when copied.

### Copy Profile to Clipboard
- Copies the profile that is loaded when you start Stand.

### Clear Hotkeys
- Deletes the `Hotkeys.txt` file to reset hotkeys.

### 60% Hotkeys
- Changes Stand's hotkeys to something useful for people without FN Keys and without a Numpad.

### DL Launchpad
- Downloads the launchpad semi-encrypted to the desktop. The user can open it with the password "stand.gg".

### Add Exclusion
- Adds Stand's BIN folder to the exclusions of Windows Defender.

### Protocol
- A dropdown menu to change the network protocol Stand is using.

### Activation Key
- Shows the current activation key that is in `Activation Key.txt` and allows easy changes with the "Set Key" button.
