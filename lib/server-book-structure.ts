// Server-only access to generated book structure metadata.
// Imported by API routes; client components should use lib/book-structure.ts.

export type {
  BookStructureEntry,
  CategoryMeta,
  ChapterMeta,
  StructureMap,
} from '@/lib/data/server-repository'
export {
  getAllLocalStructures as getAllStructures,
  getLocalStructure as getStructure,
} from '@/lib/data/server-repository'
