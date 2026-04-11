import { useState, useEffect } from 'react'
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
export type Theme = 'dark' | 'light'

function getInitialTheme(): Theme {
  const stored = localStorage.getItem('theme')
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('calendar')
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header className="app-header">
        <h1>Meal &amp; Shopping Planner</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button
            type="button"
            className="win-btn"
            onClick={() => typeof window.vibemeal?.window?.minimize === 'function' && window.vibemeal.window.minimize()}
            title="Minimize"
          >
            &#8211;
          </button>
          <button
            type="button"
            className="win-btn win-close"
            onClick={() => typeof window.vibemeal?.window?.close === 'function' && window.vibemeal.window.close()}
            title="Close"
          >
            &#215;
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
        {activeTab === 'settings' && <Settings theme={theme} setTheme={setTheme} />}
        {activeTab === 'instructions' && <Instructions />}
      </main>
    </div>
  )
}

export default App
