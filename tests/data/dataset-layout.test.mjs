import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const currentRoot = path.join(repoRoot, 'public', 'data', 'thaqalayn', 'current')

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'))
}

// Runtime artifacts live at <version>/runtime, resolved via the manifest — they
// are NOT under current/runtime. The website crawler relies on this to map
// freshly scraped hadiths back onto blessed legacy book ids; resolving the
// wrong path silently empties the map and corrupts every hadith with a
// fallback volume id. This guards that contract.
describe('blessed dataset layout the crawler depends on', () => {
  it('exposes a non-empty legacy source-URL map via the manifest version', async () => {
    const manifest = await readJson(path.join(currentRoot, 'manifest.json'))
    const runtimeDir = path.join(currentRoot, '..', manifest.version, 'runtime')

    const lookup = await readJson(path.join(runtimeDir, 'lookup.json'))
    const books = await readJson(path.join(runtimeDir, 'books.json'))

    expect(Object.keys(lookup.bySourceUrl ?? {}).length).toBeGreaterThan(0)
    expect(Array.isArray(books) && books.length).toBeGreaterThan(0)
  })
})
