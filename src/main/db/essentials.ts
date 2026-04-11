import { getDb } from './index'
import { getOtherCategoryId } from './helpers'

export interface Essential {
  id: number
  name: string
  isActive: number
  sortOrder: number
  categoryId: number
}

export function listEssentials(): Essential[] {
  const db = getDb()
  const defaultCatId = getOtherCategoryId(db)
  const rows = db.prepare('SELECT id, name, isActive, sortOrder, COALESCE(categoryId, ?) as categoryId FROM essentials ORDER BY sortOrder, id').all(defaultCatId) as Essential[]
  return rows
}

export function createEssential(name: string, isActive: boolean, sortOrder: number, categoryId: number): Essential {
  const db = getDb()
  const defaultCatId = getOtherCategoryId(db)
  const result = db.prepare('INSERT INTO essentials (name, isActive, sortOrder, categoryId) VALUES (?, ?, ?, ?)').run(name.trim(), isActive ? 1 : 0, sortOrder, categoryId)
  const row = db.prepare('SELECT id, name, isActive, sortOrder, COALESCE(categoryId, ?) as categoryId FROM essentials WHERE id = ?').get(defaultCatId, result.lastInsertRowid) as Essential
  return row
}

export function updateEssential(id: number, name: string, isActive: boolean, sortOrder: number, categoryId: number): Essential | null {
  const db = getDb()
  const defaultCatId = getOtherCategoryId(db)
  db.prepare('UPDATE essentials SET name = ?, isActive = ?, sortOrder = ?, categoryId = ? WHERE id = ?').run(name.trim(), isActive ? 1 : 0, sortOrder, categoryId, id)
  const row = db.prepare('SELECT id, name, isActive, sortOrder, COALESCE(categoryId, ?) as categoryId FROM essentials WHERE id = ?').get(defaultCatId, id) as Essential | undefined
  return row ?? null
}

export function deleteEssential(id: number): boolean {
  const db = getDb()
  const result = db.prepare('DELETE FROM essentials WHERE id = ?').run(id)
  return result.changes > 0
}

export function setEssentialActive(id: number, isActive: boolean): Essential | null {
  const db = getDb()
  const defaultCatId = getOtherCategoryId(db)
  db.prepare('UPDATE essentials SET isActive = ? WHERE id = ?').run(isActive ? 1 : 0, id)
  const row = db.prepare('SELECT id, name, isActive, sortOrder, COALESCE(categoryId, ?) as categoryId FROM essentials WHERE id = ?').get(defaultCatId, id) as Essential | undefined
  return row ?? null
}
