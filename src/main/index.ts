import path from 'path'
import fs from 'fs'
import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { logger, logErrorToErrorsFile } from './logger'
import { getDb, getDbPathForSettings, closeDb } from './db'
import * as categoriesDb from './db/categories'
import * as mealsDb from './db/meals'
import * as calendarDb from './db/calendar'
import * as essentialsDb from './db/essentials'
import * as favouritesDb from './db/favourites'
import * as shoppingDb from './db/shopping'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'Meal & Shopping Planner',
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
    closeDb()
  })
}

function registerHandlers(): void {
  const wrap = (channel: string, fn: (...args: unknown[]) => unknown) => {
    ipcMain.handle(channel, async (event, ...args) => {
      try {
        return await fn(event, ...args)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        const stack = err instanceof Error ? err.stack : undefined
        logger.error(message, { stack })
        logErrorToErrorsFile(message, stack)
        throw err
      }
    })
  }

  wrap('categories:list', () => categoriesDb.listCategories())
  wrap('categories:create', (_: unknown, name: string, emoji: string, sortOrder: number) =>
    categoriesDb.createCategory(name, emoji, sortOrder))
  wrap('categories:update', (_: unknown, id: number, name: string, emoji: string, sortOrder: number) =>
    categoriesDb.updateCategory(id, name, emoji, sortOrder))
  wrap('categories:delete', (_: unknown, id: number) => categoriesDb.deleteCategory(id))

  wrap('meals:list', () => mealsDb.listMeals())
  wrap('meals:get', (_: unknown, id: number) => mealsDb.getMeal(id))
  wrap('meals:getIngredients', (_: unknown, mealId: number) => mealsDb.getMealIngredients(mealId))
  wrap('meals:create', (_: unknown, title: string, ingredients: { ingredientName: string; quantity: number; categoryId?: number }[]) => {
    const forDb = ingredients.map(({ ingredientName, quantity }) => ({ ingredientName, quantity }))
    const meal = mealsDb.createMeal(title, forDb)
    for (const ing of ingredients) {
      if (ing.categoryId != null) shoppingDb.setIngredientCategory(ing.ingredientName, ing.categoryId)
    }
    return meal
  })
  wrap('meals:update', (_: unknown, id: number, title: string, ingredients: { ingredientName: string; quantity: number; categoryId?: number }[]) => {
    const forDb = ingredients.map(({ ingredientName, quantity }) => ({ ingredientName, quantity }))
    const meal = mealsDb.updateMeal(id, title, forDb)
    for (const ing of ingredients) {
      if (ing.categoryId != null) shoppingDb.setIngredientCategory(ing.ingredientName, ing.categoryId)
    }
    return meal
  })
  wrap('meals:delete', (_: unknown, id: number) => mealsDb.deleteMeal(id))

  wrap('calendar:getCurrentWeekStart', () => calendarDb.getCurrentWeekStart())
  wrap('calendar:getSlots', (_: unknown, weekStart: string) => calendarDb.getSlots(weekStart))
  wrap('calendar:setSlot', (_: unknown, weekStart: string, dayOfWeek: number, slot: string, valueType: string, value: string | null) =>
    calendarDb.setSlot(weekStart, dayOfWeek, slot as 'lunch' | 'dinner', valueType as 'meal' | 'special' | 'text', value))
  wrap('calendar:clearWeek', (_: unknown, weekStart: string) => calendarDb.clearWeek(weekStart))
  wrap('calendar:saveWeek', (_: unknown, weekStart: string, slots: { dayOfWeek: number; slot: string; valueType: string; value: string | null }[]) =>
    calendarDb.saveWeek(weekStart, slots.map((s) => ({ ...s, slot: s.slot as 'lunch' | 'dinner', valueType: s.valueType as 'meal' | 'special' | 'text' }))))

  wrap('favourites:list', () => favouritesDb.listFavourites())
  wrap('favourites:create', (_: unknown, name: string, slots: { dayOfWeek: number; slot: string; valueType: string; value: string | null }[]) =>
    favouritesDb.createFavourite(name, slots.map((s) => ({ ...s, slot: s.slot as 'lunch' | 'dinner', valueType: s.valueType as 'meal' | 'special' | 'text' }))))
  wrap('favourites:getSlots', (_: unknown, id: number) => favouritesDb.getFavouriteSlots(id))
  wrap('favourites:delete', (_: unknown, id: number) => favouritesDb.deleteFavourite(id))

  wrap('essentials:list', () => essentialsDb.listEssentials())
  wrap('essentials:create', (_: unknown, name: string, isActive: boolean, sortOrder: number, categoryId: number) =>
    essentialsDb.createEssential(name, isActive, sortOrder, categoryId))
  wrap('essentials:update', (_: unknown, id: number, name: string, isActive: boolean, sortOrder: number, categoryId: number) =>
    essentialsDb.updateEssential(id, name, isActive, sortOrder, categoryId))
  wrap('essentials:delete', (_: unknown, id: number) => essentialsDb.deleteEssential(id))
  wrap('essentials:setActive', (_: unknown, id: number, isActive: boolean) =>
    essentialsDb.setEssentialActive(id, isActive))

  wrap('shopping:generate', (_: unknown, weekStart: string) => shoppingDb.generateShoppingList(weekStart))
  wrap('shopping:setIngredientCategory', (_: unknown, ingredientName: string, categoryId: number) =>
    shoppingDb.setIngredientCategory(ingredientName, categoryId))

  wrap('settings:getDbPath', () => getDbPathForSettings())

  ipcMain.handle('settings:backupDb', async () => {
    const dbPath = getDbPathForSettings()
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow!, {
      title: 'Save database backup',
      defaultPath: `meal-planner-backup-${new Date().toISOString().slice(0, 10)}.db`,
      filters: [{ name: 'Database', extensions: ['db'] }],
    })
    if (!canceled && filePath) {
      fs.copyFileSync(dbPath, filePath)
      logger.info('Database backed up', { dest: filePath })
      return { success: true }
    }
    return { success: false }
  })

  ipcMain.handle('settings:restoreDb', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow!, {
      title: 'Restore from backup',
      filters: [{ name: 'Database', extensions: ['db'] }],
      properties: ['openFile'],
    })
    if (!canceled && filePaths[0]) {
      const dbPath = getDbPathForSettings()
      closeDb()
      fs.copyFileSync(filePaths[0], dbPath)
      getDb()
      logger.info('Database restored', { src: filePaths[0] })
      mainWindow?.webContents.reload()
      return { success: true }
    }
    return { success: false }
  })

  ipcMain.on('window:close', () => { mainWindow?.close() })
  ipcMain.on('window:minimize', () => { mainWindow?.minimize() })
}

