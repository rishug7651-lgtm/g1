$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDirectory = Split-Path -Parent $scriptDirectory
$sourceDirectory = Join-Path $projectDirectory "frontend\public\photos"
$optimizedDirectory = Join-Path $sourceDirectory "optimized"
$manifestPath = Join-Path $projectDirectory "shared\mediaVariants.js"
$targetWidths = @(160, 320, 640, 960)
$quality = 72L

if (-not (Test-Path -LiteralPath $sourceDirectory -PathType Container)) {
  throw "Photo directory not found: $sourceDirectory"
}

$sourceFullPath = [System.IO.Path]::GetFullPath($sourceDirectory).TrimEnd("\")
$optimizedFullPath = [System.IO.Path]::GetFullPath($optimizedDirectory)
if (-not $optimizedFullPath.StartsWith(
    $sourceFullPath + "\",
    [System.StringComparison]::OrdinalIgnoreCase
  )) {
  throw "Generated photo output must stay inside the public photos directory."
}

[void][System.IO.Directory]::CreateDirectory($optimizedDirectory)
foreach ($existingFile in Get-ChildItem -LiteralPath $optimizedDirectory -File) {
  if ($existingFile.Name -notmatch '^[a-zA-Z0-9_-]+\.[a-f0-9]{10}-\d+\.jpg$') {
    throw "Unexpected file in generated image directory: $($existingFile.FullName)"
  }
  Remove-Item -LiteralPath $existingFile.FullName -Force
}

$jpegEncoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq "image/jpeg" } |
  Select-Object -First 1
$jpegQualityEncoder = [System.Drawing.Imaging.Encoder]::Quality
$encoderParameters = [System.Drawing.Imaging.EncoderParameters]::new(1)
$encoderParameters.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new(
  $jpegQualityEncoder,
  $quality
)

$manifestLines = [System.Collections.Generic.List[string]]::new()
$manifestLines.Add("export const mediaVariants = Object.freeze({")
$generatedCount = 0
$sourceBytes = 0L
$outputBytes = 0L
$images = Get-ChildItem -LiteralPath $sourceDirectory -File |
  Where-Object { $_.Extension -match "^\.jpe?g$" } |
  Sort-Object Name

foreach ($file in $images) {
  $sourceBytes += $file.Length
  $version = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.Substring(0, 10).ToLowerInvariant()
  $sourceImage = [System.Drawing.Image]::FromFile($file.FullName)
  $graphics = $null

  try {
    try {
      $orientation = [int]$sourceImage.GetPropertyItem(0x0112).Value[0]
      switch ($orientation) {
        2 { $sourceImage.RotateFlip([System.Drawing.RotateFlipType]::RotateNoneFlipX) }
        3 { $sourceImage.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone) }
        4 { $sourceImage.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipX) }
        5 { $sourceImage.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipX) }
        6 { $sourceImage.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
        7 { $sourceImage.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipX) }
        8 { $sourceImage.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
      }
    } catch {
      # Some images do not contain EXIF orientation metadata.
    }

    $sourceWidth = $sourceImage.Width
    $actualWidths = @($targetWidths | Where-Object { $_ -le $sourceWidth })
    if ($actualWidths.Count -eq 0) { $actualWidths = @($sourceWidth) }

    $nameWithExtension = [System.IO.Path]::GetFileName($file.Name).Replace(".", "-")

    foreach ($targetWidth in $actualWidths) {
      $targetHeight = [int][Math]::Round($sourceImage.Height * ($targetWidth / [double]$sourceWidth))
      $targetHeight = [Math]::Max(1, $targetHeight)
      $outputFileName = "$nameWithExtension.$version-$targetWidth.jpg"
      $outputPath = Join-Path $optimizedDirectory $outputFileName
      $bitmap = [System.Drawing.Bitmap]::new(
        $targetWidth,
        $targetHeight,
        [System.Drawing.Imaging.PixelFormat]::Format24bppRgb
      )
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

      try {
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.DrawImage($sourceImage, 0, 0, $targetWidth, $targetHeight)

        if (Test-Path -LiteralPath $outputPath -PathType Leaf) {
          Remove-Item -LiteralPath $outputPath -Force
        }
        $bitmap.Save($outputPath, $jpegEncoder, $encoderParameters)
        $outputBytes += (Get-Item -LiteralPath $outputPath).Length
        $generatedCount += 1
      } finally {
        $graphics.Dispose()
        $graphics = $null
        $bitmap.Dispose()
      }
    }

    $widthList = $actualWidths -join ", "
    $manifestKey = ConvertTo-Json -InputObject $file.Name -Compress
    $manifestVersion = ConvertTo-Json -InputObject $version -Compress
    $manifestLines.Add("  $manifestKey`: Object.freeze({")
    $manifestLines.Add("    version: $manifestVersion,")
    $manifestLines.Add("    widths: Object.freeze([$widthList]),")
    $manifestLines.Add("  }),")
  } finally {
    if ($graphics) { $graphics.Dispose() }
    $sourceImage.Dispose()
  }
}

$manifestLines.Add("});")
$manifestText = $manifestLines -join [System.Environment]::NewLine
[System.IO.File]::WriteAllText(
  $manifestPath,
  $manifestText + [System.Environment]::NewLine,
  [System.Text.UTF8Encoding]::new($false)
)

Write-Output "Optimized $($images.Count) photos into $generatedCount responsive JPEGs."
Write-Output "Source photos: $([Math]::Round($sourceBytes / 1MB, 2)) MB; generated variants: $([Math]::Round($outputBytes / 1MB, 2)) MB."
