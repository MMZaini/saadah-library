import { access, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const dataRoot = path.join(repoRoot, 'data', 'rijal', 'khoei')
const publicDataRoot = path.join(repoRoot, 'public', 'data', 'rijal', 'khoei')

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'))
}

async function pathExists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function getCurrentManifest() {
  const current = await readJson(path.join(dataRoot, 'current.json'))
  return readJson(path.join(dataRoot, 'releases', current.version, 'manifest.json'))
}

async function getCurrentRuntimeDir() {
  const current = await readJson(path.join(dataRoot, 'current.json'))
  return path.join(dataRoot, 'releases', current.version, 'runtime')
}

describe('Khoei rijal runtime dataset layout', () => {
  it('resolves current manifest to a complete 24-volume runtime', async () => {
    const manifest = await getCurrentManifest()
    const runtimeDir = await getCurrentRuntimeDir()
    const metadata = await readJson(path.join(runtimeDir, 'metadata.json'))
    const index = await readJson(path.join(runtimeDir, 'index.json'))
    const search = await readJson(path.join(runtimeDir, 'search.json'))
    const transliterations = await readJson(path.join(runtimeDir, 'transliterations.json'))
    const tokens = await readJson(path.join(runtimeDir, 'transliteration-tokens.json'))

    expect(metadata.counts.volumes).toBe(24)
    expect(metadata.source.volumes).toHaveLength(24)
    expect(index.length).toBe(metadata.counts.narrators)
    expect(search.length).toBe(index.length)
    expect(Object.keys(transliterations)).toHaveLength(index.length)
    expect(Object.keys(tokens).length).toBeGreaterThan(0)
    expect(Object.values(transliterations).every((entry) => entry.primary)).toBe(true)
    expect(manifest.counts.narrators).toBe(index.length)
    expect(manifest.counts.narratorShards).toBe(24)
  })

  it('keeps narrator shards aligned with index ids and page refs', async () => {
    const runtimeDir = await getCurrentRuntimeDir()
    const index = await readJson(path.join(runtimeDir, 'index.json'))
    const sample = index.find((entry) => entry.primaryName.includes('Ø£Ø¨Ø§Ù†')) ?? index[0]
    const shard = await readJson(
      path.join(
        runtimeDir,
        'narrators',
        `volume-${String(sample.volumeNumber).padStart(2, '0')}.json`,
      ),
    )
    const narrator = shard[sample.id]

    expect(narrator.id).toBe(sample.id)
    expect(narrator.primaryName).toBe(sample.primaryName)
    expect(narrator.sourceRefs.length).toBeGreaterThan(0)
    expect(narrator.sourceRefs.every((ref) => Number.isInteger(ref.pageNumber))).toBe(true)
  })

  it('stores narrator details in 24 volume shards, not per-narrator files', async () => {
    const runtimeDir = await getCurrentRuntimeDir()
    const files = await readdir(path.join(runtimeDir, 'narrators'))

    expect(files).toHaveLength(24)
    expect(files.every((file) => /^volume-\d{2}\.json$/.test(file))).toBe(true)
  })

  it('does not keep a duplicate public copy of the rijal dataset', async () => {
    expect(await pathExists(publicDataRoot)).toBe(false)
  })
})
