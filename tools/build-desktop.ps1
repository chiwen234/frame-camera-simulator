# 重新编译桌面端（带 DPI 清单，保证高分屏清晰）
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$desk = Join-Path $root 'desktop'
$out = Join-Path $root 'desktop-app\FRAME.exe'

$csc = 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (-not (Test-Path $csc)) { $csc = 'C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe' }
if (-not (Test-Path $csc)) { throw '找不到 csc.exe' }

Get-Process -Name FRAME -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Milliseconds 800

$refs = @(
  (Join-Path $root 'desktop-app\Microsoft.Web.WebView2.Core.dll'),
  (Join-Path $root 'desktop-app\Microsoft.Web.WebView2.WinForms.dll')
)

& $csc /nologo /target:winexe /platform:anycpu /optimize+ `
  "/out:$out" `
  "/win32manifest:$desk\app.manifest" `
  /r:"$($refs[0])" /r:"$($refs[1])" `
  /r:System.dll /r:System.Drawing.dll /r:System.Windows.Forms.dll /r:System.Core.dll `
  /r:System.Net.Http.dll /r:System.Runtime.Serialization.dll `
  "$desk\FrameApp.cs"

if (-not (Test-Path $out)) { throw '编译失败' }
Write-Host ("编译完成: {0} ({1} 字节)" -f $out, (Get-Item $out).Length)
