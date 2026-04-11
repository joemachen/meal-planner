# VibeMeal & House — Blueprint (Step 2)

This document is the **proposed file structure and tech stack** for your approval before Foundation (Step 3) and Iterative Build (Step 4).

---

## 1. Tech Stack Summary

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Desktop shell** | **Electron** | Mature Windows story, single `run.bat` (npm), rich ecosystem, straightforward packaging. |
| **Frontend** | **React 18 + Vite** | Fast dev/build, minimal config, full control for liquid-glass UI. |
| **Language** | **TypeScript** | Type safety, better refactors, fewer runtime bugs. |
| **Database** | **SQLite** (via `better-sqlite3`) | Single file, no server, ACID, backup = copy `.db`; export/restore to JSON in Settings. |
| **Logging** | **Winston** | File transports to `logs/app.log` and `logs/errors.log` (full stack traces); console only for critical status. |
| **State** | **React context + local state** | No Redux; app scope is manageable with context for calendar/meals/essentials. |
| **Styling** | **CSS Modules + CSS variables** | Liquid-glass via `backdrop-filter`, semi-transparent panels, no heavy UI framework. |

**Why not Tauri?** Tauri is lighter and faster, but Electron gives faster iteration, simpler run.bat (npm only), and more predictable Node + native module (better-sqlite3) support on Windows. We can revisit Tauri later if you want a smaller binary.

---

## 2. Proposed Directory & File Structure

```
meal-planner/
├── .cursor/
│   └── rules/
│       └── vibemeal-architecture.mdc    # Cursor rule: read before coding
├── .cursorrules                          # Root rule: read errors.log + docs
├── run.bat                               # Silent venv not used; npm install + start
├── package.json
├── tsconfig.json
├── vite.config.ts
├── electron-builder.yml                  # (later) packaging
├── BLUEPRINT.md                         # This file
├── ARCHITECTURE.md                      # Data flow, schema, module roles
├── TECH_STACK.md                        # Versions, dependencies, rationale
│
├── logs/
│   ├── app.log                          # All application logs
│   └── errors.log                       # Full stack traces only
│
├── src/
│   ├── main/                            # Electron main process
│   │   ├── index.ts                     # Entry, window creation
│   │   ├── preload.ts                   # Context bridge (API to renderer)
│   │   ├── logger.ts                    # Winston setup (app + errors)
│   │   └── db/
│   │       ├── index.ts                 # DB connection, init
│   │       ├── schema.sql               # Tables: meals, ingredients, calendar, essentials, categories
│   │       ├── meals.ts                 # Meal CRUD
│   │       ├── calendar.ts              # Week slots (Sat–Fri)
│   │       ├── essentials.ts            # Essentials CRUD + active flag
│   │       ├── categories.ts            # Ingredient categories (Produce, Dairy, etc.)
│   │       └── shopping.ts              # Generate aggregated list
│   │
│   ├── renderer/                        # React app (Vite builds this)
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx                      # Tab shell, layout
│   │   ├── styles/
│   │   │   ├── globals.css              # Variables, liquid-glass base
│   │   │   └── ...
│   │   ├── components/
│   │   │   ├── ui/                      # Glass panel, button, inputs
│   │   │   ├── calendar/                # Weekly grid, slot editor
│   │   │   ├── meals/                   # Meal list, meal form, ingredient rows
│   │   │   ├── essentials/              # Essentials list, active toggles
│   │   │   ├── shopping/                # Generated list, copy, export
│   │   │   └── settings/                # Data path, backup, restore
│   │   ├── context/                     # App state (meals, calendar, essentials)
│   │   ├── hooks/                       # useMeals, useCalendar, useEssentials, useShopping
│   │   └── types.ts                     # Shared types
│   │
│   └── shared/
│       └── types.ts                     # Types used by main + renderer (or single types.ts in renderer, bridge via IPC)
```

- **No Python venv**: Node/Electron app; `run.bat` will call `npm install` and `npm run start` (or `electron .`).
- **Logging**: Main process only (Winston); renderer errors can be sent via IPC and logged in main.
- **DB access**: Only in main process; renderer talks to main via `contextBridge` + `ipcRenderer` (preload).

