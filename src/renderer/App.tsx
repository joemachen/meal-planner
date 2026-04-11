import { useState } from 'react'
import { WeeklyCalendar } from './components/calendar/WeeklyCalendar'
import { MealLibrary } from './components/meals/MealLibrary'
import { HouseholdEssentials } from './components/essentials/HouseholdEssentials'
import { ShoppingList } from './components/shopping/ShoppingList'
import { Settings } from './components/settings/Settings'
import { Instructions } from './components/instructions/Instructions'

const TABS = [
  { id: 'calendar', label: 'Weekly Calendar' },
  { id: 'meals', label: 'Meal Library' },
  { id: 'essentials', label: 'Single Items' },
  { id: 'shopping', label: 'Shopping List' },
  { id: 'settings', label: 'Settings' },
  { id: 'instructions', label: 'Instructions' },
] as const

type TabId = (typeof TABS)[number]['id']

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('calendar')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header
        className="glass"
        style={{
          padding: '10px 16px 10px 12px',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          WebkitAppRegion: 'drag',
          appRegion: 'drag',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Meal & Shopping Planner</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, WebkitAppRegion: 'no-drag', appRegion: 'no-drag' }}>
          <button
            type="button"
            onClick={() => typeof window.vibemeal?.window?.minimize === 'function' && window.vibemeal.window.minimize()}
            style={{ width: 36, height: 28, padding: 0, fontSize: 16, lineHeight: 1 }}
            title="Minimize"
          >
            –
          </button>
          <button
            type="button"
            onClick={() => typeof window.vibemeal?.window?.close === 'function' && window.vibemeal.window.close()}
            style={{ width: 36, height: 28, padding: 0, fontSize: 16, lineHeight: 1, color: 'var(--text)' }}
            title="Close"
          >
            ×
          </button>
        </div>
      </header>
      <nav className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <main className="tab-panel">
        {activeTab === 'calendar' && <WeeklyCalendar />}
        {activeTab === 'meals' && <MealLibrary />}
        {activeTab === 'essentials' && <HouseholdEssentials />}
        {activeTab === 'shopping' && <ShoppingList />}
        {activeTab === 'settings' && <Settings />}
        {activeTab === 'instructions' && <Instructions />}
      </main>
    </div>
  )
}

export default App
