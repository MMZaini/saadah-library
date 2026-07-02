// Smoke test for the server-side scan rasterizer behind /api/scan-page.
//
// This is the pipeline that once shipped blank ("white") pages on mobile: a
// broken JBIG2 decode still returns HTTP 200 with a valid — but empty — image,
// so nothing else in CI notices. Rendering one real scanned page and checking
// the output is a plausibly-sized WebP catches decoder/asset regressions.
import { createServer, type Server } from 'node:http'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { rasterizePageToWebp } from '../../lib/data/scan-raster'
import { GET as scanPageGet } from '../../app/api/scan-page/route'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

// The smallest whitelisted JBIG2 scan volume — exercises the wasm decode path.
const SCAN_PDF = '/pdfs/rijal/khoei/volume-24.pdf'

let server: Server
let origin: string

beforeAll(async () => {
  // The rasterizer fetches its PDF over HTTP (in production it fetches the
  // deployment's own static asset); serve public/ from a local ephemeral port.
  server = createServer(async (req, res) => {
    try {
      const body = await readFile(join(repoRoot, 'public', req.url ?? ''))
      res.writeHead(200, { 'Content-Type': 'application/pdf' })
      res.end(body)
    } catch {
      res.writeHead(404)
      res.end()
    }
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (typeof address === 'object' && address) {
    origin = `http://127.0.0.1:${address.port}`
  }
})

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()))
})

describe('scan page rasterizer', () => {
  it('renders a real scanned page to a non-blank WebP', async () => {
    const webp = await rasterizePageToWebp({ pdfUrl: `${origin}${SCAN_PDF}`, page: 5, width: 560 })

    // WebP container magic: RIFF....WEBP
    expect(webp.subarray(0, 4).toString('ascii')).toBe('RIFF')
    expect(webp.subarray(8, 12).toString('ascii')).toBe('WEBP')
    // A blank/white 560px page encodes to well under 2 KB; a real scanned page
    // of Arabic text is far larger. This is the "white page" regression guard.
    expect(webp.length).toBeGreaterThan(5_000)
  }, 120_000)

  it('clamps out-of-range page numbers instead of failing', async () => {
    const webp = await rasterizePageToWebp({
      pdfUrl: `${origin}${SCAN_PDF}`,
      page: 999_999,
      width: 280,
    })
    expect(webp.subarray(8, 12).toString('ascii')).toBe('WEBP')
  }, 120_000)
})

describe('GET /api/scan-page parameter validation', () => {
  it('rejects PDFs outside the whitelist', async () => {
    const request = new NextRequest('http://localhost/api/scan-page?pdf=/etc/passwd&page=1&w=560')
    const response = await scanPageGet(request)
    expect(response.status).toBe(400)
  })

  it('rejects invalid page numbers', async () => {
    const request = new NextRequest(
      `http://localhost/api/scan-page?pdf=${encodeURIComponent(SCAN_PDF)}&page=0&w=560`,
    )
    const response = await scanPageGet(request)
    expect(response.status).toBe(400)

    const nan = new NextRequest(
      `http://localhost/api/scan-page?pdf=${encodeURIComponent(SCAN_PDF)}&page=abc&w=560`,
    )
    expect((await scanPageGet(nan)).status).toBe(400)
  })
})
