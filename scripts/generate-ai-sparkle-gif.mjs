/**
 * Generates a transparent animated GIF of the two-star AI sparkle (violet→pink gradient).
 * Developer handoff: src/assets/ai-sparkle-icon-animated.gif
 *
 * Run:
 *   PUPPETEER_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
 *     node scripts/generate-ai-sparkle-gif.mjs
 *
 * In React/CSS, prefer the mask approach (no raster asset, always sharp):
 *   <span class="ai-gradient-icon size-4" style={{ maskImage: `url(${icon})` }} />
 * with icon-agents-two-star-sparkle.svg — see SideNav.tsx.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer'
import gifenc from 'gifenc'
const { GIFEncoder, quantize, applyPalette } = gifenc
import { PNG } from 'pngjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const svgPath = join(root, 'src/assets/icon-agents-two-star-sparkle.svg')
const outPath = join(root, 'src/assets/ai-sparkle-icon-animated.gif')

const maskSvg = readFileSync(svgPath, 'utf8')
const maskDataUrl = `data:image/svg+xml;base64,${Buffer.from(maskSvg).toString('base64')}`

const SIZE = 128
const SCALE = 2
const FRAME_COUNT = 48
const FRAME_DELAY_MS = 83
const QUANTIZE_FORMAT = 'rgba4444'

const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: ${SIZE}px; height: ${SIZE}px;
      background: transparent;
    }
    body {
      display: flex; align-items: center; justify-content: center;
    }
    .ai-gradient-icon {
      display: inline-block;
      width: 96px;
      height: 96px;
      background: linear-gradient(90deg, #ec4899, #a855f7, #6366f1, #a855f7, #ec4899);
      background-size: 300% 100%;
      -webkit-mask-size: contain;
      mask-size: contain;
      -webkit-mask-repeat: no-repeat;
      mask-repeat: no-repeat;
      -webkit-mask-position: center;
      mask-position: center;
      -webkit-mask-image: url("${maskDataUrl}");
      mask-image: url("${maskDataUrl}");
    }
  </style>
</head>
<body>
  <span id="icon" class="ai-gradient-icon" aria-hidden="true"></span>
</body>
</html>`

function gradientPosition(progress) {
  return progress < 0.5 ? progress * 2 * 100 : (1 - (progress - 0.5) * 2) * 100
}

const browser = await puppeteer.launch({
  headless: true,
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
})
const page = await browser.newPage()
await page.setViewport({ width: SIZE, height: SIZE, deviceScaleFactor: SCALE })
await page.setContent(html, { waitUntil: 'networkidle0' })

const gif = GIFEncoder()
let width = 0
let height = 0

for (let i = 0; i < FRAME_COUNT; i++) {
  const pos = gradientPosition(i / FRAME_COUNT)
  await page.evaluate((position) => {
    const icon = document.getElementById('icon')
    if (icon) icon.style.backgroundPosition = `${position}% 50%`
  }, pos)
  await new Promise((r) => setTimeout(r, 16))
  const pngBuffer = await page.screenshot({ type: 'png', omitBackground: true })
  const png = PNG.sync.read(Buffer.from(pngBuffer))
  width = png.width
  height = png.height
  const palette = quantize(png.data, 256, {
    format: QUANTIZE_FORMAT,
    oneBitAlpha: true,
    clearAlpha: true,
    clearAlphaThreshold: 128,
  })
  const index = applyPalette(png.data, palette, QUANTIZE_FORMAT)
  gif.writeFrame(index, width, height, {
    palette,
    delay: FRAME_DELAY_MS,
    transparent: true,
    transparentIndex: 0,
    dispose: 2,
  })
}

gif.finish()
await browser.close()

writeFileSync(outPath, Buffer.from(gif.bytes()))
console.log(`Wrote ${outPath} (${width}x${height}, ${FRAME_COUNT} frames, transparent)`)
