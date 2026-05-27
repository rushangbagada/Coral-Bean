# WeMakeDevs Pirates of the Coral-bean: Coral Installation Script
# This script downloads the native Windows x86_64 Coral release, expands it,
# and configures an isolated local workspace directory for configuration.

$ErrorActionPreference = "Stop"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "Installing Coral Query Engine Locally..." -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# 1. Create Directories
$BinDir = Join-Path $PSScriptRoot ".coral-bin"
$ConfigDir = Join-Path $PSScriptRoot ".coral-config"

if (-not (Test-Path $BinDir)) {
    Write-Host "Creating bin directory: $BinDir..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path $BinDir | Out-Null
}

if (-not (Test-Path $ConfigDir)) {
    Write-Host "Creating config directory: $ConfigDir..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path $ConfigDir | Out-Null
}

# 2. Download ZIP
$ZipPath = Join-Path $BinDir "coral-windows.zip"
$DownloadUrl = "https://github.com/withcoral/coral/releases/latest/download/coral-x86_64-pc-windows-msvc.zip"

Write-Host "Downloading Coral from $DownloadUrl..." -ForegroundColor Yellow
Invoke-WebRequest -Uri $DownloadUrl -OutFile $ZipPath

# 3. Extract ZIP
Write-Host "Extracting archive..." -ForegroundColor Yellow
$TempExtract = Join-Path $BinDir "temp_extract"
if (Test-Path $TempExtract) {
    Remove-Item -Recurse -Force $TempExtract | Out-Null
}
Expand-Archive -Path $ZipPath -DestinationPath $TempExtract -Force

# Locate coral.exe in extracted contents (could be in a subdirectory or root of extract)
$ExeSource = Get-ChildItem -Path $TempExtract -Filter "coral.exe" -Recurse | Select-Object -First 1

if ($null -eq $ExeSource) {
    throw "Error: coral.exe not found in extracted archive."
}

# Copy coral.exe to target bin folder
$DestExe = Join-Path $BinDir "coral.exe"
Write-Host "Installing coral.exe to $DestExe..." -ForegroundColor Yellow
Copy-Item $ExeSource.FullName -Destination $DestExe -Force

# Cleanup temp files
Write-Host "Cleaning up temporary files..." -ForegroundColor Yellow
Remove-Item -Force $ZipPath
Remove-Item -Recurse -Force $TempExtract

# 4. Verify Installation
Write-Host "Verifying Coral CLI installation..." -ForegroundColor Green
$env:CORAL_CONFIG_DIR = $ConfigDir

# Check version
$Version = & $DestExe --version
Write-Host "Installed: $Version" -ForegroundColor Green

# Discovered sources
Write-Host "`nDiscovered Coral sources:" -ForegroundColor Cyan
& $DestExe source discover

Write-Host "`n==============================================" -ForegroundColor Green
Write-Host "Coral Query Engine installation complete!" -ForegroundColor Green
Write-Host "Config Dir: $ConfigDir" -ForegroundColor Green
Write-Host "Bin Location: $DestExe" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
