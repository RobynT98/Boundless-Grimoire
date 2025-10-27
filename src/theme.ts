// Enkel temastore utan beroenden. Sätter data-theme på <html>
// och triggar en custom-event så vyn kan reagera.

export type ThemeKey = 'dark' | 'light' | 'parchment'

const THEME_KEY = 'grimoire-theme'

// Prenumeranter
type Listener = (t: ThemeKey) => void
const listeners = new Set<Listener>()

function apply(t: ThemeKey) {
  document.documentElement.setAttribute('data-theme', t)
  document.dispatchEvent(new CustomEvent('theme:changed', { detail: t }))
}

export const ThemeStore = {
  get(): ThemeKey {
    const saved = localStorage.getItem(THEME_KEY) as ThemeKey | null
    return saved || 'dark'
  },
  set(t: ThemeKey) {
    localStorage.setItem(THEME_KEY, t)
    apply(t)
    listeners.forEach(fn => fn(t))
  },
  subscribe(fn: Listener) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
  init() {
    apply(this.get())
  }
}