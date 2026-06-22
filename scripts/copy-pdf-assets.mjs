#!/usr/bin/env node
// Copies pdf.js runtime assets out of node_modules into public/pdf so the
// /scans viewer can render PDFs fully self-hosted (no CDN / external calls).
// Wired into `predev` and `prebuild`; output dir is gitignored. Copying from
// the installed package guarantees the worker version matches the API version.
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC_ROOT = path.join(REPO_ROOT, 'node_modules', 'pdfjs-dist')
const DEST_ROOT = path.join(REPO_ROOT, 'public', 'pdf')

// Worker is required. The asset directories are best-effort: cmaps/standard
// fonts cover non-embedded fonts; wasm/iccs cover JBIG2/JPEG2000/ICC decoding
// used by some scanned PDFs. Missing optional assets only degrade rendering.
const FILES = [['build/pdf.worker.min.mjs', 'pdf.worker.min.mjs']]
const DIRS = ['cmaps', 'standard_fonts', 'wasm', 'iccs']

async function copyFile(rel, destName) {
  const src = path.join(SRC_ROOT, rel)
  const dest = path.join(DEST_ROOT, destName)
  await fs.mkdir(path.dirname(dest), { recursive: true })
  await fs.copyFile(src, dest)
  return dest
}

async function copyDir(name) {
  const src = path.join(SRC_ROOT, name)
  const dest = path.join(DEST_ROOT, name)
  if (!(await fs.stat(src).catch(() => null))) return null
  await fs.rm(dest, { recursive: true, force: true })
  await fs.cp(src, dest, { recursive: true })
  return dest
}

async function main() {
  if (!(await fs.stat(SRC_ROOT).catch(() => null))) {
    console.error('pdfjs-dist not found in node_modules; run `yarn install` first.')
    process.exit(1)
  }

  for (const [rel, destName] of FILES) {
    await copyFile(rel, destName)
  }
  for (const dir of DIRS) {
    const result = await copyDir(dir)
    if (!result) console.warn(`pdfjs asset dir missing (skipped): ${dir}`)
  }

  // pdf.js' `*_nowasm_fallback.js` decoders (e.g. JBIG2) are ESM files that use
  // `import.meta`, but pdfjs-dist's package.json has no `"type": "module"`. The
  // server rasterizer ([lib/data/scan-raster.ts]) loads them via `import()` in the
  // Node runtime; without an explicit ESM marker, older Node (e.g. Vercel's) treats
  // the `.js` as CommonJS → "Cannot use 'import.meta' outside a module" → the decoder
  // silently fails and scanned pages render blank. Mark the copied wasm dir as ESM so
  // they load on any Node version.
  const wasmDir = path.join(DEST_ROOT, 'wasm')
  if (await fs.stat(wasmDir).catch(() => null)) {
    await fs.writeFile(path.join(wasmDir, 'package.json'), '{ "type": "module" }\n')
  }

  console.log(`Copied pdf.js assets to ${path.relative(REPO_ROOT, DEST_ROOT)}`)
}

main().catch((err) => {
  console.error('Failed to copy pdf.js assets:', err)
  process.exit(1)
})
