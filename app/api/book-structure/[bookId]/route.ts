import { NextRequest, NextResponse } from 'next/server'
import { thaqalaynApi, Hadith } from '@/lib/api'

// ── Types ────────────────────────────────────────────────────────────────

interface ChapterMeta {
  chapter: string
  chapterInCategoryId: number
  hadithCount: number
}

interface CategoryMeta {
  category: string
  categoryId: string
  chapters: Record<string, ChapterMeta>
  totalHadiths: number
}

type StructureMap = Record<string, CategoryMeta>

// ── Server-side in-memory cache ──────────────────────────────────────────

interface CachedStructure {
  data: StructureMap
  timestamp: number
}

const structureCache = new Map<string, CachedStructure>()
const CACHE_TTL = 6 * 60 * 60 * 1000 // 6 hours

// ── Helpers ──────────────────────────────────────────────────────────────

function buildStructureFromHadiths(hadiths: Hadith[]): StructureMap {
  const structure: StructureMap = {}

  for (const hadith of hadiths) {
    const categoryKey = hadith.category || 'Uncategorized'
    const chapterKey = hadith.chapter || 'No Chapter'

    if (!structure[categoryKey]) {
      structure[categoryKey] = {
        category: categoryKey,
        categoryId: hadith.categoryId || '',
        chapters: {},
        totalHadiths: 0,
      }
    }

    if (!structure[categoryKey].chapters[chapterKey]) {
      structure[categoryKey].chapters[chapterKey] = {
        chapter: chapterKey,
        chapterInCategoryId: hadith.chapterInCategoryId || 0,
        hadithCount: 0,
      }
    }

    structure[categoryKey].chapters[chapterKey].hadithCount++
    structure[categoryKey].totalHadiths++
  }

  // Sort chapters within each category by chapterInCategoryId
  for (const category of Object.values(structure)) {
    const sorted: Record<string, ChapterMeta> = {}
    Object.entries(category.chapters)
      .sort(([, a], [, b]) => a.chapterInCategoryId - b.chapterInCategoryId)
      .forEach(([k, v]) => {
        sorted[k] = v
      })
    category.chapters = sorted
  }

  return structure
}

function getCacheKey(bookIds: string[]): string {
  return bookIds.slice().sort().join('|')
}

async function getStructure(bookIds: string[]): Promise<StructureMap> {
  const key = getCacheKey(bookIds)

  const cached = structureCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  // Fetch hadiths for each bookId in parallel (max 4 concurrent)
  const results: Hadith[][] = []
  const batchSize = 4
  for (let i = 0; i < bookIds.length; i += batchSize) {
    const batch = bookIds.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(async (id) => {
        try {
          return await thaqalaynApi.getBookHadiths(id)
        } catch {
          return []
        }
      }),
    )
    results.push(...batchResults)
  }

  const allHadiths = results.flat()
  const structure = buildStructureFromHadiths(allHadiths)

  structureCache.set(key, { data: structure, timestamp: Date.now() })
  return structure
}

// ── Route handler ────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> },
) {
  try {
    const { bookId } = await params

    // Support multi-volume aggregation via ?volumes=id1,id2,...
    const volumesParam = request.nextUrl.searchParams.get('volumes')
    const bookIds: string[] = volumesParam
      ? volumesParam
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [bookId]

    if (bookIds.length === 0) {
      return NextResponse.json({ error: 'No book IDs provided' }, { status: 400 })
    }

    const structure = await getStructure(bookIds)

    const totalHadiths = Object.values(structure).reduce((sum, cat) => sum + cat.totalHadiths, 0)

    return NextResponse.json(
      { structure, totalHadiths, bookIds },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      },
    )
  } catch {
    return NextResponse.json({ error: 'Failed to build book structure' }, { status: 500 })
  }
}
