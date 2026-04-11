import { useState, useEffect } from 'react'
import type { Essential, Category } from '../../types'

export function HouseholdEssentials() {
  const [essentials, setEssentials] = useState<Essential[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [formName, setFormName] = useState('')
  const [formCategoryId, setFormCategoryId] = useState<number>(1)
  const [error, setError] = useState<string | null>(null)

  const defaultCategoryId = categories.find((c) => c.name === 'Other')?.id ?? categories[0]?.id ?? 1

  useEffect(() => {
    if (typeof window.vibemeal === 'undefined') return
    window.vibemeal.essentials.list().then(setEssentials).catch((e) => setError(String(e)))
    window.vibemeal.categories.list().then(setCategories).catch(() => {})
  }, [])

  const loadEssentials = () => {
    window.vibemeal.essentials.list().then(setEssentials).catch((e) => setError(String(e)))
  }

  const startAdd = () => {
    setEditingId(null)
    setFormOpen(true)
    setFormName('')
    setFormCategoryId(defaultCategoryId)
  }

  const startEdit = (e: Essential) => {
    setEditingId(e.id)
    setFormOpen(true)
    setFormName(e.name)
    setFormCategoryId(e.categoryId ?? defaultCategoryId)
  }

  const saveEssential = async () => {
    setError(null)
    const name = formName.trim()
    if (!name) {
      setError('Name is required.')
      return
    }
    const categoryId = formCategoryId ?? defaultCategoryId
    try {
      if (editingId !== null) {
        const existing = essentials.find((x) => x.id === editingId)
        await window.vibemeal.essentials.update(editingId, name, existing?.isActive === 1, existing?.sortOrder ?? 0, categoryId)
      } else {
        await window.vibemeal.essentials.create(name, true, essentials.length > 0 ? Math.max(...essentials.map((x) => x.sortOrder)) + 10 : 10, categoryId)
      }
      setEditingId(null)
      setFormOpen(false)
      setFormName('')
      loadEssentials()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const deleteEssential = async (id: number) => {
    if (!confirm('Remove this item?')) return
    setError(null)
    try {
      await window.vibemeal.essentials.delete(id)
      if (editingId === id) { setEditingId(null); setFormOpen(false); setFormName('') }
      loadEssentials()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const toggleActive = async (id: number, isActive: boolean) => {
    setError(null)
    try {
      await window.vibemeal.essentials.setActive(id, isActive)
      loadEssentials()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const showForm = formOpen || editingId !== null || formName !== ''

  return (
    <div className="glass" style={{ padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Single Items</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
        Non-food items (e.g. cat litter, soap). Choose a category for the shopping list. Toggle &quot;Include in next list&quot; to add or omit.
      </p>
      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}

      {showForm && (
        <div className="glass-strong" style={{ padding: 20, marginBottom: 24 }}>
          <h3 style={{ marginTop: 0 }}>{editingId !== null ? 'Edit item' : 'New item'}</h3>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Name</label>
            <input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Cat litter"
              style={{ width: '100%', maxWidth: 320 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Category (for shopping list)</label>
            <select value={formCategoryId} onChange={(e) => setFormCategoryId(Number(e.target.value))} style={{ minWidth: 200 }}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="primary" onClick={saveEssential}>
              {editingId !== null ? 'Update' : 'Add'}
            </button>
            <button type="button" onClick={() => { setEditingId(null); setFormOpen(false); setFormName('') }}>Cancel</button>
          </div>
        </div>
      )}
      {!showForm && (
        <button type="button" className="primary" onClick={startAdd} style={{ marginBottom: 16 }}>
          Add item
        </button>
      )}

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {essentials.map((e) => (
          <li
            key={e.id}
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
            <span style={{ flex: 1 }}>
              {e.name}
              {(() => {
                const cat = categories.find((c) => c.id === e.categoryId)
                return cat ? (
                  <span style={{ marginLeft: 8, fontSize: 14, color: 'var(--text-muted)' }}>
                    {cat.emoji} {cat.name}
                  </span>
                ) : null
              })()}
            </span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={e.isActive === 1}
                onChange={(ev) => toggleActive(e.id, ev.target.checked)}
              />
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Include in next list</span>
            </label>
            <span>
              <button type="button" onClick={() => startEdit(e)}>Edit</button>
              <button type="button" className="danger" onClick={() => deleteEssential(e.id)} style={{ marginLeft: 8 }}>
                Delete
              </button>
            </span>
          </li>
        ))}
      </ul>
      {essentials.length === 0 && !showForm && (
        <p style={{ color: 'var(--text-muted)' }}>No essentials yet. Add items like cat litter or paper towels.</p>
      )}
    </div>
  )
}
