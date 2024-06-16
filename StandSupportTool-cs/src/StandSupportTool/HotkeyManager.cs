using System;
using System.IO;
using System.Windows;

namespace StandSupportTool
{
    public class HotkeyManager
    {
        private readonly string hotkeysFilePath;

        public HotkeyManager()
        {
            // Initialize the path to the hotkeys file
            string appDataPath = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            string standDir = Path.Combine(appDataPath, "Stand");
            hotkeysFilePath = Path.Combine(standDir, "Hotkeys.txt");
        }

        // Configure hotkeys with user confirmation
        public void ConfigureHotkeys()
        {
            MessageBoxResult result = MessageBox.Show(
                "This will overwrite your current Hotkeys to match it with 60% keyboards that do not have function keys. Are you sure you want to do that?",
                "Confirm Hotkey Overwrite",
                MessageBoxButton.YesNoCancel,
                MessageBoxImage.Warning);

            if (result == MessageBoxResult.Yes)
            {
                WriteHotkeys();
            }
        }

        // Write the hotkeys configuration to the file
        private void WriteHotkeys()
        {
            try
            {
                string standDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Stand");

                // Create directory if it doesn't exist
                if (!Directory.Exists(standDir))
                {
                    Directory.CreateDirectory(standDir);
                }

                // Hotkey configuration content
                string hotkeyContent = @"
Tree Compatibility Version: 49
Stand
    Settings
        Input
            Keyboard Input Scheme
                Open/Close Menu: Tab
                Previous Tab: O
                Next Tab: P
                Up: I
                Down: K
                Left: J
                Right: L
                Click: Enter
                Back: Backspace";

                // Write the content to the file
                File.WriteAllText(hotkeysFilePath, hotkeyContent.Trim());

                // Show success message
                MessageBox.Show(@"Hotkeys have been set successfully:
                Open/Close Menu: Tab
                Previous Tab: O
                Next Tab: P
                Up: I
                Down: K
                Left: J
                Right: L
                Click: Enter
                Back: Backspace",
                "Success",
                MessageBoxButton.OK,
                MessageBoxImage.Information);
            }
            catch (Exception ex)
            {
                // Show error message
                MessageBox.Show($"Failed to write hotkeys: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }
    }
}
