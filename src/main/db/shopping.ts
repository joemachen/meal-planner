import { getDb } from './index'
import { listCategories } from './categories'
import { getSlots } from './calendar'
import { getMealIngredients } from './meals'
import { listEssentials } from './essentials'
import { normalize } from './helpers'

export interface GroupedItem {
  categoryId: number
  categoryName: string
  emoji: string
  sortOrder: number
  items: { name: string; quantity: number }[]
}

export function generateShoppingList(weekStart: string): GroupedItem[] {
  const db = getDb()
  const categories = listCategories()
  const catMap = new Map(categories.map((c) => [c.id, c]))
  const otherCat = categories.find((c) => c.name === 'Other') ?? categories[0]
  const defaultCatId = otherCat.id

  const slots = getSlots(weekStart)
  const mealIds = slots
    .filter((s) => s.valueType === 'meal' && s.value)
    .map((s) => parseInt(s.value!, 10))
    .filter((id) => !Number.isNaN(id))

  const ingredientTotals = new Map<string, number>()
  for (const mealId of mealIds) {
    const ingredients = getMealIngredients(mealId)
    for (const ing of ingredients) {
      const key = normalize(ing.ingredientName)
      ingredientTotals.set(key, (ingredientTotals.get(key) ?? 0) + ing.quantity)
    }
  }

  const ingredientToCat = new Map<string, number>()
  for (const [ingName] of ingredientTotals) {
    const row = db.prepare('SELECT categoryId FROM ingredient_category WHERE ingredientName = ?').get(ingName) as { categoryId: number } | undefined
    ingredientToCat.set(ingName, row?.categoryId ?? defaultCatId)
  }

  const byCategory = new Map<number, { name: string; quantity: number }[]>()
  for (const [name, qty] of ingredientTotals) {
    const catId = ingredientToCat.get(name) ?? defaultCatId
    if (!byCategory.has(catId)) byCategory.set(catId, [])
    byCategory.get(catId)!.push({ name, quantity: qty })
  }

  const essentials = listEssentials().filter((e) => e.isActive === 1)
  for (const e of essentials) {
    const catId = e.categoryId ?? defaultCatId
    if (!byCategory.has(catId)) byCategory.set(catId, [])
    byCategory.get(catId)!.push({ name: e.name, quantity: 1 })
  }

  const result: GroupedItem[] = []
  for (const cat of categories) {
    const items = byCategory.get(cat.id) ?? []
    if (items.length > 0) result.push({ categoryId: cat.id, categoryName: cat.name, emoji: cat.emoji, sortOrder: cat.sortOrder, items })
  }
  result.sort((a, b) => a.sortOrder - b.sortOrder)
  return result
}

export function setIngredientCategory(ingredientName: string, categoryId: number): void {
  const db = getDb()
  const key = normalize(ingredientName)
  db.prepare(
    `INSERT INTO ingredient_category (ingredientName, categoryId) VALUES (?, ?)
     ON CONFLICT(ingredientName) DO UPDATE SET categoryId = excluded.categoryId`
  ).run(key, categoryId)
}
