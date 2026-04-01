param(
    [Parameter(Mandatory = $true)]
    [string]$TempFolder,

    [int]$OlderThanHours = 24
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $TempFolder)) {
    throw "Temp folder not found: $TempFolder"
}

$folderItem = Get-Item -LiteralPath $TempFolder
if (-not $folderItem.PSIsContainer) {
    throw "Path is not a folder: $TempFolder"
}

$threshold = (Get-Date).AddHours(-$OlderThanHours)

Get-ChildItem -LiteralPath $TempFolder -Force | Where-Object {
    $_.LastWriteTime -lt $threshold
} | ForEach-Object {
    Remove-Item -LiteralPath $_.FullName -Recurse -Force
}