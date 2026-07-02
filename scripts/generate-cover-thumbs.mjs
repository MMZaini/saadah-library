#!/usr/bin/env node
// Generates WebP thumbnails for the homepage cover images using the already
// present @napi-rs/canvas dependency. The source JPEGs are up to ~400 KB but
// render at 80–180 px wide, so the grid ships resized variants instead.
//
// Output: public/covers/thumbs/<name>-<width>w.webp (committed, tiny).
// Re-run after adding or changing covers: node scripts/generate-cover-thumbs.mjs
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createCanvas, loadImage } from '@napi-rs/canvas'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC_DIR = path.join(REPO_ROOT, 'public', 'covers')
const OUT_DIR = path.join(SRC_DIR, 'thumbs')
const WIDTHS = [160, 360]
const QUALITY = 80

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true })
  const files = (await fs.readdir(SRC_DIR)).filter((name) => /\.(jpe?g|png)$/i.test(name))

  for (const name of files) {
    const image = await loadImage(path.join(SRC_DIR, name))
    const base = name.replace(/\.(jpe?g|png)$/i, '')

    for (const width of WIDTHS) {
      const scale = Math.min(1, width / image.width)
      const w = Math.round(image.width * scale)
      const h = Math.round(image.height * scale)
      const canvas = createCanvas(w, h)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(image, 0, 0, w, h)
      const out = path.join(OUT_DIR, `${base}-${width}w.webp`)
      await fs.writeFile(out, canvas.toBuffer('image/webp', QUALITY))
    }
    console.log(`thumbs: ${base} (${WIDTHS.join('/')}w)`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
