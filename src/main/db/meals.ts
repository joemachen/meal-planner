import { getDb } from './index'
import { normalize } from './helpers'

export interface Meal {
  id: number
  title: string
  createdAt: string
}

export interface MealIngredient {
  ingredientName: string
  quantity: number
  categoryId?: number
}

export function listMeals(): Meal[] {
  const db = getDb()
  const rows = db.prepare('SELECT id, title, createdAt FROM meals ORDER BY title').all() as Meal[]
  return rows
}

export function getMeal(id: number): Meal | null {
  const db = getDb()
  const row = db.prepare('SELECT id, title, createdAt FROM meals WHERE id = ?').get(id) as Meal | undefined
  return row ?? null
}

export function getMealIngredients(mealId: number): MealIngredient[] {
  const db = getDb()
  const otherId = db.prepare("SELECT id FROM categories WHERE name = 'Other' LIMIT 1").get() as { id: number } | undefined
  const defaultCatId = otherId?.id ?? 1
  const rows = db.prepare(
    `SELECT mi.ingredientName, mi.quantity, COALESCE(ic.categoryId, ?) as categoryId
     FROM meal_ingredients mi
     LEFT JOIN ingredient_category ic ON ic.ingredientName = mi.ingredientName
     WHERE mi.mealId = ?
     ORDER BY mi.ingredientName`
  ).all(defaultCatId, mealId) as MealIngredient[]
  return rows
}

export function createMeal(title: string, ingredients: MealIngredient[]): Meal {
  const db = getDb()
  const titleStr = typeof title === 'string' ? title : String(title ?? '')
  const ins = db.prepare('INSERT INTO meal_ingredients (mealId, ingredientName, quantity) VALUES (?, ?, ?)')

  const run = db.transaction(() => {
    const result = db.prepare('INSERT INTO meals (title) VALUES (?)').run(titleStr.trim())
    const mealId = result.lastInsertRowid as number
    for (const ing of ingredients) {
      const qty = Math.max(1, Math.floor(ing.quantity) || 1)
      ins.run(mealId, normalize(ing.ingredientName), qty)
    }
    return mealId
  })

  const mealId = run()
  const row = db.prepare('SELECT id, title, createdAt FROM meals WHERE id = ?').get(mealId) as Meal
  return row
}

export function updateMeal(id: number, title: string, ingredients: MealIngredient[]): Meal | null {
  const db = getDb()
  const titleStr = typeof title === 'string' ? title : String(title ?? '')
  const ins = db.prepare('INSERT INTO meal_ingredients (mealId, ingredientName, quantity) VALUES (?, ?, ?)')

  const run = db.transaction(() => {
    db.prepare('UPDATE meals SET title = ? WHERE id = ?').run(titleStr.trim(), id)
    db.prepare('DELETE FROM meal_ingredients WHERE mealId = ?').run(id)
    for (const ing of ingredients) {
      const qty = Math.max(1, Math.floor(ing.quantity) || 1)
      ins.run(id, normalize(ing.ingredientName), qty)
    }
  })

  run()
  const row = db.prepare('SELECT id, title, createdAt FROM meals WHERE id = ?').get(id) as Meal | undefined
  return row ?? null
}

export function deleteMeal(id: number): boolean {
  const db = getDb()
  const result = db.prepare('DELETE FROM meals WHERE id = ?').run(id)
  return result.changes > 0
}
