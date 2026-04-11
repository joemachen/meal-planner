import { getDb } from './index'

export type SlotType = 'lunch' | 'dinner'
export type ValueType = 'meal' | 'special' | 'text'

export interface CalendarSlot {
  id: number
  weekStart: string
  dayOfWeek: number
  slot: SlotType
  valueType: ValueType
  value: string | null
}

function getSaturdayOfWeek(d: Date): string {
  const day = d.getDay()
  const satOffset = day === 6 ? 0 : -(day + 1)
  const sat = new Date(d)
  sat.setDate(d.getDate() + satOffset)
  return sat.toISOString().slice(0, 10)
}

export function getCurrentWeekStart(): string {
  return getSaturdayOfWeek(new Date())
}

export function getSlots(weekStart: string): CalendarSlot[] {
  const db = getDb()
  const rows = db.prepare(
    'SELECT id, weekStart, dayOfWeek, slot, valueType, value FROM calendar_slots WHERE weekStart = ? ORDER BY dayOfWeek, slot'
  ).all(weekStart) as CalendarSlot[]
  return rows
}

export function setSlot(weekStart: string, dayOfWeek: number, slot: SlotType, valueType: ValueType, value: string | null): void {
  const db = getDb()
  db.prepare(
    `INSERT INTO calendar_slots (weekStart, dayOfWeek, slot, valueType, value)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(weekStart, dayOfWeek, slot) DO UPDATE SET valueType = excluded.valueType, value = excluded.value`
  ).run(weekStart, dayOfWeek, slot, valueType, value ?? '')
}

export function clearWeek(weekStart: string): void {
  const db = getDb()
  db.prepare('DELETE FROM calendar_slots WHERE weekStart = ?').run(weekStart)
}

export interface SlotPayload {
  dayOfWeek: number
  slot: SlotType
  valueType: ValueType
  value: string | null
}

export function saveWeek(weekStart: string, slots: SlotPayload[]): void {
  const db = getDb()
  const stmt = db.prepare(
    `INSERT INTO calendar_slots (weekStart, dayOfWeek, slot, valueType, value)
     VALUES (?, ?, ?, ?, ?)`
  )
  const run = db.transaction(() => {
    db.prepare('DELETE FROM calendar_slots WHERE weekStart = ?').run(weekStart)
    for (const s of slots) {
      stmt.run(weekStart, s.dayOfWeek, s.slot, s.valueType, s.value ?? '')
    }
  })
  run()
}
