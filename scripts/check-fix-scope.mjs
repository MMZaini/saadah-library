import { readFile } from 'node:fs/promises'

const packageJson = JSON.parse(await readFile('package.json', 'utf8'))
const prettierIgnore = await readFile('.prettierignore', 'utf8')

const requiredIgnorePatterns = [
  '.next',
  '.next-build',
  'data/thaqalayn/releases',
  'public/data/thaqalayn',
  'public/covers',
  'node_modules',
  'yarn.lock',
]

const scripts = packageJson.scripts ?? {}
const formatScript = scripts.format ?? ''
const fixScript = scripts.fix ?? ''
const failures = []

if (/\bprettier\s+--write\s+\.(?:\s|$)/.test(formatScript)) {
  failures.push('package.json scripts.format must not run `prettier --write .`.')
}

if (/\bprettier\s+--write\s+\.(?:\s|$)/.test(fixScript)) {
  failures.push('package.json scripts.fix must not run `prettier --write .`.')
}

for (const forbiddenPath of ['.next-build', 'data/thaqalayn', 'public/data/thaqalayn']) {
  if (formatScript.includes(forbiddenPath)) {
    failures.push(`package.json scripts.format must not directly target ${forbiddenPath}.`)
  }
}

for (const pattern of requiredIgnorePatterns) {
  const hasPattern = prettierIgnore
    .split(/\r?\n/)
    .map((line) => line.trim())
    .includes(pattern)

  if (!hasPattern) {
    failures.push(`.prettierignore must include ${pattern}.`)
  }
}

if (failures.length > 0) {
  console.error(
    ['Unsafe fix/format scope:', ...failures.map((failure) => `- ${failure}`)].join('\n'),
  )
  process.exit(1)
}

console.log('Fix/format scope check passed.')
