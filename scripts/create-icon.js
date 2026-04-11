// Generates build/icon.ico from the Twemoji watermelon emoji (U+1F349).
// Uses PowerShell + System.Drawing for the resize — no extra npm packages.
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const buildDir = path.join(__dirname, '..', 'build')
fs.mkdirSync(buildDir, { recursive: true })

const sourcePng = path.join(buildDir, '_source.png')
const resizedPng = path.join(buildDir, '_resized.png')
const icoPath = path.join(buildDir, 'icon.ico')
const psPath = path.join(buildDir, '_icon.ps1')

const src = sourcePng.replace(/\\/g, '\\\\')
const dst = resizedPng.replace(/\\/g, '\\\\')

const psScript = `
$url = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f349.png"
Invoke-WebRequest -Uri $url -OutFile "${src}" -UseBasicParsing
Add-Type -AssemblyName System.Drawing
$srcImg = [System.Drawing.Image]::FromFile("${src}")
$out = New-Object System.Drawing.Bitmap(256, 256)
$g = [System.Drawing.Graphics]::FromImage($out)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($srcImg, 0, 0, 256, 256)
$g.Dispose()
$srcImg.Dispose()
$out.Save("${dst}", [System.Drawing.Imaging.ImageFormat]::Png)
$out.Dispose()
Write-Host "Resized PNG saved"
`

fs.writeFileSync(psPath, psScript)
try {
  execSync(`powershell -ExecutionPolicy Bypass -File "${psPath}"`, { stdio: 'inherit' })
} finally {
  try { fs.unlinkSync(psPath) } catch {}
  try { fs.unlinkSync(sourcePng) } catch {}
}

// Wrap the 256x256 PNG inside an ICO container.
// Windows ICO format supports embedded PNG data for 256x256 images.
const pngData = fs.readFileSync(resizedPng)
const pngSize = pngData.length
const buf = Buffer.alloc(6 + 16 + pngSize)
let o = 0

// ICO header (6 bytes)
buf.writeUInt16LE(0, o); o += 2   // reserved
buf.writeUInt16LE(1, o); o += 2   // type = ICO
buf.writeUInt16LE(1, o); o += 2   // image count = 1

// Image directory entry (16 bytes)
buf[o++] = 0    // width: 0 means 256
buf[o++] = 0    // height: 0 means 256
buf[o++] = 0    // palette colors (0 = no palette)
buf[o++] = 0    // reserved
buf.writeUInt16LE(1, o); o += 2   // color planes
buf.writeUInt16LE(32, o); o += 2  // bits per pixel
buf.writeUInt32LE(pngSize, o); o += 4
buf.writeUInt32LE(22, o); o += 4  // data offset = 6 + 16

// PNG data
pngData.copy(buf, o)

fs.writeFileSync(icoPath, buf)
try { fs.unlinkSync(resizedPng) } catch {}

console.log('Created:', icoPath)
