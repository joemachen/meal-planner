import { useState, useEffect } from 'react'
import type { Meal, MealIngredient, Category } from '../../types'

type SortOrder = 'a-z' | 'z-a'

export function MealLibrary() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [mealIngredientsMap, setMealIngredientsMap] = useState<Record<number, MealIngredient[]>>({})
  const [categories, setCategories] = useState<Category[]>([])
  const [sortOrder, setSortOrder] = useState<SortOrder>('a-z')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formIngredients, setFormIngredients] = useState<(MealIngredient & { categoryId?: number })[]>([])
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const defaultCategoryId = categories.find((c) => c.name === 'Other')?.id ?? categories[0]?.id ?? 1

  useEffect(() => {
    if (typeof window.vibemeal === 'undefined') return
    window.vibemeal.meals.list().then(setMeals).catch((e) => setError(String(e)))
    window.vibemeal.categories.list().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    if (typeof window.vibemeal === 'undefined' || meals.length === 0) return
    Promise.all(meals.map((m) => window.vibemeal.meals.getIngredients(m.id)))
      .then((results) => {
        const map: Record<number, MealIngredient[]> = {}
        meals.forEach((m, i) => { map[m.id] = results[i] ?? [] })
        setMealIngredientsMap(map)
      })
      .catch(() => {})
  }, [meals])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2800)
      return () => clearTimeout(t)
    }
  }, [toast])

  const loadMeals = () => {
    window.vibemeal.meals.list().then(setMeals).catch((e) => setError(String(e)))
  }

  const formatIngredients = (ingredients: MealIngredient[]): string => {
    if (!ingredients.length) return ''
    return ingredients.map((i) => `${i.quantity}× ${i.ingredientName}`).join(', ')
  }

  const startAdd = () => {
    setEditingId(null)
    setFormOpen(true)
    setFormTitle('')
    setFormIngredients([{ ingredientName: '', quantity: 1, categoryId: defaultCategoryId }])
  }

  const startEdit = async (meal: Meal) => {
    setEditingId(meal.id)
    setFormOpen(true)
    setFormTitle(meal.title)
    const ingredients = await window.vibemeal.meals.getIngredients(meal.id)
    setFormIngredients(
      ingredients.length > 0
        ? ingredients.map((i) => ({ ...i, categoryId: i.categoryId ?? defaultCategoryId }))
        : [{ ingredientName: '', quantity: 1, categoryId: defaultCategoryId }]
    )
  }

  const addIngredientRow = () => {
    setFormIngredients((prev) => [...prev, { ingredientName: '', quantity: 1, categoryId: defaultCategoryId }])
  }

  const removeIngredientRow = (index: number) => {
    setFormIngredients((prev) => prev.filter((_, i) => i !== index))
  }

  const updateIngredient = (index: number, field: 'ingredientName' | 'quantity' | 'categoryId', value: string | number) => {
    setFormIngredients((prev) => {
      const next = [...prev]
      if (field === 'quantity') next[index] = { ...next[index], quantity: Math.max(1, Number(value) || 1) }
      else if (field === 'categoryId') next[index] = { ...next[index], categoryId: Number(value) || defaultCategoryId }
      else next[index] = { ...next[index], ingredientName: String(value) }
      return next
    })
  }

  const saveMeal = async () => {
    setError(null)
    const title = formTitle.trim()
    if (!title) {
      setError('Title is required.')
      return
    }
    const ingredients = formIngredients
      .map((i) => ({
        ingredientName: i.ingredientName.trim(),
        quantity: i.quantity,
        categoryId: i.categoryId ?? defaultCategoryId,
      }))
      .filter((i) => i.ingredientName.length > 0)
    if (ingredients.length === 0) {
      setError('Add at least one ingredient.')
      return
    }
    try {
      if (editingId !== null) {
        await window.vibemeal.meals.update(editingId, title, ingredients)
      } else {
        await window.vibemeal.meals.create(title, ingredients)
      }
      setToast('Meal saved')
      setEditingId(null)
      setFormOpen(false)
      setFormTitle('')
      setFormIngredients([{ ingredientName: '', quantity: 1, categoryId: defaultCategoryId }])
      loadMeals()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const deleteMeal = async (id: number) => {
    if (!confirm('Delete this meal?')) return
    setError(null)
    try {
      await window.vibemeal.meals.delete(id)
      if (editingId === id) { setEditingId(null); setFormOpen(false); setFormTitle(''); setFormIngredients([{ ingredientName: '', quantity: 1, categoryId: defaultCategoryId }]) }
      loadMeals()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const showForm = formOpen || editingId !== null || formTitle !== '' || formIngredients.some((i) => i.ingredientName !== '')

  const sortedMeals = [...meals].sort((a, b) =>
    sortOrder === 'a-z'
      ? a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
      : b.title.localeCompare(a.title, undefined, { sensitivity: 'base' })
  )

  return (
    <div className="glass" style={{ padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Meal Library</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
        Add meals with a title and ingredients (name, quantity, category). Category determines where the ingredient appears on the shopping list.
      </p>
      {toast && (
        <div className="glass-strong" style={{ marginBottom: 12, padding: '10px 16px', borderRadius: 8, color: 'var(--accent)' }}>
          {toast}
        </div>
      )}
      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}

      {showForm && (
        <div className="glass-strong" style={{ padding: 20, marginBottom: 24 }}>
          <h3 style={{ marginTop: 0 }}>{editingId !== null ? 'Edit meal' : 'New meal'}</h3>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Title</label>
            <input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Tacos"
              style={{ width: '100%', maxWidth: 320 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Ingredients (name + quantity + category)</label>
            {formIngredients.map((ing, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="number"
                  min={1}
                  value={ing.quantity}
                  onChange={(e) => updateIngredient(i, 'quantity', e.target.value)}
                  style={{ width: 56 }}
                />
                <span style={{ color: 'var(--text-muted)' }}>×</span>
                <input
                  value={ing.ingredientName}
                  onChange={(e) => updateIngredient(i, 'ingredientName', e.target.value)}
                  placeholder="e.g. ground beef"
                  style={{ flex: 1, minWidth: 120 }}
                />
                <select
                  value={ing.categoryId ?? defaultCategoryId}
                  onChange={(e) => updateIngredient(i, 'categoryId', e.target.value)}
                  style={{ minWidth: 140 }}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                  ))}
                </select>
                <button type="button" onClick={() => removeIngredientRow(i)} className="danger" disabled={formIngredients.length <= 1}>
                  Remove
                </button>
              </div>
            ))}
            <button type="button" onClick={addIngredientRow}>+ Add ingredient</button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="primary" onClick={saveMeal}>
              {editingId !== null ? 'Update' : 'Add meal'}
            </button>
            <button type="button" onClick={() => { setEditingId(null); setFormOpen(false); setFormTitle(''); setFormIngredients([{ ingredientName: '', quantity: 1, categoryId: defaultCategoryId }]) }}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {!showForm && (
        <button type="button" className="primary" onClick={startAdd} style={{ marginBottom: 16 }}>
          Add meal
        </button>
      )}

      {meals.length > 0 && (
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Sort:</span>
          <button type="button" className={sortOrder === 'a-z' ? 'primary' : ''} onClick={() => setSortOrder('a-z')}>A–Z</button>
          <button type="button" className={sortOrder === 'z-a' ? 'primary' : ''} onClick={() => setSortOrder('z-a')}>Z–A</button>
        </div>
      )}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {sortedMeals.map((meal) => (
          <li
            key={meal.id}
            className="glass"
            style={{
              padding: '14px 16px',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong>{meal.title}</strong>
              <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 14 }}>
                (ID: {meal.id})
              </span>
              {mealIngredientsMap[meal.id]?.length ? (
                <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                  {formatIngredients(mealIngredientsMap[meal.id])}
                </span>
              ) : null}
            </div>
            <span>
              <button type="button" onClick={() => startEdit(meal)}>Edit</button>
              <button type="button" className="danger" onClick={() => deleteMeal(meal.id)} style={{ marginLeft: 8 }}>
                Delete
              </button>
            </span>
          </li>
        ))}
      </ul>
      {meals.length === 0 && !showForm && (
        <p style={{ color: 'var(--text-muted)' }}>No meals yet. Add one to get started.</p>
      )}
    </div>
  )
}
