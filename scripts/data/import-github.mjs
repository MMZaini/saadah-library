#!/usr/bin/env node
import path from 'node:path'
import { DATA_ROOT, GITHUB_DATA_DIR, fetchWithRetry, stableVersion, writeJson } from './shared.mjs'
import { generateReleaseFromLegacy } from './generate-release.mjs'

const OWNER = 'MohammedArab1'
const REPO = 'ThaqalaynAPI'
const BRANCH = 'main'
const DATA_PATH = 'V2/ThaqalaynData'
const API_ROOT = `https://api.github.com/repos/${OWNER}/${REPO}`

function getArg(name, fallback = null) {
  const idx = process.argv.indexOf(name)
  if (idx === -1) return fallback
  return process.argv[idx + 1] ?? fallback
}

async function fetchJson(url) {
  const response = await fetchWithRetry(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  return response.json()
}

async function downloadJson(url) {
  const response = await fetchWithRetry(url, {
    headers: {
      Accept: 'application/json',
    },
  })
  return response.json()
}

async function main() {
  const commit = await fetchJson(`${API_ROOT}/commits/${BRANCH}`)
  const commitSha = commit.sha
  const version = getArg('--version', stableVersion('github', commitSha))
  const contents = await fetchJson(
    `${API_ROOT}/contents/${DATA_PATH}?ref=${encodeURIComponent(commitSha)}`,
  )

  const bookNamesFile = contents.find((item) => item.name === 'BookNames.json')
  if (!bookNamesFile?.download_url) {
    throw new Error('BookNames.json was not found in upstream data directory')
  }

  const volumeFiles = contents
    .filter(
      (item) =>
        item.type === 'file' &&
        item.name.endsWith('.json') &&
        item.name !== 'BookNames.json' &&
        item.name !== 'allBooks.json' &&
        /^\d+\.json$/.test(item.name),
    )
    .sort((a, b) => Number(a.name.replace('.json', '')) - Number(b.name.replace('.json', '')))

  const booksRaw = await downloadJson(bookNamesFile.download_url)
  const volumeEntries = []

  for (const file of volumeFiles) {
    process.stdout.write(`Downloading ${file.name}...\n`)
    const hadiths = await downloadJson(file.download_url)
    if (!Array.isArray(hadiths)) {
      throw new Error(`${file.name} did not contain a hadith array`)
    }
    const bookId = hadiths[0]?.bookId
    if (!bookId) {
      throw new Error(`${file.name} did not contain a bookId in the first hadith`)
    }
    volumeEntries.push({ fileName: file.name, bookId, hadiths })
  }

  await writeJson(path.join(DATA_ROOT, 'sources', 'github', version, 'source-manifest.json'), {
    source: GITHUB_DATA_DIR,
    commitSha,
    importedAt: new Date().toISOString(),
    booksFile: bookNamesFile.name,
    volumeFiles: volumeFiles.map((file) => ({
      name: file.name,
      sha: file.sha,
      size: file.size,
      downloadUrl: file.download_url,
    })),
  })

  const { manifest, releaseDir } = await generateReleaseFromLegacy({
    version,
    booksRaw,
    volumeEntries,
    source: {
      kind: 'github-thaqalayn-api-snapshot',
      url: GITHUB_DATA_DIR,
      commitSha,
      license: 'GPL-3.0',
      notes: [
        'Initial stable snapshot source.',
        'Website crawler is the preferred freshness path for future candidate releases.',
      ],
    },
  })

  process.stdout.write(
    `Generated ${manifest.version} at ${releaseDir} with ${manifest.counts.hadiths} hadiths.\n`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
