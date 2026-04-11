-- Categories: user can CRUD; seed defaults on first run
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📦',
  sortOrder INTEGER NOT NULL DEFAULT 0
);

-- Meals
CREATE TABLE IF NOT EXISTS meals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Meal ingredients: name normalized (lowercase trim), quantity in "units" (e.g. 1x, 2x)
CREATE TABLE IF NOT EXISTS meal_ingredients (
  mealId INTEGER NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  ingredientName TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (mealId, ingredientName)
);

-- Map ingredient name -> category for shopping list grouping
CREATE TABLE IF NOT EXISTS ingredient_category (
  ingredientName TEXT PRIMARY KEY,
  categoryId INTEGER NOT NULL REFERENCES categories(id)
);

-- Calendar: week = Saturday date (ISO), dayOfWeek 0=Sat..6=Fri, slot lunch|dinner
-- valueType: 'meal' | 'special' | 'text'; value: mealId (number) or 'ORDER'/'DINE_OUT'/'LEFTOVERS' or free text
CREATE TABLE IF NOT EXISTS calendar_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  weekStart TEXT NOT NULL,
  dayOfWeek INTEGER NOT NULL CHECK (dayOfWeek >= 0 AND dayOfWeek <= 6),
  slot TEXT NOT NULL CHECK (slot IN ('lunch', 'dinner')),
  valueType TEXT NOT NULL CHECK (valueType IN ('meal', 'special', 'text')),
  value TEXT,
  UNIQUE (weekStart, dayOfWeek, slot)
);

-- Single items (essentials): isActive = "Include in next list"
CREATE TABLE IF NOT EXISTS essentials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  isActive INTEGER NOT NULL DEFAULT 1,
  sortOrder INTEGER NOT NULL DEFAULT 0,
  categoryId INTEGER REFERENCES categories(id)
);

CREATE INDEX IF NOT EXISTS idx_calendar_week ON calendar_slots(weekStart);
CREATE INDEX IF NOT EXISTS idx_meal_ingredients_meal ON meal_ingredients(mealId);

-- Favourite meal plans: named snapshots of calendar slots (week-agnostic)
CREATE TABLE IF NOT EXISTS favourite_meal_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS favourite_meal_plan_slots (
  favouriteId INTEGER NOT NULL REFERENCES favourite_meal_plans(id) ON DELETE CASCADE,
  dayOfWeek INTEGER NOT NULL CHECK (dayOfWeek >= 0 AND dayOfWeek <= 6),
  slot TEXT NOT NULL CHECK (slot IN ('lunch', 'dinner')),
  valueType TEXT NOT NULL CHECK (valueType IN ('meal', 'special', 'text')),
  value TEXT,
  PRIMARY KEY (favouriteId, dayOfWeek, slot)
);

CREATE INDEX IF NOT EXISTS idx_favourite_slots_favourite ON favourite_meal_plan_slots(favouriteId);
