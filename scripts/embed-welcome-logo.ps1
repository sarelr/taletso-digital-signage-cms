[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$repository = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$svgPath = Join-Path $repository "player\phase2-candidate\media\taletso-welcome.svg"
$logoPath = Join-Path $repository "player\phase2-candidate\media\taletso-logo.jpg"

$svg = [IO.File]::ReadAllText($svgPath)
$logo = [Convert]::ToBase64String([IO.File]::ReadAllBytes($logoPath))
$embeddedHref = 'href="data:image/jpeg;base64,' + $logo + '"'

if ($svg -match 'href="taletso-logo\.jpg"') {
  $svg = $svg.Replace('href="taletso-logo.jpg"', $embeddedHref)
} elseif ($svg -match 'href="data:image/jpeg;base64,[^"]+"') {
  $svg = [Text.RegularExpressions.Regex]::Replace(
    $svg,
    'href="data:image/jpeg;base64,[^"]+"',
    $embeddedHref,
    1
  )
} else {
  throw "The Taletso welcome SVG does not contain the expected logo image reference."
}

[IO.File]::WriteAllText($svgPath, $svg, [Text.UTF8Encoding]::new($false))
Write-Output "Embedded the Taletso logo in the welcome SVG."
