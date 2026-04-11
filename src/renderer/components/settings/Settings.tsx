import { useState, useEffect } from 'react'
import type { Category } from '../../types'
import type { Theme } from '../../App'

interface SettingsProps {
  theme: Theme
  setTheme: (t: Theme) => void
}

export function Settings({ theme, setTheme }: SettingsProps) {
  const [dbPath, setDbPath] = useState<string>('')
  const [categories, setCategories] = useState<Category[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formEmoji, setFormEmoji] = useState('')
  const [formSortOrder, setFormSortOrder] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window.vibemeal === 'undefined') return
    window.vibemeal.settings.getDbPath().then(setDbPath).catch((e) => setError(String(e)))
    window.vibemeal.categories.list().then(setCategories).catch((e) => setError(String(e)))
  }, [])

  const loadCategories = () => {
    window.vibemeal.categories.list().then(setCategories).catch((e) => setError(String(e)))
  }

  const startAdd = () => {
    setEditingId(null)
    setFormName('')
    setFormEmoji('📦')
    setFormSortOrder(categories.length > 0 ? Math.max(...categories.map((c) => c.sortOrder)) + 10 : 10)
    setShowForm(true)
  }

  const startEdit = (c: Category) => {
    setEditingId(c.id)
    setFormName(c.name)
    setFormEmoji(c.emoji)
    setFormSortOrder(c.sortOrder)
    setShowForm(true)
  }

  const saveCategory = async () => {
    setError(null)
    try {
      if (editingId !== null) {
        await window.vibemeal.categories.update(editingId, formName.trim(), formEmoji.trim(), formSortOrder)
      } else {
        await window.vibemeal.categories.create(formName.trim(), formEmoji.trim(), formSortOrder)
      }
      setEditingId(null)
      setShowForm(false)
      loadCategories()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const deleteCategory = async (id: number) => {
    if (!confirm('Delete this category? Ingredients using it will move to Other.')) return
    setError(null)
    try {
      await window.vibemeal.categories.delete(id)
      loadCategories()
      if (editingId === id) { setEditingId(null); setShowForm(false) }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const handleBackup = async () => {
    setError(null)
    setMessage(null)
    try {
      const result = await window.vibemeal.settings.backupDb()
      if (result.success) setMessage('Backup saved successfully.')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const handleRestore = async () => {
    if (!confirm('Restore will replace ALL current data with the backup file. This cannot be undone. Continue?')) return
    setError(null)
    setMessage(null)
    try {
      await window.vibemeal.settings.restoreDb()
      // Page reloads automatically on success
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div className="glass" style={{ padding: 24, width: '100%', boxSizing: 'border-box' }}>
      <h2 style={{ marginTop: 0 }}>Settings</h2>

      <section style={{ marginBottom: 32 }}>
        <h3 style={{ marginBottom: 8 }}>Appearance</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            className={theme === 'dark' ? 'primary' : ''}
            onClick={() => setTheme('dark')}
          >
            🌙 Dark
          </button>
          <button
            type="button"
            className={theme === 'light' ? 'primary' : ''}
            onClick={() => setTheme('light')}
          >
            ☀️ Light
          </button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>
          Default follows your OS setting. Your choice is saved for next launch.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h3 style={{ marginBottom: 8 }}>Data</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>
          Database: <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: 4 }}>{dbPath || '…'}</code>
        </p>
        {error && <p style={{ color: 'var(--danger)', marginBottom: 8 }}>{error}</p>}
        {message && <p style={{ color: 'var(--success)', marginBottom: 8 }}>{message}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={handleBackup}>Backup database</button>
          <button type="button" className="danger" onClick={handleRestore}>Restore from backup…</button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>
          Backup saves a copy of your database to a file. Restore replaces all current data with a previously saved backup.
        </p>
      </section>

      <section>
        <h3 style={{ marginBottom: 8 }}>Categories</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
          Manage ingredient categories for the shopping list. Deleting a category moves its ingredients to &quot;Other&quot;.
        </p>

        {showForm && (
          <div className="glass-strong" style={{ padding: 16, marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <input
              placeholder="Name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              style={{ width: 160 }}
            />
            <input
              placeholder="Emoji"
              value={formEmoji}
              onChange={(e) => setFormEmoji(e.target.value)}
              style={{ width: 56 }}
            />
            <input
              type="number"
              placeholder="Sort"
              value={formSortOrder}
              onChange={(e) => setFormSortOrder(parseInt(e.target.value, 10) || 0)}
              style={{ width: 144 }}
            />
            <button type="button" className="primary" onClick={saveCategory}>
              {editingId !== null ? 'Update' : 'Add'}
            </button>
            <button type="button" onClick={() => { setEditingId(null); setShowForm(false) }}>Cancel</button>
          </div>
        )}
        {!showForm && (
          <button type="button" className="primary" onClick={startAdd} style={{ marginBottom: 16 }}>
            Add category
          </button>
        )}

        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {categories.map((c) => (
            <li
              key={c.id}
              className="glass"
              style={{
                padding: '12px 16px',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <span>
                <span style={{ marginRight: 8 }}>{c.emoji}</span>
                <strong>{c.name}</strong>
                <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>(order: {c.sortOrder})</span>
              </span>
              <span>
                <button type="button" onClick={() => startEdit(c)}>Edit</button>
                <button type="button" className="danger" onClick={() => deleteCategory(c.id)} style={{ marginLeft: 8 }}>
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
