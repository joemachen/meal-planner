import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Categories CRUD
  categories: {
    list: () => ipcRenderer.invoke('categories:list'),
    create: (name: string, emoji: string, sortOrder: number) => ipcRenderer.invoke('categories:create', name, emoji, sortOrder),
    update: (id: number, name: string, emoji: string, sortOrder: number) => ipcRenderer.invoke('categories:update', id, name, emoji, sortOrder),
    delete: (id: number) => ipcRenderer.invoke('categories:delete', id),
  },
  // Meals
  meals: {
    list: () => ipcRenderer.invoke('meals:list'),
    get: (id: number) => ipcRenderer.invoke('meals:get', id),
    getIngredients: (mealId: number) => ipcRenderer.invoke('meals:getIngredients', mealId),
    create: (title: string, ingredients: { ingredientName: string; quantity: number; categoryId: number }[]) => ipcRenderer.invoke('meals:create', title, ingredients),
    update: (id: number, title: string, ingredients: { ingredientName: string; quantity: number; categoryId: number }[]) => ipcRenderer.invoke('meals:update', id, title, ingredients),
    delete: (id: number) => ipcRenderer.invoke('meals:delete', id),
  },
  // Calendar
  calendar: {
    getCurrentWeekStart: () => ipcRenderer.invoke('calendar:getCurrentWeekStart'),
    getSlots: (weekStart: string) => ipcRenderer.invoke('calendar:getSlots', weekStart),
    setSlot: (weekStart: string, dayOfWeek: number, slot: string, valueType: string, value: string | null) =>
      ipcRenderer.invoke('calendar:setSlot', weekStart, dayOfWeek, slot, valueType, value),
    clearWeek: (weekStart: string) => ipcRenderer.invoke('calendar:clearWeek', weekStart),
    saveWeek: (weekStart: string, slots: { dayOfWeek: number; slot: string; valueType: string; value: string | null }[]) =>
      ipcRenderer.invoke('calendar:saveWeek', weekStart, slots),
  },
  // Favourite meal plans
  favourites: {
    list: () => ipcRenderer.invoke('favourites:list'),
    create: (name: string, slots: { dayOfWeek: number; slot: string; valueType: string; value: string | null }[]) =>
      ipcRenderer.invoke('favourites:create', name, slots),
    getSlots: (id: number) => ipcRenderer.invoke('favourites:getSlots', id),
    delete: (id: number) => ipcRenderer.invoke('favourites:delete', id),
  },
  // Essentials
  essentials: {
    list: () => ipcRenderer.invoke('essentials:list'),
    create: (name: string, isActive: boolean, sortOrder: number, categoryId: number) => ipcRenderer.invoke('essentials:create', name, isActive, sortOrder, categoryId),
    update: (id: number, name: string, isActive: boolean, sortOrder: number, categoryId: number) => ipcRenderer.invoke('essentials:update', id, name, isActive, sortOrder, categoryId),
    delete: (id: number) => ipcRenderer.invoke('essentials:delete', id),
    setActive: (id: number, isActive: boolean) => ipcRenderer.invoke('essentials:setActive', id, isActive),
  },
  // Shopping
  shopping: {
    generate: (weekStart: string) => ipcRenderer.invoke('shopping:generate', weekStart),
    setIngredientCategory: (ingredientName: string, categoryId: number) => ipcRenderer.invoke('shopping:setIngredientCategory', ingredientName, categoryId),
  },
  // Settings
  settings: {
    getDbPath: () => ipcRenderer.invoke('settings:getDbPath'),
    backupDb: () => ipcRenderer.invoke('settings:backupDb'),
    restoreDb: () => ipcRenderer.invoke('settings:restoreDb'),
  },
  // Window (frameless)
  window: {
    close: () => ipcRenderer.send('window:close'),
    minimize: () => ipcRenderer.send('window:minimize'),
  },
}

contextBridge.exposeInMainWorld('vibemeal', api)
