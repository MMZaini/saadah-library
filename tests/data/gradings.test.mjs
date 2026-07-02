import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { VOLUMES_WITH_GRADINGS } from '../../lib/books-config'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const dataRoot = path.join(repoRoot, 'public', 'data', 'thaqalayn')

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'))
}

// Mirrors the "is graded" check used in server-repository.ts / SearchInterface.tsx.
function hasGrading(hadith) {
  return Boolean(
    hadith.majlisiGrading ||
    hadith.mohseniGrading ||
    hadith.behbudiGrading ||
    (Array.isArray(hadith.gradingsFull) && hadith.gradingsFull.length > 0),
  )
}

describe('VOLUMES_WITH_GRADINGS stays in sync with the dataset', () => {
  it('lists exactly the runtime volumes that contain graded hadith', async () => {
    const manifest = await readJson(path.join(dataRoot, 'current', 'manifest.json'))
    const volumesDir = path.join(dataRoot, manifest.version, 'runtime', 'volumes')
    const files = (await readdir(volumesDir)).filter((file) => file.endsWith('.json'))

    const actual = new Set()
    for (const file of files) {
      const hadiths = await readJson(path.join(volumesDir, file))
      if (hadiths.some(hasGrading)) actual.add(file.replace(/\.json$/, ''))
    }

    expect([...actual].sort()).toEqual([...VOLUMES_WITH_GRADINGS].sort())
    // Reading every runtime volume (~176 MB) can exceed the default 5 s timeout
    // on a cold filesystem cache (fresh CI runners).
  }, 60_000)
})
