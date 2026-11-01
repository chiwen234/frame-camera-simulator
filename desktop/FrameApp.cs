using System;
using System.Diagnostics;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Text;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace FrameCameraCompany
{
    internal static class Program
    {
        private static string cachedUserFolder;

        internal static string ResolveUserFolder()
        {
            if (!string.IsNullOrEmpty(cachedUserFolder)) return cachedUserFolder;
            string[] candidates = new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "FRAME-Camera-Simulator"),
                Path.Combine(Path.GetTempPath(), "FRAME-Camera-Simulator"),
                Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "user-data")
            };
            foreach (string candidate in candidates)
            {
                try
                {
                    Directory.CreateDirectory(candidate);
                    string probe = Path.Combine(candidate, ".write-test");
                    File.WriteAllText(probe, "ok", Encoding.UTF8);
                    File.Delete(probe);
                    cachedUserFolder = candidate;
                    return candidate;
                }
                catch { }
            }
            cachedUserFolder = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "user-data");
            return cachedUserFolder;
        }

        internal static void Log(string message)
        {
            try
            {
                string folder = ResolveUserFolder();
                Directory.CreateDirectory(folder);
                File.AppendAllText(Path.Combine(folder, "startup.log"),
                    DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture) + " " + message + Environment.NewLine,
                    Encoding.UTF8);
            }
            catch { }
        }

        [STAThread]
        private static void Main()
        {
            AppDomain.CurrentDomain.UnhandledException += delegate(object sender, UnhandledExceptionEventArgs args)
            {
                Log("UNHANDLED " + args.ExceptionObject);
            };
            Application.ThreadException += delegate(object sender, System.Threading.ThreadExceptionEventArgs args)
            {
                Log("THREAD " + args.Exception);
            };
            Application.SetUnhandledExceptionMode(UnhandledExceptionMode.CatchException);
            try
            {
                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
                MainForm form = new MainForm();
                Application.Run(form);
            }
            catch (Exception ex)
            {
                Log("MAIN " + ex);
                MessageBox.Show(ex.ToString(), "FRAME startup error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }

    internal sealed class MainForm : Form
    {
        private const string AppTitle = "FRAME · 相机公司模拟器";
        private readonly string appFolder;
        private readonly string userFolder;
        private readonly string stateFile;
        private WebView2 webView;
        private Label loading;
        private bool initializing;

        public MainForm()
        {
            appFolder = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "app");
            userFolder = Program.ResolveUserFolder();
            stateFile = Path.Combine(userFolder, "window-state.txt");
            Directory.CreateDirectory(userFolder);

            Text = AppTitle;
            BackColor = Color.FromArgb(11, 13, 11);
            ForeColor = Color.FromArgb(240, 237, 228);
            StartPosition = FormStartPosition.CenterScreen;
            MinimumSize = new Size(1024, 700);
            AutoScaleMode = AutoScaleMode.Dpi;
            KeyPreview = true;
            try { Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); } catch { }

            ApplySavedWindowState();
            BuildInterface();
            Load += MainForm_Load;
            FormClosing += MainForm_FormClosing;
            KeyDown += MainForm_KeyDown;
        }

        private void BuildInterface()
        {
            webView = new WebView2();
            webView.Dock = DockStyle.Fill;
            webView.DefaultBackgroundColor = Color.FromArgb(11, 13, 11);
            Controls.Add(webView);

            loading = new Label();
            loading.Dock = DockStyle.Fill;
            loading.BackColor = Color.FromArgb(11, 13, 11);
            loading.ForeColor = Color.FromArgb(216, 166, 90);
            loading.TextAlign = ContentAlignment.MiddleCenter;
            loading.Font = new Font("Microsoft YaHei UI", 12f, FontStyle.Regular, GraphicsUnit.Point);
            loading.Text = "FRAME\n正在启动影像工作室…";
            Controls.Add(loading);
            loading.BringToFront();
        }

        private async void MainForm_Load(object sender, EventArgs e)
        {
            initializing = true;
            try
            {
                if (!Directory.Exists(appFolder) || !File.Exists(Path.Combine(appFolder, "index.html")))
                {
                    throw new DirectoryNotFoundException("找不到游戏资源目录：\n" + appFolder);
                }

                string webViewData = Path.Combine(userFolder, "WebView2");
                Directory.CreateDirectory(webViewData);

                CoreWebView2EnvironmentOptions options = new CoreWebView2EnvironmentOptions();
                string debugPort = Environment.GetEnvironmentVariable("FRAME_WEBVIEW2_DEBUG_PORT");
                if (!string.IsNullOrWhiteSpace(debugPort))
                {
                    options.AdditionalBrowserArguments = "--remote-debugging-port=" + debugPort.Trim();
                }

                CoreWebView2Environment environment = await CoreWebView2Environment.CreateAsync(null, webViewData, options);
                await webView.EnsureCoreWebView2Async(environment);
                CoreWebView2 core = webView.CoreWebView2;

                core.Settings.IsStatusBarEnabled = false;
                core.Settings.AreDevToolsEnabled = false;
                core.Settings.AreDefaultContextMenusEnabled = false;
                core.Settings.IsZoomControlEnabled = false;
                core.Settings.IsSwipeNavigationEnabled = false;
                core.Settings.IsGeneralAutofillEnabled = false;
                core.Settings.IsPasswordAutosaveEnabled = false;

                core.SetVirtualHostNameToFolderMapping("frame.local", appFolder, CoreWebView2HostResourceAccessKind.Allow);

                core.NavigationStarting += delegate(object navSender, CoreWebView2NavigationStartingEventArgs navArgs)
                {
                    if (!navArgs.Uri.StartsWith("https://frame.local/", StringComparison.OrdinalIgnoreCase))
                    {
                        navArgs.Cancel = true;
                        OpenExternal(navArgs.Uri);
                    }
                };
                core.NewWindowRequested += delegate(object winSender, CoreWebView2NewWindowRequestedEventArgs winArgs)
                {
                    winArgs.Handled = true;
                    OpenExternal(winArgs.Uri);
                };
                core.DocumentTitleChanged += delegate
                {
                    Text = AppTitle;
                };
                core.NavigationCompleted += delegate(object navSender, CoreWebView2NavigationCompletedEventArgs navArgs)
                {
                    if (navArgs.IsSuccess)
                    {
                        loading.Visible = false;
                    }
                    else
                    {
                        loading.Text = "FRAME\n界面加载失败，请重新安装游戏。";
                    }
                };

                webView.Source = new Uri("https://frame.local/index.html");
            }
            catch (Exception ex)
            {
                Program.Log("LOAD ERROR " + ex);
                loading.Text = "FRAME\n无法启动游戏界面。";
                MessageBox.Show(
                    this,
                    "无法启动 FRAME 的游戏界面。\n\n" +
                    "请确认系统已安装 Microsoft Edge WebView2 Runtime，然后重新启动游戏。\n\n" +
                    "详细信息已写入：\n" + Path.Combine(Program.ResolveUserFolder(), "startup.log"),
                    AppTitle,
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
            finally
            {
                initializing = false;
            }
        }

        private static void OpenExternal(string uri)
        {
            if (string.IsNullOrWhiteSpace(uri)) return;
            if (uri.StartsWith("https://", StringComparison.OrdinalIgnoreCase) ||
                uri.StartsWith("http://", StringComparison.OrdinalIgnoreCase))
            {
                try { Process.Start(new ProcessStartInfo(uri) { UseShellExecute = true }); } catch { }
            }
        }

        private void MainForm_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.F11 && !initializing)
            {
                FormBorderStyle = FormBorderStyle == FormBorderStyle.None ? FormBorderStyle.Sizable : FormBorderStyle.None;
                WindowState = FormBorderStyle == FormBorderStyle.None ? FormWindowState.Maximized : FormWindowState.Normal;
                e.Handled = true;
            }
        }

        private void ApplySavedWindowState()
        {
            Rectangle work = Screen.PrimaryScreen.WorkingArea;
            int width = Math.Min(1600, Math.Max(1024, work.Width - 80));
            int height = Math.Min(1000, Math.Max(700, work.Height - 80));
            try
            {
                if (File.Exists(stateFile))
                {
                    string[] parts = File.ReadAllText(stateFile, Encoding.UTF8).Split(',');
                    int savedWidth, savedHeight;
                    if (parts.Length >= 2 && int.TryParse(parts[0], NumberStyles.Integer, CultureInfo.InvariantCulture, out savedWidth) &&
                        int.TryParse(parts[1], NumberStyles.Integer, CultureInfo.InvariantCulture, out savedHeight))
                    {
                        if (savedWidth >= 1024 && savedWidth <= 3200) width = savedWidth;
                        if (savedHeight >= 700 && savedHeight <= 2200) height = savedHeight;
                    }
                }
            }
            catch { }
            Size = new Size(width, height);
        }

        private void MainForm_FormClosing(object sender, FormClosingEventArgs e)
        {
            try
            {
                Rectangle bounds = WindowState == FormWindowState.Normal ? Bounds : RestoreBounds;
                File.WriteAllText(stateFile, bounds.Width.ToString(CultureInfo.InvariantCulture) + "," + bounds.Height.ToString(CultureInfo.InvariantCulture), Encoding.UTF8);
            }
            catch { }
        }


    }
}
