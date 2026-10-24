param([string]$Installer = (Join-Path $PSScriptRoot '..\dist\BattleBotsSetup.exe'))
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$existing = Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*' -ErrorAction SilentlyContinue |
  Where-Object { $_.DisplayName -like 'Battle Bots*' }
if ($existing) { throw 'Battle Bots is already installed. Run this check on a clean Windows account to avoid changing an existing installation.' }
$target = Join-Path $root ('test-results\installed-' + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())
New-Item -ItemType Directory -Force (Split-Path $target) | Out-Null
$process = Start-Process -FilePath ([IO.Path]::GetFullPath($Installer)) -ArgumentList "/S /D=$target" -WindowStyle Hidden -PassThru -Wait
if ($process.ExitCode -ne 0) { throw "Installer failed: $($process.ExitCode)" }
$exe = Join-Path $target 'BattleBots.exe'
if (!(Test-Path -LiteralPath $exe)) { throw 'Installed executable is missing' }
try {
  node (Join-Path $PSScriptRoot 'smoke-test.js') $exe
  if ($LASTEXITCODE -ne 0) { throw 'Installed desktop test failed' }
  $entry = Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*' -ErrorAction SilentlyContinue |
    Where-Object { $_.DisplayName -like 'Battle Bots*' }
  if (!$entry) { throw 'Windows uninstall registration is missing' }
  Write-Output "Installed version: $($entry.DisplayVersion)"
  $desktop = Join-Path ([Environment]::GetFolderPath('Desktop')) 'Battle Bots.lnk'
  $start = Join-Path ([Environment]::GetFolderPath('Programs')) 'Battle Bots.lnk'
  if (!(Test-Path -LiteralPath $desktop)) { throw 'Desktop shortcut is missing' }
  if (!(Test-Path -LiteralPath $start)) { throw 'Start menu shortcut is missing' }
  Write-Output 'Desktop and Start menu shortcuts verified'
} finally {
  $uninstaller = Join-Path $target 'Uninstall BattleBots.exe'
  if (Test-Path -LiteralPath $uninstaller) {
    $remove = Start-Process -FilePath $uninstaller -ArgumentList '/S' -WindowStyle Hidden -PassThru -Wait
    if ($remove.ExitCode -ne 0) { throw "Uninstaller failed: $($remove.ExitCode)" }
    for ($attempt = 0; $attempt -lt 100 -and (Test-Path -LiteralPath $exe); $attempt++) { Start-Sleep -Milliseconds 200 }
    if (Test-Path -LiteralPath $exe) { throw 'Uninstaller did not remove the installed executable' }
    Write-Output 'Uninstall verified'
  }
}
Write-Output 'Windows installer lifecycle test passed'