---

## 3. Data Model (SQLite)

- **categories** — id, name, emoji, sortOrder. User can CRUD categories (Settings); default set seeded when empty.
- **meals** — id, title, createdAt.
- **meal_ingredients** — mealId, name (normalized), quantity (integer, default 1). Same ingredient name across meals = same logical ingredient for grouping.
- **ingredient_category** — ingredientName (normalized), categoryId. Default unknown → "Pantry & Seasonings" or "Other".
- **calendar_slots** — id, weekStart (Saturday date, ISO), dayOfWeek (0=Sat … 6=Fri), slot (lunch | dinner), valueType (meal | special | text), value (mealId or "ORDER" / "DINE_OUT" / "LEFTOVERS" or free text e.g. "Zaxby's").
- **essentials** — id, name, isActive (boolean, "Include in next list"), sortOrder.

**Shopping list generation**:  
Collect all ingredients from meals assigned to current week (Sat–Fri) where slot is `meal` and value = mealId; sum quantities by normalized ingredient name; resolve category from `ingredient_category` (default Other/Pantry). Append all essentials where `isActive = 1`. Output grouped by category (with emoji), then plain text + copy to clipboard + export file.

---

## 4. UI Structure (Tabs)

1. **Weekly Calendar** — Grid Sat–Fri, Lunch/Dinner. Each cell: current value (meal name, "Order in", "Leftovers", "Zaxby's", etc.) + click to edit (picker: meal from library, or Dine out / Order in / Leftovers, or free text).
2. **Meal Library** — List of meals; add/edit/delete; per meal: title + list of ingredients (name + quantity, e.g. 1x sugar, 2x potatoes). No metadata.
3. **Single Items** — List of items; add/edit/delete; each row: name + "Include in next list" toggle (Active/Inactive).
4. **Shopping List** — Generated list by category (with emoji); plain text; "Copy to clipboard" + "Export" (e.g. .txt file).
5. **Settings** — Data file location (SQLite path), Backup (export DB or JSON), Restore (from file).

**Global**: "Clear calendar" button (e.g. in Calendar tab or header) — clears all slots for current week only; meals and essentials unchanged.

---

## 5. Liquid-Glass Aesthetic

- **Backdrop**: Soft gradient or subtle texture.
- **Panels**: Semi-transparent (e.g. `rgba(255,255,255,0.12)`), `backdrop-filter: blur(12px)`, light border.
- **Typography**: Clean sans-serif; clear hierarchy.
- **Accents**: One primary color for CTAs; rest neutral so list content stays scannable.

Implemented in `globals.css` + component-level CSS modules; no heavy UI library.

---

## 6. Run.bat Behavior

- No virtual environment (Node app).
- `run.bat`:  
  - Ensure `node_modules` exists (run `npm install` if needed, minimal output).  
  - Start app with `npm run start` (Electron + Vite dev or packaged).  
  - Console: only critical status (e.g. "Starting VibeMeal…", "Window open").  
  - All detailed logs → `logs/app.log`; all errors + stack traces → `logs/errors.log`.

---

## 7. Error Memory & Self-Correction

- On any uncaught error (main or reported from renderer): append full stack trace to `logs/errors.log` with timestamp.
- **Cursor rule**: Before every coding session, read `logs/errors.log` and `.cursorrules` (and ARCHITECTURE.md / TECH_STACK.md) so we don’t repeat past mistakes.

---

## 8. Documentation

- **TECH_STACK.md** — Versions, key dependencies, why each was chosen; update when stack or structure changes.
- **ARCHITECTURE.md** — File roles, data flow, schema, logging; update when file structure or logic flow changes.

---

## 9. Out of Scope for v1

- Cloud sync / multi-device.
- User accounts or auth.
- Recipe steps or instructions (meals = title + ingredients only).
- Precise units (cups, tbsp); only "Nx ingredient" and grouped totals.

---

If this blueprint looks good, reply with **approved** or note any changes. Next step is **Foundation**: create repo structure, `run.bat`, Winston logging, SQLite schema, and Electron + Vite + React shell so the app opens with tabs and empty state.
