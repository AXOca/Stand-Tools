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
        private static DashboardLinkOpener dashboardLinkOpener = new DashboardLinkOpener();
        private static CacheManager cacheManager = new CacheManager();

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
            cacheManager.ClearCache();
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
            activationManager.SetActivationKey(ActivationKeyText);
        }

        private void HotkeyButton_Click(object sender, RoutedEventArgs e)
        {
            HotkeysTable hotkeysTable = new HotkeysTable();
            hotkeysTable.Show();
        }

        private void OpenYouTubeLink_Click(object sender, RoutedEventArgs e)
        {
            YouTubeLinkOpener.OpenYouTubeLink();
        }

        private void AddStandToExclusionsV2_Click(object sender, RoutedEventArgs e)
        {
            PowerShellExecutor.ExecuteAddMpPreference();
        }

        private void Launchpad_Click(object sender, RoutedEventArgs e)
        {
            LaunchpadManager.PerformTest();
        }

        private void DisplayAntivirusInfo_Click(object sender, RoutedEventArgs e)
        {
            List<AntivirusInfo> avInfos = antivirusInfo.GetAntivirusInfo();
            string message = "Detected Antiviruses:\n";

            foreach (AntivirusInfo info in avInfos)
            {
                message += info.DisplayName + " at: " + info.ExePath + "\n";
            }

            MessageBox.Show(message, "Antivirus Information", MessageBoxButton.OK, MessageBoxImage.Information);
        }

        private void Dashboard_Click(object sender, RoutedEventArgs e)
        {
            dashboardLinkOpener.OpenDashboardLink();
        }
    }
}