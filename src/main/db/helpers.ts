import type Database from 'better-sqlite3'

export function getOtherCategoryId(db: Database.Database): number {
  const row = db.prepare("SELECT id FROM categories WHERE name = 'Other' LIMIT 1").get() as { id: number } | undefined
  return row?.id ?? 1
}

export function normalize(name: string): string {
  const s = typeof name === 'string' ? name : String(name ?? '')
  return s.trim().toLowerCase() || s.trim()
}
