# VibeMeal & House — Tech Stack

Single source of truth for runtime, languages, frameworks, and key dependencies. Update this file whenever the stack or major versions change.

---

## Runtime & Shell

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20 LTS (or 18+) | Runtime for Electron and build tooling |
| **Electron** | ^28.x | Desktop shell, main process, native window |
| **npm** | 9+ | Package manager; used by `run.bat` |

---

## Frontend (Renderer)

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.x | UI components and tab-based layout |
| **TypeScript** | 5.x | Typing for main and renderer |
| **Vite** | 5.x | Dev server, HMR, production build for renderer |
| **vite-plugin-electron** | Latest compatible | Integrate Electron main with Vite |

No Redux; state via React context and local component state.

---

## Backend (Main Process)

| Technology | Version | Purpose |
|------------|---------|---------|
| **better-sqlite3** | ^11.x | Synchronous SQLite; single file DB, no server |
| **Winston** | ^3.x | Logging: `logs/app.log` (all), `logs/errors.log` (stack traces) |

Database path: user data directory (e.g. `app.getPath('userData')`) by default; configurable in Settings.

---

## Styling

| Technology | Purpose |
|------------|---------|
| **CSS** | Global variables, liquid-glass (backdrop-filter, transparency) |
| **CSS Modules** | Scoped styles per component (optional where needed) |

No Tailwind or heavy UI library; full control over glass aesthetic.

---

## Development & Quality

| Technology | Purpose |
|------------|---------|
| **TypeScript** | Strict mode for main and renderer |
| **ESLint** | Linting (TypeScript + React) |
| **Prettier** | Formatting (optional, project standard) |

---

## Key Scripts (package.json)

- `start` — Run Electron with Vite dev server (renderer).
- `build` — Build renderer + Electron for production.
- `run.bat` — Install deps (if needed), then `npm run start`; minimal console output.

---

## File / Folder Conventions

- **Source**: `src/main/` (Electron + DB + logger), `src/renderer/` (React app).
- **Logs**: `logs/app.log`, `logs/errors.log` (created at runtime).
- **Data**: SQLite file in user data dir unless overridden in Settings.
- **Docs**: `TECH_STACK.md`, `ARCHITECTURE.md`, `BLUEPRINT.md`; update when structure or flow changes.

---

## Troubleshooting

- **Window doesn’t open after build**: Check `logs/errors.log`. If you see `NODE_MODULE_VERSION` / `better_sqlite3.node` errors, the native module was built for a different Node than Electron. Run: `npx electron-rebuild -f -w better-sqlite3` (or run `npm install` again; `postinstall` runs this). Then start the app again.
- **Startup steps** are logged to `logs/app.log` (e.g. "App ready; opening database...", "Creating window...").
