import { getDb } from './index'
import type { SlotPayload } from './calendar'

export interface FavouriteMealPlan {
  id: number
  name: string
  createdAt: string
  updatedAt: string
}

export function listFavourites(): FavouriteMealPlan[] {
  const db = getDb()
  const rows = db.prepare(
    'SELECT id, name, createdAt, updatedAt FROM favourite_meal_plans ORDER BY updatedAt DESC'
  ).all() as FavouriteMealPlan[]
  return rows
}

export function createFavourite(name: string, slots: SlotPayload[]): FavouriteMealPlan {
  const db = getDb()
  const now = new Date().toISOString()
  const stmt = db.prepare(
    'INSERT INTO favourite_meal_plan_slots (favouriteId, dayOfWeek, slot, valueType, value) VALUES (?, ?, ?, ?, ?)'
  )

  const run = db.transaction(() => {
    const result = db.prepare(
      'INSERT INTO favourite_meal_plans (name, createdAt, updatedAt) VALUES (?, ?, ?)'
    ).run(name.trim(), now, now)
    const favouriteId = result.lastInsertRowid as number
    for (const s of slots) {
      stmt.run(favouriteId, s.dayOfWeek, s.slot, s.valueType, s.value ?? '')
    }
    return favouriteId
  })

  const favouriteId = run()
  const row = db.prepare(
    'SELECT id, name, createdAt, updatedAt FROM favourite_meal_plans WHERE id = ?'
  ).get(favouriteId) as FavouriteMealPlan
  return row
}

export function getFavouriteSlots(id: number): SlotPayload[] {
  const db = getDb()
  const rows = db.prepare(
    'SELECT dayOfWeek, slot, valueType, value FROM favourite_meal_plan_slots WHERE favouriteId = ? ORDER BY dayOfWeek, slot'
  ).all(id) as { dayOfWeek: number; slot: string; valueType: string; value: string | null }[]
  return rows.map((r) => ({
    dayOfWeek: r.dayOfWeek,
    slot: r.slot as 'lunch' | 'dinner',
    valueType: r.valueType as 'meal' | 'special' | 'text',
    value: r.value,
  }))
}

export function deleteFavourite(id: number): boolean {
  const db = getDb()
  const result = db.prepare('DELETE FROM favourite_meal_plans WHERE id = ?').run(id)
  return result.changes > 0
}
