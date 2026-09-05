[CmdletBinding()]
param(
  [string]$OutputPath = "C:\Projects\Taletso-TDCP\test-assets\taletso-welcome-preview.png"
)

Add-Type -AssemblyName System.Drawing
$canvas = [Drawing.Bitmap]::new(1920, 1080)
$graphics = [Drawing.Graphics]::FromImage($canvas)
$graphics.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [Drawing.Text.TextRenderingHint]::AntiAliasGridFit

try {
  $graphics.Clear([Drawing.Color]::FromArgb(17, 17, 17))
  $gold = [Drawing.Color]::FromArgb(242, 183, 5)
  $white = [Drawing.Color]::White
  $green = [Drawing.Color]::FromArgb(216, 243, 223)
  $borderPen = [Drawing.Pen]::new($gold, 10)
  $graphics.DrawRectangle($borderPen, 42, 42, 1836, 996)

  $logo = [Drawing.Image]::FromFile("C:\Projects\Taletso-TDCP\public\taletso-logo.jpg")
  try {
    $graphics.FillEllipse([Drawing.Brushes]::White, 758, 104, 404, 404)
    $graphics.DrawEllipse($borderPen, 758, 104, 404, 404)
    $graphics.DrawImage($logo, [Drawing.RectangleF]::new(766, 112, 388, 388))
  } finally { $logo.Dispose() }

  $center = [Drawing.StringFormat]::new()
  $center.Alignment = [Drawing.StringAlignment]::Center
  $collegeFont = [Drawing.Font]::new("Arial", 76, [Drawing.FontStyle]::Bold)
  $platformFont = [Drawing.Font]::new("Arial", 46, [Drawing.FontStyle]::Bold)
  $mottoFont = [Drawing.Font]::new("Arial", 32, [Drawing.FontStyle]::Regular)
  $goldBrush = [Drawing.SolidBrush]::new($gold)
  $greenBrush = [Drawing.SolidBrush]::new($green)
  try {
    $graphics.DrawString("TALETSO TVET COLLEGE", $collegeFont, [Drawing.Brushes]::White, [Drawing.RectangleF]::new(100, 580, 1720, 120), $center)
    $graphics.FillRectangle($goldBrush, 410, 700, 1100, 5)
    $graphics.DrawString("DIGITAL COMMUNICATIONS PLATFORM", $platformFont, $goldBrush, [Drawing.RectangleF]::new(100, 755, 1720, 90), $center)
    $graphics.DrawString("Growing skilled people for a better future.", $mottoFont, $greenBrush, [Drawing.RectangleF]::new(100, 875, 1720, 70), $center)
  } finally {
    $collegeFont.Dispose(); $platformFont.Dispose(); $mottoFont.Dispose()
    $goldBrush.Dispose(); $greenBrush.Dispose(); $center.Dispose(); $borderPen.Dispose()
  }

  $canvas.Save($OutputPath, [Drawing.Imaging.ImageFormat]::Png)
} finally {
  $graphics.Dispose()
  $canvas.Dispose()
}
