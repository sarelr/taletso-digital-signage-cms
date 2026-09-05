[CmdletBinding()]
param(
  [string]$OutputPath = "C:\Projects\tdcp-phase2-candidate.tar.gz"
)

$ErrorActionPreference = "Stop"
$repository = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$output = [IO.Path]::GetFullPath($OutputPath)
if (-not $output.StartsWith("C:\Projects\")) { throw "The deployment archive must remain under C:\Projects." }

$files = @(git -C $repository ls-files --cached --others --exclude-standard | Where-Object { $_ -notmatch '^\.openai/' -and $_ -notmatch '^docs/architecture/' })
if ($LASTEXITCODE -ne 0 -or $files.Count -eq 0) { throw "Unable to enumerate the TDCP deployment files." }
$secretFiles = @($files | Where-Object { $_ -match '(^|/)\.env($|\.)' -and $_ -notmatch '(^|/)\.env\.example$' })
if ($secretFiles.Count -gt 0) { throw "Refusing to package local environment files: $($secretFiles -join ', ')" }

$listFile = Join-Path ([IO.Path]::GetTempPath()) ("tdcp-files-{0}.txt" -f [guid]::NewGuid())
try {
  [IO.File]::WriteAllLines($listFile, $files, [Text.UTF8Encoding]::new($false))
  & tar.exe -czf $output -C $repository -T $listFile
  if ($LASTEXITCODE -ne 0) { throw "tar failed with exit code $LASTEXITCODE." }
} finally {
  Remove-Item -LiteralPath $listFile -Force -ErrorAction SilentlyContinue
}

$archive = Get-Item -LiteralPath $output
$hash = Get-FileHash -LiteralPath $output -Algorithm SHA256
[pscustomobject]@{
  Archive = $archive.FullName
  Bytes = $archive.Length
  SHA256 = $hash.Hash
  Files = $files.Count
} | Format-List
