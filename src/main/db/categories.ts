import { getDb } from './index'
import { getOtherCategoryId } from './helpers'

export interface Category {
  id: number
  name: string
  emoji: string
  sortOrder: number
}

export function listCategories(): Category[] {
  const db = getDb()
  const rows = db.prepare('SELECT id, name, emoji, sortOrder FROM categories ORDER BY sortOrder, id').all() as Category[]
  return rows
}

export function createCategory(name: string, emoji: string, sortOrder: number): Category {
  const db = getDb()
  const result = db.prepare('INSERT INTO categories (name, emoji, sortOrder) VALUES (?, ?, ?)').run(name, emoji, sortOrder)
  const row = db.prepare('SELECT id, name, emoji, sortOrder FROM categories WHERE id = ?').get(result.lastInsertRowid) as Category
  return row
}

export function updateCategory(id: number, name: string, emoji: string, sortOrder: number): Category | null {
  const db = getDb()
  db.prepare('UPDATE categories SET name = ?, emoji = ?, sortOrder = ? WHERE id = ?').run(name, emoji, sortOrder, id)
  const row = db.prepare('SELECT id, name, emoji, sortOrder FROM categories WHERE id = ?').get(id) as Category | undefined
  return row ?? null
}

export function deleteCategory(id: number): boolean {
  const db = getDb()
  const fallbackId = getOtherCategoryId(db)
  db.prepare('UPDATE ingredient_category SET categoryId = ? WHERE categoryId = ?').run(fallbackId, id)
  const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id)
  return result.changes > 0
}