app.whenReady().then(() => {
  try {
    logger.info('App ready; opening database...')
    getDb()
    logger.info('Database opened; registering IPC...')
    registerHandlers()
    logger.info('Creating window...')
    createWindow()
    logger.info('App started')
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : undefined
    logger.error('Startup failed', { error: message, stack })
    logErrorToErrorsFile(`Startup failed: ${message}`, stack)
    dialog.showErrorBox('Meal Planner — Startup Failed', `${message}\n\n${stack ?? ''}`)
    app.exit(1)
  }
}).catch((err) => {
  const message = err instanceof Error ? err.message : String(err)
  const stack = err instanceof Error ? err.stack : undefined
  logger.error('App whenReady failed', { error: message, stack })
  logErrorToErrorsFile(`App whenReady failed: ${message}`, stack)
})

app.on('window-all-closed', () => {
  closeDb()
  app.quit()
})

process.on('uncaughtException', (err) => {
  try {
    logger.error('Uncaught exception', { error: err.message, stack: err.stack })
    logErrorToErrorsFile(err.message, err.stack)
  } catch {
    // logger not available — write directly
  }
  dialog.showErrorBox('Meal Planner — Unexpected Error', `${err.message}\n\n${err.stack ?? ''}`)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  const message = reason instanceof Error ? reason.message : String(reason)
  const stack = reason instanceof Error ? reason.stack : undefined
  try {
    logger.error('Unhandled rejection', { message, stack })
    logErrorToErrorsFile(message, stack)
  } catch {
    const logFile = path.join(process.cwd(), 'logs', 'errors.log')
    try { fs.appendFileSync(logFile, `${new Date().toISOString()} Unhandled rejection: ${message}\n${stack ?? ''}\n`) } catch { /* ignore */ }
  }
})
