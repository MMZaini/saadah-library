import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const publicRoot = path.join(repoRoot, 'public', 'data', 'thaqalayn')
const releasesRoot = path.join(repoRoot, 'data', 'thaqalayn', 'releases')

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'))
}

async function listFilesRecursive(dir, prefix = '') {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursive(path.join(dir, entry.name), rel)))
    } else {
      files.push(rel)
    }
  }
  return files.sort()
}

async function sha256(filePath) {
  return createHash('sha256')
    .update(await readFile(filePath))
    .digest('hex')
}

// `yarn data:validate` deeply validates the release under data/thaqalayn/releases,
// but the app serves the COPY under public/data/thaqalayn. This suite pins the
// served copy to the validated release, so silent corruption, a partial copy, or
// an accidental edit of any served artifact fails CI instead of shipping.
//
// (Deliberately compares against the release files, not manifest.checksums — the
// recorded checksums are stale for the search shards, which were regenerated
// in-place after the manifest was stamped.)
// NOTE: this deliberately keys everything off the PUBLIC current manifest, not
// data/thaqalayn/current.json — the data-update workflow repoints that pointer
// at an unblessed candidate release while public/ stays on the blessed version,
// and that divergence is the intended review state, not an error.
describe('public runtime dataset matches the validated release', () => {
  it('serves a byte-identical copy of every release runtime artifact', async () => {
    const manifest = await readJson(path.join(publicRoot, 'current', 'manifest.json'))
    const releaseRuntime = path.join(releasesRoot, manifest.version, 'runtime')
    const publicRuntime = path.join(publicRoot, manifest.version, 'runtime')

    const releaseFiles = await listFilesRecursive(releaseRuntime)
    const publicFiles = await listFilesRecursive(publicRuntime)
    expect(releaseFiles.length).toBeGreaterThan(0)
    expect(publicFiles).toEqual(releaseFiles)

    const mismatches = []
    for (const rel of releaseFiles) {
      const [expected, actual] = await Promise.all([
        sha256(path.join(releaseRuntime, rel)),
        sha256(path.join(publicRuntime, rel)),
      ])
      if (expected !== actual) mismatches.push(rel)
    }

    expect(mismatches).toEqual([])
  }, 60_000)
})
