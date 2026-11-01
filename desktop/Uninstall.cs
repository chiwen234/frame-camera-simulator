using System;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Windows.Forms;
using Microsoft.Win32;

namespace FrameCameraCompany
{
    internal static class UninstallProgram
    {
        private const string AppTitle = "FRAME · 相机公司模拟器";
        private const string RegistryKeyPath = @"Software\Microsoft\Windows\CurrentVersion\Uninstall\FRAME_Camera_Simulator";

        [STAThread]
        private static void Main(string[] args)
        {
            bool silent = HasArg(args, "/S") || HasArg(args, "/SILENT");
            string installDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            string appExe = Path.Combine(installDir, "FRAME.exe");

            if (!File.Exists(appExe))
            {
                if (!silent) MessageBox.Show("找不到 FRAME 安装目录，无法卸载。", AppTitle, MessageBoxButtons.OK, MessageBoxIcon.Error);
                Environment.ExitCode = 2;
                return;
            }

            Process[] running = Process.GetProcessesByName("FRAME");
            if (running.Length > 0)
            {
                if (!silent) MessageBox.Show("请先关闭 FRAME，再运行卸载程序。", AppTitle, MessageBoxButtons.OK, MessageBoxIcon.Warning);
                Environment.ExitCode = 3;
                return;
            }

            if (!silent)
            {
                DialogResult answer = MessageBox.Show(
                    "确定要从这台电脑卸载 FRAME 吗？\n\n桌面快捷方式和开始菜单项会被移除。\n本地存档会保留在：\n" +
                    Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "FRAME-Camera-Simulator"),
                    AppTitle, MessageBoxButtons.YesNo, MessageBoxIcon.Question, MessageBoxDefaultButton.Button2);
                if (answer != DialogResult.Yes) return;
            }

            try
            {
                RemoveShortcut(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "FRAME 相机公司模拟器.lnk"));
                string startFolder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs), "FRAME");
                RemoveShortcut(Path.Combine(startFolder, "FRAME 相机公司模拟器.lnk"));
                RemoveShortcut(Path.Combine(startFolder, "卸载 FRAME.lnk"));
                try { if (Directory.Exists(startFolder)) Directory.Delete(startFolder, true); } catch { }

                try { Registry.CurrentUser.DeleteSubKeyTree(RegistryKeyPath, false); } catch { }

                string self = Path.Combine(installDir, "Uninstall.exe");
                foreach (string file in Directory.GetFiles(installDir))
                {
                    if (string.Equals(file, self, StringComparison.OrdinalIgnoreCase)) continue;
                    try { File.SetAttributes(file, FileAttributes.Normal); File.Delete(file); } catch { }
                }
                foreach (string sub in Directory.GetDirectories(installDir))
                {
                    try { Directory.Delete(sub, true); } catch { }
                }

                string command = "/c timeout /t 2 /nobreak >nul & rmdir /s /q \"" + installDir + "\"";
                ProcessStartInfo cleanup = new ProcessStartInfo("cmd.exe", command);
                cleanup.UseShellExecute = false;
                cleanup.CreateNoWindow = true;
                Process.Start(cleanup);

                if (!silent)
                {
                    MessageBox.Show(
                        "FRAME 已从这台电脑卸载。\n\n本地存档仍然保留在：\n" +
                        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "FRAME-Camera-Simulator"),
                        AppTitle, MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
            }
            catch (Exception ex)
            {
                if (!silent) MessageBox.Show("卸载时遇到问题：\n" + ex.Message, AppTitle, MessageBoxButtons.OK, MessageBoxIcon.Error);
                Environment.ExitCode = 1;
            }
        }

        private static bool HasArg(string[] args, string value)
        {
            foreach (string arg in args)
            {
                if (string.Equals(arg, value, StringComparison.OrdinalIgnoreCase)) return true;
            }
            return false;
        }

        private static void RemoveShortcut(string path)
        {
            try { if (File.Exists(path)) File.Delete(path); } catch { }
        }
    }
}
