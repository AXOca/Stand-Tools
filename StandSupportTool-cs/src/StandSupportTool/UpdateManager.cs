using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Reflection;
using System.Threading.Tasks;
using System.Windows;

namespace StandSupportTool
{
    public class UpdateManager
    {
        private const string VersionUrl = "https://raw.githubusercontent.com/AXOca/Stand-Tools/main/StandSupportTool-cs/version.txt";
        private const string DownloadUrl = "https://raw.githubusercontent.com/AXOca/Stand-Tools/main/StandSupportTool-cs/latest_build/StandSupportTool.exe";
        private string CurrentVersion;
        private string ExecutablePath;

        public UpdateManager(string currentVersion, string executablePath)
        {
            CurrentVersion = currentVersion;
            ExecutablePath = executablePath;
        }

        public async Task<bool> CheckForUpdates()
        {
            try
            {
                using (HttpClient client = new HttpClient())
                {
                    string versionUrl = VersionUrl + "?t=" + DateTime.Now.Ticks;
                    string latestVersion = await client.GetStringAsync(versionUrl);
                    latestVersion = latestVersion.Trim(); // Ensure no extra spaces or newlines

                    if (CompareVersions(latestVersion, CurrentVersion))
                    {
                        return true;
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to check for updates: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
            return false;
        }

        public async Task DownloadUpdate()
        {
            try
            {
                using (HttpClient client = new HttpClient())
                {
                    byte[] data = await client.GetByteArrayAsync(DownloadUrl);
                    string tempFilePath = Path.Combine(Path.GetTempPath(), "StandSupportTool_new.exe");

                    File.WriteAllBytes(tempFilePath, data);

                    string batchFilePath = Path.Combine(Path.GetTempPath(), "update.bat");

                    string batchScript = $@"
                        @echo off
                        echo Stopping current instance...
                        taskkill /f /im {Path.GetFileName(ExecutablePath)} > nul 2>&1
                        timeout /t 2 /nobreak > nul
                        echo Deleting old file...
                        del /f ""{ExecutablePath}""
                        if exist ""{ExecutablePath}"" (
                            echo Old file still exists, cannot replace.
                            pause
                            exit /b 1
                        )
                        echo Moving new file to original location...
                        move /y ""{tempFilePath}"" ""{ExecutablePath}""
                        if %errorlevel% neq 0 (
                            echo Error replacing the file.
                            pause
                            exit /b %errorlevel%
                        )
                        echo Restarting application...
                        start """" ""{ExecutablePath}""
                        echo Cleaning up...
                        del ""{batchFilePath}""
                    ";

                    File.WriteAllText(batchFilePath, batchScript);

                    ProcessStartInfo processStartInfo = new ProcessStartInfo("cmd.exe", $"/c \"{batchFilePath}\"")
                    {
                        CreateNoWindow = true,
                        UseShellExecute = false
                    };

                    Process.Start(processStartInfo);

                    // Show the temporary file path in a message box for tracking
                    MessageBox.Show($"Update downloaded to: {tempFilePath}", "Update Info", MessageBoxButton.OK, MessageBoxImage.Information);

                    // Log the update process initiation
                    File.AppendAllText(Path.Combine(Path.GetTempPath(), "update_log.txt"), $"{DateTime.Now}: Update process initiated. Temp file path: {tempFilePath}\n");

                    Application.Current.Shutdown();
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to download update: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);

                // Log the error
                File.AppendAllText(Path.Combine(Path.GetTempPath(), "update_log.txt"), $"{DateTime.Now}: Error - {ex.Message}\n");
            }
        }

        private bool CompareVersions(string latestVersion, string currentVersion)
        {
            Version v1 = new Version(latestVersion);
            Version v2 = new Version(currentVersion);

            return v1 > v2;
        }
    }
}
