$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$HostPy = Join-Path $Root "host.py"
$ManifestSrc = Join-Path $Root "com.localai.launcher.json"
$ManifestDir = Join-Path $env:LOCALAPPDATA "Google\Chrome\User Data\NativeMessagingHosts"
$ManifestDst = Join-Path $ManifestDir "com.localai.launcher.json"

if (-not (Test-Path $HostPy)) { throw "host.py not found" }
if (-not $args[0]) { throw "Usage: install-win.ps1 <EXTENSION_ID>" }

$ExtId = $args[0]
New-Item -Force -ItemType Directory -Path $ManifestDir | Out-Null

$content = Get-Content $ManifestSrc -Raw
$content = $content.Replace("REPLACE_WITH_ABSOLUTE_PATH_TO_host.py", $HostPy.Replace("\", "\\"))
$content = $content.Replace("REPLACE_WITH_EXTENSION_ID", $ExtId)
Set-Content -Path $ManifestDst -Value $content -Encoding UTF8

$regPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.localai.launcher"
New-Item -Force -Path $regPath | Out-Null
New-ItemProperty -Path $regPath -Name "(Default)" -Value $ManifestDst -PropertyType String -Force | Out-Null

Write-Host "Installed native host manifest:"
Write-Host $ManifestDst
