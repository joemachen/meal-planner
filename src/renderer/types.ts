export interface Category {
  id: number
  name: string
  emoji: string
  sortOrder: number
}

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

export interface CalendarSlot {
  id: number
  weekStart: string
  dayOfWeek: number
  slot: 'lunch' | 'dinner'
  valueType: 'meal' | 'special' | 'text'
  value: string | null
}

export interface Essential {
  id: number
  name: string
  isActive: number
  sortOrder: number
  categoryId: number
}

export interface GroupedItem {
  categoryId: number
  categoryName: string
  emoji: string
  sortOrder: number
  items: { name: string; quantity: number }[]
}

export interface FavouriteMealPlan {
  id: number
  name: string
  createdAt: string
  updatedAt: string
}

declare global {
  interface Window {
    vibemeal: {
      categories: {
        list: () => Promise<Category[]>
        create: (name: string, emoji: string, sortOrder: number) => Promise<Category>
        update: (id: number, name: string, emoji: string, sortOrder: number) => Promise<Category | null>
        delete: (id: number) => Promise<boolean>
      }
      meals: {
        list: () => Promise<Meal[]>
        get: (id: number) => Promise<Meal | null>
        getIngredients: (mealId: number) => Promise<MealIngredient[]>
        create: (title: string, ingredients: { ingredientName: string; quantity: number; categoryId: number }[]) => Promise<Meal>
        update: (id: number, title: string, ingredients: { ingredientName: string; quantity: number; categoryId: number }[]) => Promise<Meal | null>
        delete: (id: number) => Promise<boolean>
      }
      calendar: {
        getCurrentWeekStart: () => Promise<string>
        getSlots: (weekStart: string) => Promise<CalendarSlot[]>
        setSlot: (weekStart: string, dayOfWeek: number, slot: string, valueType: string, value: string | null) => Promise<void>
        clearWeek: (weekStart: string) => Promise<void>
        saveWeek: (weekStart: string, slots: { dayOfWeek: number; slot: string; valueType: string; value: string | null }[]) => Promise<void>
      }
      favourites: {
        list: () => Promise<FavouriteMealPlan[]>
        create: (name: string, slots: { dayOfWeek: number; slot: string; valueType: string; value: string | null }[]) => Promise<FavouriteMealPlan>
        getSlots: (id: number) => Promise<{ dayOfWeek: number; slot: string; valueType: string; value: string | null }[]>
        delete: (id: number) => Promise<boolean>
      }
      essentials: {
        list: () => Promise<Essential[]>
        create: (name: string, isActive: boolean, sortOrder: number, categoryId: number) => Promise<Essential>
        update: (id: number, name: string, isActive: boolean, sortOrder: number, categoryId: number) => Promise<Essential | null>
        delete: (id: number) => Promise<boolean>
        setActive: (id: number, isActive: boolean) => Promise<Essential | null>
      }
      shopping: {
        generate: (weekStart: string) => Promise<GroupedItem[]>
        setIngredientCategory: (ingredientName: string, categoryId: number) => Promise<void>
      }
      settings: {
        getDbPath: () => Promise<string>
        backupDb: () => Promise<{ success: boolean }>
        restoreDb: () => Promise<{ success: boolean }>
      }
      window: {
        close: () => void
        minimize: () => void
      }
    }
  }
}

export {}
