import { useEffect, useState } from 'react'
import { getSettings, saveSettings, exportAll, importAll } from '../db'
import type { Settings } from '../types'
import { ThemeStore, type ThemeKey } from '../theme'

export default function SettingsPage() {
  const [s, setS] = useState<Settings>({ theme: 'dark', language: 'sv' })

  useEffect(() => {
    ;(async () => {
      const loaded = await getSettings()
      setS(loaded)
      // säkerställ att ThemeStore speglar DB-värdet
      ThemeStore.set(loaded.theme as ThemeKey)
    })()
  }, [])

  async function setTheme(t: ThemeKey) {
    const next = { ...s, theme: t }
    setS(next)
    ThemeStore.set(t)
    await saveSettings(next)
  }

  async function setLanguage(lang: 'sv' | 'en') {
    const next = { ...s, language: lang }
    setS(next)
    await saveSettings(next)
  }

  async function onExport() {
    const blob = await exportAll()
    const a = document.createElement('a')
    const url = URL.createObjectURL(new Blob([JSON.stringify(blob, null, 2)], { type: 'application/json' }))
    a.href = url
    a.download = 'boundless-grimoire-backup.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function onImport(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0]
    if (!file) return
    const text = await file.text()
    await importAll(JSON.parse(text))
    alert('Import klart. Ladda om sidan.')
  }

  return (
    <div className="p-4 space-y-4">
      <h1>Inställningar</h1>

      {/* Tema */}
      <section className="card p-4">
        <h2 className="mb-2">Tema</h2>
        <div className="flex gap-2">
          <button
            className={`btn ${s.theme==='dark' ? 'btn-active' : ''}`}
            onClick={()=>setTheme('dark')}
          >Mörkt</button>
          <button
            className={`btn ${s.theme==='light' ? 'btn-active' : ''}`}
            onClick={()=>setTheme('light')}
          >Ljust</button>
          <button
            className={`btn ${s.theme==='parchment' ? 'btn-active' : ''}`}
            onClick={()=>setTheme('parchment')}
          >Pergament</button>
        </div>
      </section>

      {/* Språk */}
      <section className="card p-4">
        <h2 className="mb-2">Språk</h2>
        <select
          className="input"
          value={s.language}
          onChange={e=>setLanguage(e.target.value as any)}
        >
          <option value="sv">Svenska</option>
          <option value="en">English</option>
        </select>
      </section>

      {/* App / PWA */}
      <section className="card p-4">
        <h2 className="mb-2">App</h2>
        <p className="text-muted">
          SW ready (scope: {location.origin + location.pathname})
        </p>
        <InstallButton />
        <p className="text-muted mt-2 text-sm">
          Tips: öppna sidan, vänta 2–3 sekunder, gå till Inställningar. Om knappen är grå: ladda om en gång.
        </p>
      </section>

      {/* Backup */}
      <section className="card p-4">
        <h2 className="mb-2">Backup</h2>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={onExport}>Exportera</button>
          <label className="btn cursor-pointer">
            Importera
            <input type="file" accept="application/json" className="hidden" onChange={onImport}/>
          </label>
        </div>
      </section>
    </div>
  )
}

function InstallButton() {
  const [ready, setReady] = useState<boolean>(false)

  useEffect(() => {
    const check = () => setReady(!!(window as any).deferredPrompt)
    check()
    const onPrompt = () => { setReady(true) }
    window.addEventListener('pwa:beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('pwa:beforeinstallprompt', onPrompt)
  }, [])

  async function onInstall() {
    const dp = (window as any).deferredPrompt
    if (!dp) return
    dp.prompt()
    const choice = await dp.userChoice
    if (choice?.outcome !== 'accepted') {
      // no-op
    }
    (window as any).deferredPrompt = null
    setReady(false)
  }

  return (
    <button
      className="btn"
      onClick={onInstall}
      disabled={!ready}
      title={ready ? 'Installera Boundless Grimoire' : 'Installationsprompt ej tillgänglig ännu'}
    >
      Installera Boundless Grimoire
    </button>
  )
}