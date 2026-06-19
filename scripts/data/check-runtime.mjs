#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import { REPO_ROOT, listFiles } from './shared.mjs'

const SCAN_TARGETS = ['app', 'components', 'lib', 'next.config.ts', 'middleware.ts']
const FORBIDDEN = [
  'www.thaqalayn-api.net',
  'thaqalayn-api.net/api',
  'https://www.thaqalayn-api.net/api/v2',
]

async function collectFiles() {
  const files = []
  for (const target of SCAN_TARGETS) {
    const fullPath = path.join(REPO_ROOT, target)
    const stat = await fs.stat(fullPath).catch(() => null)
    if (!stat) continue
    if (stat.isDirectory()) {
      files.push(...(await listFiles(fullPath, (file) => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(file))))
    } else {
      files.push(fullPath)
    }
  }
  return files
}

const violations = []
for (const filePath of await collectFiles()) {
  const text = await fs.readFile(filePath, 'utf8')
  for (const token of FORBIDDEN) {
    if (text.includes(token)) {
      violations.push({ filePath: path.relative(REPO_ROOT, filePath).replace(/\\/g, '/'), token })
    }
  }
}

if (violations.length > 0) {
  for (const violation of violations) {
    console.error(`Forbidden runtime dependency: ${violation.token} in ${violation.filePath}`)
  }
  process.exit(1)
}

console.log(
  'Runtime dependency check passed: no Thaqalayn API host references in app/runtime code.',
)
