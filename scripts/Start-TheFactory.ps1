# The Factory 2.0 — local development launcher
# Compatible with Windows PowerShell 5.1 and PowerShell 7.
$ErrorActionPreference = 'Stop'
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$Port = 3000
$BaseUrl = "http://127.0.0.1:$Port"
$StatusUrl = "$BaseUrl/api/status"

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "       THE FACTORY 2.0 — LOCAL RUNTIME" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "Project: $ProjectRoot"
Write-Host "URL:     $BaseUrl"
Write-Host ""

if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) {
    throw "Node.js is not installed or node.exe is not on PATH. Install Node.js LTS, reopen PowerShell, and run this script again."
}
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue) -and -not (Get-Command npm.exe -ErrorAction SilentlyContinue)) {
    throw "npm was not found on PATH. Repair/reinstall Node.js LTS, reopen PowerShell, and run this script again."
}

# If the app already answers on port 3000, reuse it instead of starting a duplicate.
try {
    $existing = Invoke-RestMethod -Uri $StatusUrl -TimeoutSec 2
    if ($existing) {
        Write-Host "The Factory is already responding on port $Port." -ForegroundColor Green
        Start-Process $BaseUrl
        return
    }
} catch {
    # No healthy Factory instance is responding; continue with startup checks.
}

$listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($listener) {
    throw "Port $Port is already in use by another process, but it did not answer at $StatusUrl. Stop that process or change the server port before retrying."
}

if (-not (Test-Path (Join-Path $ProjectRoot 'node_modules'))) {
    Write-Host "Installing dependencies (first run only)..." -ForegroundColor Yellow
    Push-Location $ProjectRoot
    try {
        & npm.cmd install
        if ($LASTEXITCODE -ne 0) { throw "npm install failed with exit code $LASTEXITCODE." }
    } finally {
        Pop-Location
    }
}

# Start the server in a separate PowerShell window so this launcher remains usable.
$escapedRoot = $ProjectRoot.Replace("'", "''")
$childCommand = "Set-Location -LiteralPath '$escapedRoot'; npm.cmd run dev"
Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', $childCommand) -WorkingDirectory $ProjectRoot

Write-Host "Waiting for the API to become healthy..." -ForegroundColor Yellow
$healthy = $false
for ($attempt = 0; $attempt -lt 45; $attempt++) {
    Start-Sleep -Seconds 1
    try {
        $response = Invoke-RestMethod -Uri $StatusUrl -TimeoutSec 2
        if ($response.status -eq 'ok') {
            $healthy = $true
            break
        }
    } catch {
        # Server is still starting.
    }
}

if (-not $healthy) {
    Write-Host "Startup was not confirmed within 45 seconds." -ForegroundColor Red
    Write-Host "Inspect the separate server window for dependency, configuration, or runtime errors."
    Write-Host "Expected health endpoint: $StatusUrl"
    exit 1
}

Write-Host ""
Write-Host "The Factory API is healthy." -ForegroundColor Green
Write-Host "Web application: $BaseUrl"
Write-Host "Health endpoint: $StatusUrl"
Start-Process $BaseUrl
