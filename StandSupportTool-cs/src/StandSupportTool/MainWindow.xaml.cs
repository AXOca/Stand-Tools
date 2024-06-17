using System;
using System.Windows;
using System.Windows.Controls;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using System.Xml;

namespace StandSupportTool
{
    public partial class MainWindow : Window
    {
        // Managers
        private static ResetManager resetManager = new ResetManager();
        private static ProtocolManager protocolManager = new ProtocolManager();
        private static LogManager logManager = new LogManager();
        private static ProfileManager profileManager = new ProfileManager();
        private static ActivationManager activationManager = new ActivationManager();
        private static HotkeyManager hotkeyManager = new HotkeyManager();
        private static ClearHotkeysManager clearHotkeysManager = new ClearHotkeysManager();
        private static UpdateManager updateManager;
        private static AntivirusInfo antivirusInfo = new AntivirusInfo();
        public MainWindow()
        {
            InitializeComponent();
            // Initialize Activation Key TextBox
            ActivationKeyText.Text = activationManager.ReadActivationKey().Replace("Stand-Activate-", "");
            // Initialize Protocol ComboBox
            InitializeProtocol();

            // Extract current version from window title
            string currentVersion = ExtractVersionFromTitle(this.Title);
            string executablePath = Process.GetCurrentProcess().MainModule.FileName; // Get the executable path
            updateManager = new UpdateManager(currentVersion, executablePath);

            // Check for updates
            CheckForUpdatesAsync();
        }

        private string ExtractVersionFromTitle(string title)
        {
            // Assuming the title is in the format "Stand Support Tool (Version: x.y)"
            string[] parts = title.Split(new string[] { "Version: " }, StringSplitOptions.None);
            if (parts.Length > 1)
            {
                return parts[1].TrimEnd(')');
            }
            return "0.0"; // Default version if not found
        }

        private void InitializeProtocol()
        {
            // Get the current protocol
            string currentProtocol = protocolManager.getProtocol();

            // Select the current protocol in the ComboBox
            foreach (ComboBoxItem item in ProtocolComboBox.Items)
            {
                if (item.Content.ToString() == currentProtocol)
                {
                    item.IsSelected = true;
                    break;
                }
            }
        }

        private async Task CheckForUpdatesAsync()
        {
            bool isUpdateAvailable = await updateManager.CheckForUpdates();
            if (isUpdateAvailable)
            {
                UpdateButton.Visibility = Visibility.Visible;
            }
        }

        private async void UpdateButton_Click(object sender, RoutedEventArgs e)
        {
            await updateManager.DownloadUpdate();
        }

        // Event handlers
        private void FullReset_Click(object sender, RoutedEventArgs e)
        {
            resetManager.FullReset();
        }

        private void ClearCache_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                // Define cache directory path
                string cacheDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Stand/Cache");

                if (Directory.Exists(cacheDir))
                {
                    Directory.Delete(cacheDir, true);
                    MessageBox.Show("All Cache data has been deleted.", "Success", MessageBoxButton.OK, MessageBoxImage.Information);
                }
                else
                {
                    MessageBox.Show("Cache directory does not exist.", "Info", MessageBoxButton.OK, MessageBoxImage.Information);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to delete Cache data: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void SwitchProtocol_Click(object sender, RoutedEventArgs e)
        {
            protocolManager.writeProtocol();
            InitializeProtocol();
        }

        private void ComboBox_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            ComboBox comboBox = sender as ComboBox;

            if (comboBox != null && comboBox.SelectedItem != null)
            {
                ComboBoxItem selectedItem = comboBox.SelectedItem as ComboBoxItem;

                if (selectedItem != null)
                {
                    string selectedContent = selectedItem.Content.ToString();
                    protocolManager.setProtocol(selectedContent);
                }
            }
        }

        private void CopyLogToClipboard_Click(object sender, RoutedEventArgs e)
        {
            logManager.CopyLogToClipboard();
        }

        private void CopyProfileToClipboard_Click(object sender, RoutedEventArgs e)
        {
            profileManager.CopyProfileToClipboard(profileManager.GetActiveProfile());
        }

        private void SetActivationKey_Click(object sender, RoutedEventArgs e)
        {
            // Create and configure the input dialog window
            Window inputDialog = new Window
            {
                Title = "Enter Activation Key",
                Width = 300,
                Height = 150,
                WindowStartupLocation = WindowStartupLocation.CenterScreen,
                ResizeMode = ResizeMode.NoResize
            };

            StackPanel stackPanel = new StackPanel { Margin = new Thickness(10) };

            // Add components to the dialog window
            stackPanel.Children.Add(new TextBlock { Text = "Enter Activation Key:", Margin = new Thickness(0, 0, 0, 10) });
            TextBox textBox = new TextBox { Width = 250, Margin = new Thickness(0, 0, 0, 10) };
            stackPanel.Children.Add(textBox);

            StackPanel buttonPanel = new StackPanel { Orientation = Orientation.Horizontal, HorizontalAlignment = HorizontalAlignment.Right };

            // OK button
            Button okButton = new Button { Content = "OK", Width = 75, Margin = new Thickness(0, 0, 10, 0) };
            okButton.Click += (s, args) =>
            {
                inputDialog.DialogResult = true;
                inputDialog.Close();
            };
            buttonPanel.Children.Add(okButton);

            // Cancel button
            Button cancelButton = new Button { Content = "Cancel", Width = 75 };
            cancelButton.Click += (s, args) =>
            {
                inputDialog.DialogResult = false;
                inputDialog.Close();
            };
            buttonPanel.Children.Add(cancelButton);

            stackPanel.Children.Add(buttonPanel);
            inputDialog.Content = stackPanel;

            // Show dialog and set activation key if OK was clicked
            if (inputDialog.ShowDialog() == true)
            {
                string activationKey = textBox.Text;
                activationManager.WriteActivationKey(activationKey);
                ActivationKeyText.Text = activationManager.ReadActivationKey().Replace("Stand-Activate-", "");
            }
        }

        private void HotkeyButton_Click(object sender, RoutedEventArgs e)
        {
            hotkeyManager.ConfigureHotkeys();
        }

        private void OpenYouTubeLink_Click(object sender, RoutedEventArgs e)
        {
            YouTubeLinkOpener.OpenYouTubeLink();
        }

        private void AddStandToExclusionsV2_Click(object sender, RoutedEventArgs e)
        {
            PowerShellExecutor.ExecuteAddMpPreference();
        }

        private void Test_Click(object sender, RoutedEventArgs e)
        {
            TestManager.PerformTest();
        }

        private void RunTest_Click(object sender, RoutedEventArgs e)
        {
            List<AntivirusInfo> avInfos = antivirusInfo.get();
            string message = "Detected Antiviruses:\n";

            foreach (AntivirusInfo info in avInfos)
            {
                message += info.DisplayName + " at: " + info.ExePath + "\n";
            }

            MessageBox.Show(message, "Av Checker", MessageBoxButton.OK, MessageBoxImage.Information);
        }

        private void ClearH_Click(object sender, RoutedEventArgs e)
        {
            clearHotkeysManager.ClearHotkeys();
        }
    }
}
