import path from 'path'
import fs from 'fs'
import Database from 'better-sqlite3'
import { app } from 'electron'
import { logger } from '../logger'
import { normalize } from './helpers'

let db: Database.Database | null = null

function getDbPath(): string {
  if (!app.isPackaged) {
    // Development: store alongside project root for easy inspection
    const cwdDb = path.join(process.cwd(), 'data', 'vibemeal.db')
    try {
      fs.mkdirSync(path.dirname(cwdDb), { recursive: true })
      return cwdDb
    } catch {
      /* fall through to userData */
    }
  }
  // Production: %APPDATA%\Meal & Shopping Planner\vibemeal.db
  const dir = app.getPath('userData')
  fs.mkdirSync(dir, { recursive: true })
  return path.join(dir, 'vibemeal.db')
}

const DEFAULT_CATEGORIES = [
  { name: 'Meat & Protein', emoji: '🥩', sortOrder: 10 },
  { name: 'Produce', emoji: '🥦', sortOrder: 20 },
  { name: 'Baking & Breads', emoji: '🧁', sortOrder: 30 },
  { name: 'Dairy', emoji: '🧀', sortOrder: 40 },
  { name: 'Pantry & Seasonings', emoji: '🥛', sortOrder: 50 },
  { name: 'Snacks', emoji: '🍫', sortOrder: 60 },
  { name: 'Pets', emoji: '🐾', sortOrder: 70 },
  { name: 'Other', emoji: '📦', sortOrder: 999 },
]

function getSchemaPath(): string {
  const fromCwd = path.join(process.cwd(), 'src', 'main', 'db', 'schema.sql')
  if (fs.existsSync(fromCwd)) return fromCwd
  const fromDir = path.join(__dirname, 'schema.sql')
  if (fs.existsSync(fromDir)) return fromDir
  return fromCwd
}

interface CategoryRow { id: number; name: string }

function getCatId(db: Database.Database, name: string): number {
  const row = db.prepare('SELECT id FROM categories WHERE name = ? LIMIT 1').get(name) as { id: number } | undefined
  return row?.id ?? 1
}

function seedDefaultMeals(db: Database.Database): void {
  const meatId = getCatId(db, 'Meat & Protein')
  const produceId = getCatId(db, 'Produce')
  const bakingId = getCatId(db, 'Baking & Breads')
  const dairyId = getCatId(db, 'Dairy')
  const pantryId = getCatId(db, 'Pantry & Seasonings')

  const meals: { title: string; ingredients: { name: string; qty: number; catId: number }[] }[] = [
    {
      title: 'Spaghetti Bolognese',
      ingredients: [
        { name: 'pasta', qty: 2, catId: bakingId },
        { name: 'ground beef', qty: 1, catId: meatId },
        { name: 'tomato sauce', qty: 1, catId: pantryId },
        { name: 'onion', qty: 1, catId: produceId },
        { name: 'garlic', qty: 1, catId: pantryId },
      ],
    },
    {
      title: 'Chicken Stir Fry',
      ingredients: [
        { name: 'chicken breast', qty: 2, catId: meatId },
        { name: 'broccoli', qty: 1, catId: produceId },
        { name: 'soy sauce', qty: 1, catId: pantryId },
        { name: 'garlic', qty: 1, catId: pantryId },
        { name: 'rice', qty: 1, catId: pantryId },
      ],
    },
    {
      title: 'Fish Tacos',
      ingredients: [
        { name: 'white fish', qty: 2, catId: meatId },
        { name: 'taco shells', qty: 1, catId: bakingId },
        { name: 'cabbage', qty: 1, catId: produceId },
        { name: 'lime', qty: 1, catId: produceId },
        { name: 'sour cream', qty: 1, catId: dairyId },
        { name: 'salsa', qty: 1, catId: pantryId },
      ],
    },
    {
      title: 'Grilled Salmon & Veg',
      ingredients: [
        { name: 'salmon fillet', qty: 2, catId: meatId },
        { name: 'asparagus', qty: 1, catId: produceId },
        { name: 'lemon', qty: 1, catId: produceId },
        { name: 'butter', qty: 1, catId: dairyId },
        { name: 'garlic', qty: 1, catId: pantryId },
      ],
    },
  ]

  const insertMeal = db.prepare('INSERT INTO meals (title) VALUES (?)')
  const insertIng = db.prepare('INSERT INTO meal_ingredients (mealId, ingredientName, quantity) VALUES (?, ?, ?)')
  const insertCat = db.prepare(
    `INSERT INTO ingredient_category (ingredientName, categoryId) VALUES (?, ?)
     ON CONFLICT(ingredientName) DO UPDATE SET categoryId = excluded.categoryId`
  )

  const run = db.transaction(() => {
    for (const meal of meals) {
      const result = insertMeal.run(meal.title)
      const mealId = result.lastInsertRowid as number
      for (const ing of meal.ingredients) {
        const key = normalize(ing.name)
        insertIng.run(mealId, key, ing.qty)
        insertCat.run(key, ing.catId)
      }
    }
  })
  run()
  logger.info('Seeded default meals')
}

function seedDefaultEssentials(db: Database.Database): void {
  const otherId = getCatId(db, 'Other')
  const items = [
    'Paper towels',
    'Toilet paper',
    'Dish soap',
    'Trash bags',
    'Laundry detergent',
    'Shampoo',
  ]
  const insert = db.prepare('INSERT INTO essentials (name, isActive, sortOrder, categoryId) VALUES (?, 1, ?, ?)')
  const run = db.transaction(() => {
    items.forEach((name, i) => insert.run(name, (i + 1) * 10, otherId))
  })
  run()
  logger.info('Seeded default essentials')
}

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = getDbPath()
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    const schemaPath = getSchemaPath()
    const schema = fs.readFileSync(schemaPath, 'utf-8')
    db.exec(schema)
    const count = db.prepare('SELECT COUNT(*) as c FROM categories').get() as { c: number }
    if (count.c === 0) {
      const ins = db.prepare('INSERT INTO categories (name, emoji, sortOrder) VALUES (?, ?, ?)')
      for (const row of DEFAULT_CATEGORIES) ins.run(row.name, row.emoji, row.sortOrder)
      logger.info('Seeded default categories')
    }
    // Migration: add categoryId to essentials if missing (must run before seed)
    try {
      const tableInfo = db.prepare('PRAGMA table_info(essentials)').all() as { name: string }[]
      if (!tableInfo.some((c) => c.name === 'categoryId')) {
        db.exec('ALTER TABLE essentials ADD COLUMN categoryId INTEGER REFERENCES categories(id)')
        const otherId = getCatId(db, 'Other')
        db.prepare('UPDATE essentials SET categoryId = ? WHERE categoryId IS NULL').run(otherId)
        logger.info('Migration: added essentials.categoryId')
      }
    } catch (e) { logger.error('Migration failed', { error: e }) }
    const mealCount = db.prepare('SELECT COUNT(*) as c FROM meals').get() as { c: number }
    if (mealCount.c === 0) seedDefaultMeals(db)
    const essCount = db.prepare('SELECT COUNT(*) as c FROM essentials').get() as { c: number }
    if (essCount.c === 0) seedDefaultEssentials(db)
    logger.info('Database opened', { path: dbPath })
  }
  return db
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
    logger.info('Database closed')
  }
}

export function getDbPathForSettings(): string {
  return getDbPath()
}
