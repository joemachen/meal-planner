# VibeMeal & House — Architecture

Data flow, schema, module roles, and logging. Update this file whenever file structure or logic flow changes.

---

## 1. Process Model

- **Main process (Node)**: Window lifecycle, SQLite, Winston logging, IPC handlers.
- **Renderer process (React)**: All UI; no direct DB or file access. Communicates with main via preload script (contextBridge) and `ipcRenderer.invoke` / `ipcRenderer.on`.

Preload exposes a small API object (e.g. `window.vibemeal.getMeals()`, `window.vibemeal.setCalendarSlot(...)`) that forwards to main over IPC.

---

## 2. Data Flow

```
Renderer (React)
    → preload API (window.vibemeal.*)
        → IPC invoke
            → Main process handlers
                → db/ (better-sqlite3)
                    → SQLite file
```

- **Meals**: CRUD in main; renderer fetches list and single meal for form; ingredients stored as rows in `meal_ingredients`.
- **Calendar**: Current week = this Saturday → next Friday; slots read/written by weekStart + dayOfWeek + slot (lunch/dinner). Value = mealId | special code | free text.
- **Essentials**: CRUD + toggle `isActive`; shopping list includes only active essentials.
- **Shopping list**: Generated on demand in main: aggregate ingredients from assigned meals for current week, add active essentials, group by category, return structured data; renderer formats as plain text and handles copy/export.

---

## 3. SQLite Schema (Logical)

- **categories** — id, name, emoji, sortOrder. User can CRUD; default categories seeded only when table is empty.
- **meals** — id, title, createdAt.
- **meal_ingredients** — mealId, ingredientName (normalized, e.g. lowercase trim), quantity (integer).
- **ingredient_category** — ingredientName (normalized), categoryId. Fallback: uncategorized → "Other" or "Pantry & Seasonings".
- **calendar_slots** — id, weekStart (date, Saturday), dayOfWeek (0–6), slot (lunch|dinner), valueType (meal|special|text), value (mealId or "ORDER"/"DINE_OUT"/"LEFTOVERS" or free text).
- **essentials** — id, name, isActive, sortOrder.

Week identity: single Saturday date (ISO string) for "this week" (rolling current week).

---

## 4. Module Roles (Main)

- **main/index.ts** — Create window, load preload, register IPC handlers, ensure logs dir exists.
- **main/logger.ts** — Winston: console (info+), file `logs/app.log`, file `logs/errors.log` (errors with stack). Used by all main modules.
- **main/db/index.ts** — Open SQLite, run schema migrations, export DB instance.
- **main/db/schema.sql** — CREATE TABLEs and seed data for categories.
- **main/db/meals.ts** — Meal and meal_ingredients CRUD.
- **main/db/calendar.ts** — Get/set slots for a given week.
- **main/db/essentials.ts** — Essentials CRUD and isActive toggle.
- **main/db/categories.ts** — Categories CRUD (list, create, update, delete); default category for unknown ingredient; on delete, reassign ingredient_category to Other.
- **main/db/shopping.ts** — Build aggregated list (ingredients + active essentials), grouped by category.

---

## 5. Module Roles (Renderer)

- **App.tsx** — Tab container (Weekly Calendar, Meal Library, Single Items, Shopping List, Settings); layout and glass chrome.
- **context/** — React context for: meals list, current week slots, essentials list, shopping result (or derived in hook). Optional: single AppContext with slices.
- **hooks/** — useMeals, useCalendar, useEssentials, useShoppingList: call preload API and set state.
- **components/calendar/** — Week grid (Sat–Fri), slot cell, slot editor (meal picker, special options, free text).
- **components/meals/** — Meal list, meal form (title, ingredient rows with name + qty), delete.
- **components/essentials/** — Essentials list, add/edit/delete, "Include in next list" toggle.
- **components/shopping/** — Display grouped list (plain text), Copy, Export.
- **components/settings/** — Data path display, Backup, Restore, Category CRUD (list, add, edit, delete).

---

## 6. Logging

- **Main**: All application log calls go through Winston. Errors (and optional stack) duplicated to `logs/errors.log`. Uncaught exceptions in main should be logged with full stack to `errors.log`.
- **Renderer**: Critical errors can be sent to main via IPC and logged there; avoid noisy console in production (run.bat goal: minimal console).

---

## 7. Error Memory

- Every error that reaches main (uncaught or from IPC) must append a full stack trace (and message) to `logs/errors.log` with timestamp.
- Cursor rule and .cursorrules: before each coding session, read `logs/errors.log` and project rules so past mistakes are not repeated.

---

## 8. Conventions

- **Ingredient normalization**: Trim, lowercase (or consistent case) when storing and when grouping for shopping list.
- **Current week**: Computed in main or renderer as "this Saturday 00:00" through "next Friday 23:59"; calendar_slots keyed by that Saturday date.
- **Clear calendar**: Deletes (or nullifies) all slots for current week only; no change to meals or essentials.
