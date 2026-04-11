declare const __APP_VERSION__: string

const GITHUB_RELEASES_URL = 'https://github.com/joemachen/meal-planner/releases'

export function Instructions() {
  return (
    <div className="glass" style={{ padding: 24, width: '100%', boxSizing: 'border-box' }}>
      <h2 style={{ marginTop: 0 }}>Instructions</h2>

      <section style={{ marginBottom: 28 }}>
        <h3 style={{ marginBottom: 8 }}>About</h3>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Meal &amp; Shopping Planner is a personal desktop app for planning weekly meals and generating
          a grouped shopping list. Plan lunches and dinners for each day of the week, maintain a library
          of meals with their ingredients, track household essentials, and export your shopping list with
          one click.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h3 style={{ marginBottom: 12 }}>Getting Started</h3>
        <ol style={{ color: 'var(--text-muted)', lineHeight: 2, paddingLeft: 20 }}>
          <li>
            <strong style={{ color: 'var(--text)' }}>Add meals</strong> — Go to <em>Meal Library</em> and
            create your meals with ingredients and quantities.
          </li>
          <li>
            <strong style={{ color: 'var(--text)' }}>Plan the week</strong> — In <em>Weekly Calendar</em>,
            click any cell to assign a meal, pick "Order in / Dine out / Leftovers", or type a free note.
          </li>
          <li>
            <strong style={{ color: 'var(--text)' }}>Check Single Items</strong> — Toggle on any household
            staples you need this week (e.g. paper towels, dish soap).
          </li>
          <li>
            <strong style={{ color: 'var(--text)' }}>View Shopping List</strong> — Your full shopping list
            is automatically generated from the week's meals plus active single items, grouped by category.
          </li>
        </ol>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h3 style={{ marginBottom: 12 }}>Tab Guide</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {[
            { label: 'Weekly Calendar', desc: 'Plan lunches and dinners for the current Sat–Fri week. Save named favourite plans and restore them any time.' },
            { label: 'Meal Library', desc: 'Create and edit meals with ingredient names, quantities, and shopping categories.' },
            { label: 'Single Items', desc: 'Manage recurring household items. Toggle them on or off each week to include them in the shopping list.' },
            { label: 'Shopping List', desc: 'Auto-generated from the planned meals and active single items. Grouped by category. Copy to clipboard or export to a text file.' },
            { label: 'Settings', desc: 'Manage ingredient categories. Backup your database to a file and restore from a previous backup.' },
          ].map(({ label, desc }) => (
            <li
              key={label}
              className="glass"
              style={{ padding: '12px 16px', marginBottom: 8, display: 'flex', gap: 12, alignItems: 'flex-start' }}
            >
              <strong style={{ minWidth: 160, flexShrink: 0 }}>{label}</strong>
              <span style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</span>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h3 style={{ marginBottom: 8 }}>Tips</h3>
        <ul style={{ color: 'var(--text-muted)', lineHeight: 1.9, paddingLeft: 20 }}>
          <li>Assign ingredient categories in the Meal Library when creating a meal — the Shopping List will group them automatically.</li>
          <li>Use <em>Favourite calendar</em> in the Weekly Calendar to save a week you liked and restore it any time.</li>
          <li>Single Items can each have a category too, so they appear in the right section of the shopping list.</li>
          <li>The shopping list's <em>Copy to clipboard</em> button produces plain text you can paste into any messaging or notes app.</li>
          <li>Back up your database regularly from the Settings tab — it contains all your meals, plans, and history.</li>
        </ul>
      </section>

      <section>
        <h3 style={{ marginBottom: 8 }}>Updates</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
          Download the latest version from the GitHub releases page:
        </p>
        <a
          href={GITHUB_RELEASES_URL}
          target="_blank"
          rel="noreferrer"
          style={{ color: 'var(--accent)', textDecoration: 'underline', wordBreak: 'break-all' }}
          onClick={(e) => {
            e.preventDefault()
            // In Electron, window.open opens in the system browser
            window.open(GITHUB_RELEASES_URL, '_blank')
          }}
        >
          {GITHUB_RELEASES_URL}
        </a>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 20 }}>
          Version {typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0'}
        </p>
      </section>
    </div>
  )
}
