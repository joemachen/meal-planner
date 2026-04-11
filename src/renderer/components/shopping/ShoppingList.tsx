import { useState, useEffect } from 'react'
import type { GroupedItem } from '../../types'

function formatList(groups: GroupedItem[]): string {
  const lines: string[] = []
  for (const g of groups) {
    lines.push(`${g.emoji} ${g.categoryName}`)
    for (const item of g.items) {
      const qty = item.quantity > 1 ? ` ${item.quantity}x` : ''
      lines.push(`  • ${item.name}${qty}`)
    }
    lines.push('')
  }
  return lines.join('\n').trimEnd()
}

export function ShoppingList() {
  const [weekStart, setWeekStart] = useState<string>('')
  const [groups, setGroups] = useState<GroupedItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof window.vibemeal === 'undefined') return
    window.vibemeal.calendar.getCurrentWeekStart().then(setWeekStart)
  }, [])

  const refresh = () => {
    if (!weekStart || typeof window.vibemeal === 'undefined') return
    setError(null)
    window.vibemeal.shopping.generate(weekStart).then(setGroups).catch((e) => setError(String(e)))
  }

  useEffect(() => {
    refresh()
  }, [weekStart])

  const text = formatList(groups)

  const copyToClipboard = async () => {
    setError(null)
    setCopied(false)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const exportFile = () => {
    setError(null)
    try {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vibemeal-shopping-${weekStart || 'list'}.txt`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div className="glass" style={{ padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Shopping List</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
        Generated from this week&apos;s calendar (meals assigned) and active Single Items. Duplicate ingredients are combined.
      </p>
      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button type="button" onClick={refresh}>Refresh</button>
        <button type="button" className="primary" onClick={copyToClipboard} disabled={groups.length === 0}>
          {copied ? 'Copied!' : 'Copy to clipboard'}
        </button>
        <button type="button" onClick={exportFile} disabled={groups.length === 0}>
          Export as .txt
        </button>
      </div>

      {!weekStart ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
      ) : groups.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>
          No items yet. Assign meals to the Weekly Calendar and/or turn on &quot;Include in next list&quot; for Single Items, then come back here.
        </p>
      ) : (
        <pre
          className="glass-strong"
          style={{
            padding: 20,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            margin: 0,
            maxHeight: 480,
            overflow: 'auto',
          }}
        >
          {text || '(Empty list)'}
        </pre>
      )}
    </div>
  )
}
