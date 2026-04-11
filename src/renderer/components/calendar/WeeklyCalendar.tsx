import { useState, useEffect } from 'react'
import type { Meal, CalendarSlot, FavouriteMealPlan } from '../../types'

const DAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const
const SLOTS = ['lunch', 'dinner'] as const
const SPECIAL_OPTIONS = [
  { value: 'ORDER', label: 'Order in' },
  { value: 'DINE_OUT', label: 'Dine out' },
  { value: 'LEFTOVERS', label: 'Leftovers' },
] as const

function slotKey(dayOfWeek: number, slot: string): string {
  return `${dayOfWeek}-${slot}`
}

export function WeeklyCalendar() {
  const [weekStart, setWeekStart] = useState<string>('')
  const [slots, setSlots] = useState<CalendarSlot[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [editValueType, setEditValueType] = useState<'meal' | 'special' | 'text'>('meal')
  const [editMealId, setEditMealId] = useState<string>('')
  const [editSpecial, setEditSpecial] = useState<string>('ORDER')
  const [editText, setEditText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [favourites, setFavourites] = useState<FavouriteMealPlan[]>([])
  const [showFavouriteModal, setShowFavouriteModal] = useState(false)
  const [favouritePlanName, setFavouritePlanName] = useState('')

  useEffect(() => {
    if (typeof window.vibemeal === 'undefined') return
    window.vibemeal.calendar.getCurrentWeekStart().then(setWeekStart)
    window.vibemeal.meals.list().then(setMeals)
  }, [])

  useEffect(() => {
    if (!weekStart || typeof window.vibemeal === 'undefined') return
    window.vibemeal.calendar.getSlots(weekStart).then(setSlots).catch((e) => setError(String(e)))
  }, [weekStart])

  useEffect(() => {
    if (typeof window.vibemeal?.favourites?.list === 'undefined') return
    window.vibemeal.favourites.list().then(setFavourites).catch(() => setFavourites([]))
  }, [])

  const slotMap = slots.reduce<Record<string, CalendarSlot>>((acc, s) => {
    acc[slotKey(s.dayOfWeek, s.slot)] = s
    return acc
  }, {})

  const getDisplayLabel = (s: CalendarSlot | undefined): string => {
    if (!s) return '—'
    if (s.valueType === 'meal' && s.value) {
      const meal = meals.find((m) => String(m.id) === s.value)
      return meal?.title ?? `Meal #${s.value}`
    }
    if (s.valueType === 'special') {
      const opt = SPECIAL_OPTIONS.find((o) => o.value === s.value)
      return opt?.label ?? s.value ?? '—'
    }
    if (s.valueType === 'text' && s.value) return s.value
    return '—'
  }

  const openEditor = (dayOfWeek: number, slot: string) => {
    const key = slotKey(dayOfWeek, slot)
    const s = slotMap[key]
    setEditing(key)
    if (s?.valueType === 'meal' && s.value) {
      setEditValueType('meal')
      setEditMealId(s.value)
      setEditSpecial('ORDER')
      setEditText('')
    } else if (s?.valueType === 'special') {
      setEditValueType('special')
      setEditMealId('')
      setEditSpecial(s.value ?? 'ORDER')
      setEditText('')
    } else if (s?.valueType === 'text' && s.value) {
      setEditValueType('text')
      setEditMealId('')
      setEditSpecial('ORDER')
      setEditText(s.value)
    } else {
      setEditValueType('meal')
      setEditMealId('')
      setEditSpecial('ORDER')
      setEditText('')
    }
  }

  const saveSlot = async () => {
    if (editing === null || !weekStart) return
    setError(null)
    const [dayStr, slot] = editing.split('-')
    const dayOfWeek = parseInt(dayStr, 10)
    let valueType: 'meal' | 'special' | 'text' = editValueType
    let value: string | null = null
    if (editValueType === 'meal' && editMealId) {
      valueType = 'meal'
      value = editMealId
    } else if (editValueType === 'special') {
      valueType = 'special'
      value = editSpecial
    } else if (editValueType === 'text') {
      valueType = 'text'
      value = editText.trim() || null
    }
    try {
      await window.vibemeal.calendar.setSlot(weekStart, dayOfWeek, slot, valueType, value)
      const updated = await window.vibemeal.calendar.getSlots(weekStart)
      setSlots(updated)
      setEditing(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const clearWeek = async () => {
    if (!weekStart || !confirm('Clear all slots for this week?')) return
    setError(null)
    setSaveMessage(null)
    try {
      await window.vibemeal.calendar.clearWeek(weekStart)
      setSlots([])
      setEditing(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const saveCalendar = async () => {
    if (!weekStart || typeof window.vibemeal?.calendar?.saveWeek !== 'function') return
    setError(null)
    setSaveMessage(null)
    try {
      const payload = slots.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        slot: s.slot,
        valueType: s.valueType,
        value: s.value,
      }))
      await window.vibemeal.calendar.saveWeek(weekStart, payload)
      setSaveMessage('Calendar saved')
      window.setTimeout(() => setSaveMessage(null), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const loadFavourites = () => {
    window.vibemeal.favourites?.list?.().then(setFavourites).catch(() => setFavourites([]))
  }

  const openFavouriteModal = () => {
    setFavouritePlanName('')
    setShowFavouriteModal(true)
  }

  const saveFavourite = async () => {
    const name = favouritePlanName.trim()
    if (!name) return
    setError(null)
    try {
      const payload = slots.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        slot: s.slot,
        valueType: s.valueType,
        value: s.value,
      }))
      await window.vibemeal.favourites.create(name, payload)
      setShowFavouriteModal(false)
      setFavouritePlanName('')
      loadFavourites()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const restoreFavourite = async (id: number) => {
    if (!weekStart) return
    setError(null)
    try {
      const favSlots = await window.vibemeal.favourites.getSlots(id)
      await window.vibemeal.calendar.saveWeek(weekStart, favSlots)
      const updated = await window.vibemeal.calendar.getSlots(weekStart)
      setSlots(updated)
      setSaveMessage('Meal plan restored')
      window.setTimeout(() => setSaveMessage(null), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const deleteFavourite = async (id: number) => {
    if (!confirm('Delete this favourite meal plan?')) return
    setError(null)
    try {
      await window.vibemeal.favourites.delete(id)
      loadFavourites()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const formatFavouriteDate = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    } catch {
      return iso
    }
  }

  if (!weekStart) return <div className="glass" style={{ padding: 24 }}><p>Loading week…</p></div>

  return (
    <div className="glass" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ marginTop: 0 }}>Weekly Calendar</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {saveMessage && <span style={{ color: 'var(--success, green)', fontWeight: 500 }}>{saveMessage}</span>}
          <button type="button" className="primary" onClick={saveCalendar}>Save calendar</button>
          <button type="button" onClick={openFavouriteModal}>Favourite calendar</button>
          <button type="button" className="danger" onClick={clearWeek}>Clear calendar</button>
        </div>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
        This week (Saturday → Friday). Click a cell to set Lunch or Dinner: pick a meal, Order in / Dine out / Leftovers, or type (e.g. Zaxby&apos;s).
      </p>
      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}

      {showFavouriteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowFavouriteModal(false)}
        >
          <div
            className="glass-strong"
            style={{ padding: 24, minWidth: 320, borderRadius: 12 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Name this meal plan</h3>
            <input
              value={favouritePlanName}
              onChange={(e) => setFavouritePlanName(e.target.value)}
              placeholder="e.g. Week of 6 Mar"
              style={{ width: '100%', marginBottom: 16, padding: '8px 12px', boxSizing: 'border-box' }}
              onKeyDown={(e) => e.key === 'Enter' && saveFavourite()}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="primary" onClick={saveFavourite}>Save</button>
              <button type="button" onClick={() => setShowFavouriteModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {editing !== null && (
        <div className="glass-strong" style={{ padding: 20, marginBottom: 24 }}>
          <h3 style={{ marginTop: 0 }}>Edit slot</h3>
          <div style={{ marginBottom: 12 }}>
            <label style={{ marginRight: 12 }}>
              <input type="radio" checked={editValueType === 'meal'} onChange={() => setEditValueType('meal')} /> Meal from library
            </label>
            <label style={{ marginRight: 12 }}>
              <input type="radio" checked={editValueType === 'special'} onChange={() => setEditValueType('special')} /> Order in / Dine out / Leftovers
            </label>
            <label>
              <input type="radio" checked={editValueType === 'text'} onChange={() => setEditValueType('text')} /> Free text
            </label>
          </div>
          {editValueType === 'meal' && (
            <div style={{ marginBottom: 12 }}>
              <select value={editMealId} onChange={(e) => setEditMealId(e.target.value)} style={{ minWidth: 200 }}>
                <option value="">— Select meal —</option>
                {meals.map((m) => (
                  <option key={m.id} value={String(m.id)}>{m.title}</option>
                ))}
              </select>
            </div>
          )}
          {editValueType === 'special' && (
            <div style={{ marginBottom: 12 }}>
              <select value={editSpecial} onChange={(e) => setEditSpecial(e.target.value)} style={{ minWidth: 160 }}>
                {SPECIAL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
          {editValueType === 'text' && (
            <div style={{ marginBottom: 12 }}>
              <input value={editText} onChange={(e) => setEditText(e.target.value)} placeholder="e.g. Zaxby's" style={{ minWidth: 200 }} />
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="primary" onClick={saveSlot}>Save</button>
            <button type="button" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid var(--glass-border)' }}>Day</th>
              <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid var(--glass-border)' }}>Lunch</th>
              <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid var(--glass-border)' }}>Dinner</th>
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, dayOfWeek) => (
              <tr key={day}>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--glass-border)', fontWeight: 600 }}>{day}</td>
                {SLOTS.map((slot) => {
                  const key = slotKey(dayOfWeek, slot)
                  const s = slotMap[key]
                  const label = getDisplayLabel(s)
                  return (
                    <td key={key} style={{ padding: '8px', borderBottom: '1px solid var(--glass-border)' }}>
                      <button
                        type="button"
                        className="glass"
                        onClick={() => openEditor(dayOfWeek, slot)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '10px 12px',
                          minHeight: 44,
                          color: label === '—' ? 'var(--text-muted)' : 'var(--text)',
                        }}
                      >
                        {label}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section style={{ marginTop: 32 }}>
        <h3 style={{ marginBottom: 12 }}>Favourite meal plans</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>
          Save the current week as a named plan, then restore it anytime to apply those meals to the current week.
        </p>
        {favourites.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No favourite meal plans yet. Use &quot;Favourite calendar&quot; to save one.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 400 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid var(--glass-border)' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid var(--glass-border)' }}>Date created/updated</th>
                  <th style={{ textAlign: 'right', padding: '10px 8px', borderBottom: '1px solid var(--glass-border)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {favourites.map((f) => (
                  <tr key={f.id} className="glass" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '12px 8px' }}><strong>{f.name}</strong></td>
                    <td style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: 14 }}>{formatFavouriteDate(f.updatedAt)}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <button type="button" className="primary" onClick={() => restoreFavourite(f.id)} style={{ marginRight: 8 }}>Restore meal plan</button>
                      <button type="button" className="danger" onClick={() => deleteFavourite(f.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
