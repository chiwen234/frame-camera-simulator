using System;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Text;
using System.Windows.Forms;
using Microsoft.Win32;

namespace FrameCameraCompany
{
    internal static class SetupProgram
    {
        private const string AppTitle = "FRAME · 相机公司模拟器";

        [STAThread]
        private static void Main(string[] args)
        {
            string silentDir = GetArgumentValue(args, "/DIR=");
            bool silent = HasArgument(args, "/S") || HasArgument(args, "/SILENT");

            if (silent)
            {
                try
                {
                    Installer.Install(string.IsNullOrWhiteSpace(silentDir) ? Installer.DefaultInstallDir : silentDir);
                    Environment.ExitCode = 0;
                }
                catch (Exception ex)
                {
                    try
                    {
                        string log = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "setup-error.log");
                        File.WriteAllText(log, ex.ToString());
                    }
                    catch { }
                    try
                    {
                        File.WriteAllText(Path.Combine(Path.GetTempPath(), "FRAME-setup-error.log"), ex.ToString());
                    }
                    catch { }
                    Environment.ExitCode = 1;
                }
                return;
            }

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new SetupForm(string.IsNullOrWhiteSpace(silentDir) ? Installer.DefaultInstallDir : silentDir));
        }

        private static bool HasArgument(string[] args, string value)
        {
            foreach (string arg in args)
            {
                if (string.Equals(arg, value, StringComparison.OrdinalIgnoreCase)) return true;
            }
            return false;
        }

        private static string GetArgumentValue(string[] args, string prefix)
        {
            foreach (string arg in args)
            {
                if (arg != null && arg.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                {
                    return arg.Substring(prefix.Length).Trim('"');
                }
            }
            return null;
        }
    }

    internal static class Installer
    {
        internal const string DisplayName = "FRAME · 相机公司模拟器";
        internal const string DisplayVersion = "1.0.0";
        internal const string Publisher = "FRAME";
        internal const string RegistryKeyPath = @"Software\Microsoft\Windows\CurrentVersion\Uninstall\FRAME_Camera_Simulator";

        internal static string DefaultInstallDir
        {
            get
            {
                return Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "Programs",
                    "FRAME Camera Simulator");
            }
        }

        internal static string Install(string targetDir)
        {
            if (string.IsNullOrWhiteSpace(targetDir)) throw new ArgumentException("安装位置不能为空。");
            string fullDir = Path.GetFullPath(targetDir).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            if (string.Equals(fullDir, Path.GetPathRoot(fullDir).TrimEnd(Path.DirectorySeparatorChar), StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("不能直接安装到磁盘根目录，请选择子文件夹。");

            if (Process.GetProcessesByName("FRAME").Length > 0)
                throw new InvalidOperationException("FRAME 正在运行，请先关闭游戏再安装。");

            if (Directory.Exists(fullDir))
            {
                bool isOurs = File.Exists(Path.Combine(fullDir, "FRAME.exe"));
                bool empty = Directory.GetFileSystemEntries(fullDir).Length == 0;
                if (!empty && !isOurs)
                    throw new InvalidOperationException("目标文件夹不为空。请选择一个空文件夹，或旧版 FRAME 安装目录。");
                if (!empty) Directory.Delete(fullDir, true);
            }

            Directory.CreateDirectory(fullDir);
            ExtractPayload(fullDir);
            string appExe = Path.Combine(fullDir, "FRAME.exe");
            string uninstallExe = Path.Combine(fullDir, "Uninstall.exe");
            if (!File.Exists(appExe)) throw new FileNotFoundException("安装包缺少 FRAME.exe。");
            if (!File.Exists(uninstallExe)) throw new FileNotFoundException("安装包缺少 Uninstall.exe。");

            File.AppendAllText(Path.Combine(fullDir, "install-step.log"), "payload extracted\n", Encoding.UTF8);
            ProvisionShortcutsAndRegistry(fullDir, appExe, uninstallExe);
            return fullDir;
        }

        private static void ExtractPayload(string targetDir)
        {
            Assembly assembly = Assembly.GetExecutingAssembly();
            using (Stream payload = assembly.GetManifestResourceStream("FRAME_PAYLOAD"))
            {
                if (payload == null) throw new InvalidOperationException("安装包数据缺失。");
                using (ZipArchive archive = new ZipArchive(payload, ZipArchiveMode.Read))
                {
                    string root = Path.GetFullPath(targetDir).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
                    foreach (ZipArchiveEntry entry in archive.Entries)
                    {
                        if (string.IsNullOrEmpty(entry.Name) && entry.FullName.EndsWith("/", StringComparison.Ordinal)) continue;
                        string destination = Path.GetFullPath(Path.Combine(targetDir, entry.FullName));
                        if (!destination.StartsWith(root, StringComparison.OrdinalIgnoreCase))
                            throw new InvalidOperationException("安装包包含非法路径。");
                        Directory.CreateDirectory(Path.GetDirectoryName(destination));
                        using (Stream input = entry.Open())
                        using (FileStream output = new FileStream(destination, FileMode.Create, FileAccess.Write, FileShare.None))
                        {
                            input.CopyTo(output);
                        }
                    }
                }
            }
        }

        private static void CreateStartMenuShortcuts(string installDir, string appExe, string uninstallExe)
        {
            string programs = Environment.GetFolderPath(Environment.SpecialFolder.Programs);
            if (string.IsNullOrWhiteSpace(programs))
                programs = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), @"Microsoft\Windows\Start Menu\Programs");
            string startFolder = Path.Combine(programs, "FRAME");
            Directory.CreateDirectory(startFolder);

            CreateShortcut(
                Path.Combine(startFolder, "FRAME 相机公司模拟器.lnk"),
                appExe,
                "",
                installDir,
                "FRAME · 相机公司模拟器",
                appExe);
            CreateShortcut(
                Path.Combine(startFolder, "卸载 FRAME.lnk"),
                uninstallExe,
                "",
                installDir,
                "卸载 FRAME",
                uninstallExe);
        }

        private static void CreateShortcut(string linkPath, string targetPath, string arguments, string workingDir, string description, string iconPath)
        {
            Type shellType = Type.GetTypeFromProgID("WScript.Shell");
            if (shellType == null) throw new InvalidOperationException("无法创建快捷方式：系统缺少 WScript.Shell。");
            dynamic shell = Activator.CreateInstance(shellType);
            dynamic shortcut = shell.CreateShortcut(linkPath);
            shortcut.TargetPath = targetPath;
            shortcut.Arguments = arguments;
            shortcut.WorkingDirectory = workingDir;
            shortcut.Description = description;
            shortcut.IconLocation = iconPath + ",0";
            shortcut.Save();
        }

        private static void ProvisionShortcutsAndRegistry(string installDir, string appExe, string uninstallExe)
        {
            string log = Path.Combine(installDir, "install-step.log");
            string desktopLink = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "FRAME 相机公司模拟器.lnk");
            bool desktopCreated = false;

            // The desktop shortcut is the one requirement that must succeed.
            try
            {
                CreateShortcut(desktopLink, appExe, "", installDir, "FRAME · 相机公司模拟器", appExe);
                desktopCreated = File.Exists(desktopLink);
                File.AppendAllText(log, "desktop shortcut direct=" + desktopCreated + "\n", Encoding.UTF8);
            }
            catch (Exception ex)
            {
                File.AppendAllText(log, "desktop shortcut direct failed: " + ex.Message + "\n", Encoding.UTF8);
            }

            if (!desktopCreated)
            {
                try
                {
                    RunPowerShellProvisioning(installDir, appExe, uninstallExe);
                    desktopCreated = File.Exists(desktopLink);
                }
                catch (Exception ex)
                {
                    File.AppendAllText(log, "desktop shortcut fallback failed: " + ex.Message + "\n", Encoding.UTF8);
                }
            }

            if (!desktopCreated)
                throw new InvalidOperationException("无法在桌面创建快捷方式。请确认当前用户对桌面文件夹有写入权限。");

            // Start menu and uninstall registration are useful, but must not destroy a completed install.
            try { CreateStartMenuShortcuts(installDir, appExe, uninstallExe); }
            catch (Exception ex) { File.AppendAllText(log, "start menu skipped: " + ex.Message + "\n", Encoding.UTF8); }
            try { WriteUninstallRegistry(installDir, appExe, uninstallExe); }
            catch (Exception ex) { File.AppendAllText(log, "registry skipped: " + ex.Message + "\n", Encoding.UTF8); }
        }

        private static void RunPowerShellProvisioning(string installDir, string appExe, string uninstallExe)
        {
            long size = 0;
            foreach (string file in Directory.GetFiles(installDir, "*", SearchOption.AllDirectories))
            {
                try { size += new FileInfo(file).Length; } catch { }
            }

            string desktopLink = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "FRAME 相机公司模拟器.lnk");
            string programs = Environment.GetFolderPath(Environment.SpecialFolder.Programs);
            string startFolder = Path.Combine(programs, "FRAME");
            string startLink = Path.Combine(startFolder, "FRAME 相机公司模拟器.lnk");
            string uninstallLink = Path.Combine(startFolder, "卸载 FRAME.lnk");

            StringBuilder script = new StringBuilder();
            script.AppendLine("$ErrorActionPreference = 'Stop'");
            script.AppendLine("$ws = New-Object -ComObject WScript.Shell");
            script.AppendLine("try {");
            AppendShortcutScript(script, desktopLink, appExe, installDir, "FRAME · 相机公司模拟器", appExe, "  ");
            script.AppendLine("} catch { }");
            script.AppendLine("try {");
            script.AppendLine("  New-Item -ItemType Directory -Path " + Ps(startFolder) + " -Force | Out-Null");
            AppendShortcutScript(script, startLink, appExe, installDir, "FRAME · 相机公司模拟器", appExe, "  ");
            AppendShortcutScript(script, uninstallLink, uninstallExe, installDir, "卸载 FRAME", uninstallExe, "  ");
            script.AppendLine("} catch { }");
            script.AppendLine("try {");
            script.AppendLine("  $key = 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\FRAME_Camera_Simulator'");
            script.AppendLine("  New-Item -Path $key -Force | Out-Null");
            script.AppendLine("  Set-ItemProperty -Path $key -Name DisplayName -Value " + Ps(DisplayName));
            script.AppendLine("  Set-ItemProperty -Path $key -Name DisplayVersion -Value " + Ps(DisplayVersion));
            script.AppendLine("  Set-ItemProperty -Path $key -Name Publisher -Value " + Ps(Publisher));
            script.AppendLine("  Set-ItemProperty -Path $key -Name InstallLocation -Value " + Ps(installDir));
            script.AppendLine("  Set-ItemProperty -Path $key -Name DisplayIcon -Value " + Ps(appExe + ",0"));
            script.AppendLine("  Set-ItemProperty -Path $key -Name UninstallString -Value " + Ps("\"" + uninstallExe + "\""));
            script.AppendLine("  Set-ItemProperty -Path $key -Name QuietUninstallString -Value " + Ps("\"" + uninstallExe + "\" /S"));
            script.AppendLine("  New-ItemProperty -Path $key -Name NoModify -Value 1 -PropertyType DWord -Force | Out-Null");
            script.AppendLine("  New-ItemProperty -Path $key -Name NoRepair -Value 1 -PropertyType DWord -Force | Out-Null");
            script.AppendLine("  New-ItemProperty -Path $key -Name EstimatedSize -Value " + Math.Max(1, size / 1024) + " -PropertyType DWord -Force | Out-Null");
            script.AppendLine("} catch { }");

            string scriptPath = Path.Combine(installDir, "provision.ps1");
            File.WriteAllText(scriptPath, script.ToString(), new UTF8Encoding(true));

            string powershell = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), @"WindowsPowerShell\v1.0\powershell.exe");
            if (!File.Exists(powershell)) powershell = "powershell.exe";
            ProcessStartInfo psi = new ProcessStartInfo(powershell);
            psi.Arguments = "-NoLogo -NoProfile -ExecutionPolicy Bypass -File \"" + scriptPath + "\"";
            psi.UseShellExecute = false;
            psi.CreateNoWindow = true;
            psi.RedirectStandardError = true;
            psi.RedirectStandardOutput = true;
            using (Process process = Process.Start(psi))
            {
                string stdout = process.StandardOutput.ReadToEnd();
                string stderr = process.StandardError.ReadToEnd();
                if (!process.WaitForExit(30000))
                {
                    try { process.Kill(); } catch { }
                    throw new InvalidOperationException("创建快捷方式超时。");
                }
                if (process.ExitCode != 0)
                {
                    throw new InvalidOperationException("无法创建桌面快捷方式或卸载信息。" + (stderr.Length > 0 ? "\n" + stderr : ""));
                }
                try { File.Delete(scriptPath); } catch { }
                string log = Path.Combine(installDir, "install-step.log");
                File.AppendAllText(log, "powershell " + process.ExitCode + "\n" + stdout + stderr, Encoding.UTF8);
            }
        }

        private static void AppendShortcutScript(StringBuilder script, string linkPath, string targetPath, string workingDir, string description, string iconPath, string indent)
        {
            indent = indent ?? "";
            script.AppendLine(indent + "$s = $ws.CreateShortcut(" + Ps(linkPath) + ")");
            script.AppendLine(indent + "$s.TargetPath = " + Ps(targetPath));
            script.AppendLine(indent + "$s.Arguments = ''");
            script.AppendLine(indent + "$s.WorkingDirectory = " + Ps(workingDir));
            script.AppendLine(indent + "$s.Description = " + Ps(description));
            script.AppendLine(indent + "$s.IconLocation = " + Ps(iconPath + ",0"));
            script.AppendLine(indent + "$s.Save()");
        }

        private static string Ps(string value)
        {
            return "'" + (value ?? "").Replace("'", "''") + "'";
        }

        private static void WriteUninstallRegistry(string installDir, string appExe, string uninstallExe)
        {
            long size = 0;
            foreach (string file in Directory.GetFiles(installDir, "*", SearchOption.AllDirectories))
            {
                try { size += new FileInfo(file).Length; } catch { }
            }

            using (RegistryKey key = Registry.CurrentUser.CreateSubKey(RegistryKeyPath))
            {
                key.SetValue("DisplayName", DisplayName, RegistryValueKind.String);
                key.SetValue("DisplayVersion", DisplayVersion, RegistryValueKind.String);
                key.SetValue("Publisher", Publisher, RegistryValueKind.String);
                key.SetValue("InstallLocation", installDir, RegistryValueKind.String);
                key.SetValue("DisplayIcon", appExe + ",0", RegistryValueKind.String);
                key.SetValue("UninstallString", "\"" + uninstallExe + "\"", RegistryValueKind.String);
                key.SetValue("QuietUninstallString", "\"" + uninstallExe + "\" /S", RegistryValueKind.String);
                key.SetValue("NoModify", 1, RegistryValueKind.DWord);
                key.SetValue("NoRepair", 1, RegistryValueKind.DWord);
                key.SetValue("EstimatedSize", (int)Math.Max(1, size / 1024), RegistryValueKind.DWord);
            }
        }
    }

    internal sealed class SetupForm : Form
    {
        private readonly TextBox pathBox;
        private readonly Button installButton;
        private readonly Button cancelButton;
        private readonly Button browseButton;
        private readonly Label statusLabel;
        private readonly ProgressBar progress;
        private bool installed;
        private string installedDir;
        private string installedExe;

        internal SetupForm(string initialDir)
        {
            Text = "FRAME 安装程序";
            ClientSize = new Size(720, 520);
            FormBorderStyle = FormBorderStyle.FixedSingle;
            MaximizeBox = false;
            MinimizeBox = false;
            StartPosition = FormStartPosition.CenterScreen;
            BackColor = Color.FromArgb(11, 13, 11);
            ForeColor = Color.FromArgb(240, 237, 228);
            Font = new Font("Microsoft YaHei UI", 9f, FontStyle.Regular, GraphicsUnit.Point);
            AutoScaleMode = AutoScaleMode.Dpi;
            try { Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); } catch { }

            Panel header = new Panel();
            header.Dock = DockStyle.Top;
            header.Height = 150;
            header.Paint += PaintHeader;
            Controls.Add(header);

            PictureBox logo = new PictureBox();
            logo.SetBounds(32, 34, 76, 76);
            logo.SizeMode = PictureBoxSizeMode.Zoom;
            try { logo.Image = Icon.ExtractAssociatedIcon(Application.ExecutablePath).ToBitmap(); } catch { }
            header.Controls.Add(logo);

            Label brand = new Label();
            brand.Text = "FRAME";
            brand.Font = new Font("Bahnschrift", 30f, FontStyle.Regular, GraphicsUnit.Point);
            brand.ForeColor = Color.FromArgb(242, 237, 225);
            brand.BackColor = Color.Transparent;
            brand.SetBounds(126, 39, 360, 42);
            header.Controls.Add(brand);

            Label subtitle = new Label();
            subtitle.Text = "相机公司模拟器  ·  桌面版安装程序";
            subtitle.Font = new Font("Microsoft YaHei UI", 10f, FontStyle.Regular, GraphicsUnit.Point);
            subtitle.ForeColor = Color.FromArgb(216, 166, 90);
            subtitle.BackColor = Color.Transparent;
            subtitle.SetBounds(130, 84, 480, 24);
            header.Controls.Add(subtitle);

            Label version = new Label();
            version.Text = "v1.0.0   /   2026";
            version.Font = new Font("Bahnschrift", 8.5f, FontStyle.Regular, GraphicsUnit.Point);
            version.ForeColor = Color.FromArgb(108, 113, 102);
            version.BackColor = Color.Transparent;
            version.SetBounds(585, 106, 100, 20);
            version.TextAlign = ContentAlignment.MiddleRight;
            header.Controls.Add(version);

            Label heading = new Label();
            heading.Text = "把 FRAME 安装到这台电脑";
            heading.Font = new Font("Microsoft YaHei UI", 15f, FontStyle.Bold, GraphicsUnit.Point);
            heading.ForeColor = Color.FromArgb(242, 237, 225);
            heading.SetBounds(34, 178, 640, 32);
            Controls.Add(heading);

            Label intro = new Label();
            intro.Text = "安装后可从桌面快捷方式直接启动。无需浏览器、无需联网，存档保存在本机。";
            intro.Font = new Font("Microsoft YaHei UI", 8.8f, FontStyle.Regular, GraphicsUnit.Point);
            intro.ForeColor = Color.FromArgb(148, 153, 141);
            intro.SetBounds(36, 216, 650, 22);
            Controls.Add(intro);

            Label pathLabel = new Label();
            pathLabel.Text = "安装位置";
            pathLabel.ForeColor = Color.FromArgb(195, 199, 187);
            pathLabel.Font = new Font("Microsoft YaHei UI", 8.5f, FontStyle.Regular, GraphicsUnit.Point);
            pathLabel.SetBounds(36, 259, 120, 20);
            Controls.Add(pathLabel);

            pathBox = new TextBox();
            pathBox.Text = initialDir;
            pathBox.ReadOnly = true;
            pathBox.BorderStyle = BorderStyle.FixedSingle;
            pathBox.BackColor = Color.FromArgb(22, 25, 20);
            pathBox.ForeColor = Color.FromArgb(220, 217, 207);
            pathBox.Font = new Font("Consolas", 9f, FontStyle.Regular, GraphicsUnit.Point);
            pathBox.SetBounds(36, 282, 546, 28);
            Controls.Add(pathBox);

            browseButton = new Button();
            browseButton.Text = "浏览…";
            browseButton.SetBounds(594, 281, 90, 30);
            StyleSecondaryButton(browseButton);
            browseButton.Click += BrowseButton_Click;
            Controls.Add(browseButton);

            Label shortcutNote = new Label();
            shortcutNote.Text = "✓  自动创建桌面快捷方式        ✓  创建开始菜单项        ✓  包含卸载程序";
            shortcutNote.ForeColor = Color.FromArgb(188, 160, 101);
            shortcutNote.Font = new Font("Microsoft YaHei UI", 8.6f, FontStyle.Regular, GraphicsUnit.Point);
            shortcutNote.SetBounds(36, 328, 650, 22);
            Controls.Add(shortcutNote);

            Label webviewNote = new Label();
            webviewNote.Text = "运行环境：Windows 10 / 11  ·  Microsoft Edge WebView2（Windows 11 通常已内置）  ·  不打开外部浏览器";
            webviewNote.ForeColor = Color.FromArgb(102, 108, 98);
            webviewNote.Font = new Font("Microsoft YaHei UI", 8f, FontStyle.Regular, GraphicsUnit.Point);
            webviewNote.SetBounds(36, 360, 660, 20);
            Controls.Add(webviewNote);

            Panel divider = new Panel();
            divider.BackColor = Color.FromArgb(38, 42, 35);
            divider.SetBounds(36, 400, 648, 1);
            Controls.Add(divider);

            statusLabel = new Label();
            statusLabel.Text = "准备就绪。";
            statusLabel.ForeColor = Color.FromArgb(130, 136, 124);
            statusLabel.Font = new Font("Microsoft YaHei UI", 8.5f, FontStyle.Regular, GraphicsUnit.Point);
            statusLabel.SetBounds(36, 414, 500, 22);
            Controls.Add(statusLabel);

            progress = new ProgressBar();
            progress.Style = ProgressBarStyle.Marquee;
            progress.MarqueeAnimationSpeed = 24;
            progress.SetBounds(36, 441, 648, 6);
            progress.Visible = false;
            Controls.Add(progress);

            cancelButton = new Button();
            cancelButton.Text = "取消";
            cancelButton.SetBounds(454, 465, 100, 36);
            StyleSecondaryButton(cancelButton);
            cancelButton.Click += CancelButton_Click;
            Controls.Add(cancelButton);

            installButton = new Button();
            installButton.Text = "安装 FRAME";
            installButton.SetBounds(566, 465, 118, 36);
            StylePrimaryButton(installButton);
            installButton.Click += InstallButton_Click;
            Controls.Add(installButton);

            AcceptButton = installButton;
            CancelButton = cancelButton;
        }

        private void PaintHeader(object sender, PaintEventArgs e)
        {
            Panel panel = (Panel)sender;
            using (LinearGradientBrush brush = new LinearGradientBrush(panel.ClientRectangle, Color.FromArgb(28, 33, 25), Color.FromArgb(11, 13, 11), 120f))
            {
                e.Graphics.FillRectangle(brush, panel.ClientRectangle);
            }
            using (Pen line = new Pen(Color.FromArgb(70, 48, 22), 1f))
            {
                e.Graphics.DrawLine(line, 0, panel.Height - 1, panel.Width, panel.Height - 1);
            }
            using (Pen accent = new Pen(Color.FromArgb(216, 166, 90), 2f))
            {
                e.Graphics.DrawLine(accent, 126, 128, 250, 128);
            }
        }

        private static void StylePrimaryButton(Button button)
        {
            button.FlatStyle = FlatStyle.Flat;
            button.FlatAppearance.BorderSize = 0;
            button.BackColor = Color.FromArgb(216, 166, 90);
            button.ForeColor = Color.FromArgb(18, 19, 15);
            button.Font = new Font("Microsoft YaHei UI", 9.5f, FontStyle.Bold, GraphicsUnit.Point);
            button.Cursor = Cursors.Hand;
            button.UseVisualStyleBackColor = false;
        }

        private static void StyleSecondaryButton(Button button)
        {
            button.FlatStyle = FlatStyle.Flat;
            button.FlatAppearance.BorderColor = Color.FromArgb(58, 63, 53);
            button.FlatAppearance.BorderSize = 1;
            button.BackColor = Color.FromArgb(20, 23, 18);
            button.ForeColor = Color.FromArgb(190, 194, 182);
            button.Font = new Font("Microsoft YaHei UI", 9f, FontStyle.Regular, GraphicsUnit.Point);
            button.Cursor = Cursors.Hand;
            button.UseVisualStyleBackColor = false;
        }

        private void BrowseButton_Click(object sender, EventArgs e)
        {
            using (FolderBrowserDialog dialog = new FolderBrowserDialog())
            {
                dialog.Description = "选择 FRAME 的安装位置";
                dialog.SelectedPath = pathBox.Text;
                dialog.ShowNewFolderButton = true;
                if (dialog.ShowDialog(this) == DialogResult.OK) pathBox.Text = dialog.SelectedPath;
            }
        }

        private void InstallButton_Click(object sender, EventArgs e)
        {
            if (installed)
            {
                try { Process.Start(new ProcessStartInfo(installedExe) { UseShellExecute = true, WorkingDirectory = installedDir }); } catch { }
                Close();
                return;
            }

            string target = pathBox.Text.Trim();
            if (string.IsNullOrWhiteSpace(target))
            {
                MessageBox.Show(this, "请选择安装位置。", Text, MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            SetBusy(true);
            statusLabel.ForeColor = Color.FromArgb(216, 166, 90);
            statusLabel.Text = "正在复制游戏文件并创建快捷方式…";
            Application.DoEvents();
            try
            {
                installedDir = Installer.Install(target);
                installedExe = Path.Combine(installedDir, "FRAME.exe");
                installed = true;
                statusLabel.ForeColor = Color.FromArgb(137, 178, 126);
                statusLabel.Text = "安装完成。桌面快捷方式已创建。";
                pathBox.Text = installedDir;
                installButton.Text = "启动 FRAME";
                cancelButton.Text = "关闭";
                browseButton.Enabled = false;
                pathBox.Enabled = false;
            }
            catch (Exception ex)
            {
                statusLabel.ForeColor = Color.FromArgb(211, 105, 79);
                statusLabel.Text = "安装失败。";
                MessageBox.Show(this, "安装时遇到问题：\n\n" + ex.Message, Text, MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                SetBusy(false);
            }
        }

        private void SetBusy(bool busy)
        {
            progress.Visible = busy;
            browseButton.Enabled = !busy && !installed;
            pathBox.Enabled = !busy && !installed;
            installButton.Enabled = !busy;
            cancelButton.Enabled = !busy;
            Cursor = busy ? Cursors.WaitCursor : Cursors.Default;
            Application.DoEvents();
        }

        private void CancelButton_Click(object sender, EventArgs e)
        {
            Close();
        }
    }
}
