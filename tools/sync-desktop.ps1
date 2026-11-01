# FRAME — 把根目录的网页资源同步到桌面端 app 目录
# 用法：powershell -ExecutionPolicy Bypass -File tools\sync-desktop.ps1
#      -SkipAssets   不复制 assets（照片库没变化时用，快很多）

param(
  [switch]$SkipAssets
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$dest = Join-Path $root 'desktop-app\app'

if (-not (Test-Path (Join-Path $dest 'index.html'))) {
  # 首次构建时桌面端可能还没有 app 目录
  New-Item -ItemType Directory -Path $dest -Force | Out-Null
}

Write-Host "源目录: $root"
Write-Host "目标目录: $dest"
Write-Host ''

$copied = 0
function Sync-Item([string]$rel) {
  $src = Join-Path $root $rel
  if (-not (Test-Path $src)) { return }
  $dst = Join-Path $dest $rel
  $dstDir = Split-Path -Parent $dst
  if (-not (Test-Path $dstDir)) { New-Item -ItemType Directory -Path $dstDir -Force | Out-Null }
  $needCopy = $true
  if (Test-Path $dst) {
    $a = Get-Item $src
    $b = Get-Item $dst
    if ($a.Length -eq $b.Length -and $a.LastWriteTimeUtc -le $b.LastWriteTimeUtc) { $needCopy = $false }
  }
  if ($needCopy) {
    Copy-Item -LiteralPath $src -Destination $dst -Force
    $script:copied++
    Write-Host ("  + {0}" -f $rel)
  }
}

# 入口
Sync-Item 'index.html'

# js / css
Get-ChildItem (Join-Path $root 'js') -File -Filter '*.js' | ForEach-Object {
  Sync-Item (Join-Path 'js' $_.Name)
}
Get-ChildItem (Join-Path $root 'css') -File -Filter '*.css' | ForEach-Object {
  Sync-Item (Join-Path 'css' $_.Name)
}

# 照片库（体积大，可选）
if (-not $SkipAssets) {
  $assetsSrc = Join-Path $root 'assets'
  if (Test-Path $assetsSrc) {
    $n = 0
    Get-ChildItem $assetsSrc -File -Recurse | ForEach-Object {
      $rel = $_.FullName.Substring($root.Length + 1)
      Sync-Item $rel
      $n++
    }
    Write-Host ("  assets 检查 {0} 个文件" -f $n)
  }
} else {
  Write-Host '  (已跳过 assets)'
}

Write-Host ''
if ($copied -eq 0) {
  Write-Host '桌面端已是最新，无需复制。' -ForegroundColor Green
} else {
  Write-Host ("完成：复制 {0} 个文件。" -f $copied) -ForegroundColor Green
}

# 简单校验：桌面端是否覆盖了根目录所有脚本
$missing = @()
Get-ChildItem (Join-Path $root 'js') -File -Filter '*.js' | ForEach-Object {
  if (-not (Test-Path (Join-Path $dest ('js\' + $_.Name)))) { $missing += $_.Name }
}
if ($missing.Count) {
  Write-Host ("警告：桌面端仍缺少 {0}" -f ($missing -join ', ')) -ForegroundColor Yellow
  exit 1
}

# 校验 index.html 引用的脚本都存在
$html = Get-Content (Join-Path $dest 'index.html') -Raw
$refs = [regex]::Matches($html, 'src="(js/[^"?]+)') | ForEach-Object { $_.Groups[1].Value }
$refMissing = $refs | Where-Object { -not (Test-Path (Join-Path $dest ($_ -replace '/','\'))) }
if ($refMissing) {
  Write-Host ("错误：index.html 引用了不存在的文件：{0}" -f ($refMissing -join ', ')) -ForegroundColor Red
  exit 1
}
Write-Host ("index.html 引用的 {0} 个脚本均已就位。" -f $refs.Count) -ForegroundColor Green
