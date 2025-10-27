import { useEffect, useState } from 'react'
import { exportAll, getSettings, importAll, saveSettings } from '../db'
import type { Settings } from '../types'

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({ theme:'dark', language:'sv' })
  const [canInstall, setCanInstall] = useState(false)
  const [deferred, setDeferred] = useState<any>(null)
  const [swInfo, setSwInfo] = useState<string>('')

  useEffect(()=>{ getSettings().then(setSettings)}, [])

  // PWA install-event
  useEffect(() => {
    function handler(e: any) {
      e.preventDefault()
      setDeferred(e)
      setCanInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Visa enkel SW-status
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        setSwInfo(`SW ready (scope: ${reg.scope})`)
      }).catch(()=>setSwInfo('SW not ready'))
    }
  }, [])

  async function onInstall() {
    if (!deferred) return
    deferred.prompt()
    const res = await deferred.userChoice
    setDeferred(null)
    setCanInstall(false)
    alert(res.outcome === 'accepted' ? 'Installerad (eller på väg)!' : 'Avbrutet.')
  }

  async function onExport() {
    const data = await exportAll()
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'boundless-grimoire-backup.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function onImport(e: any) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    await importAll(JSON.parse(text))
    alert('Importerat! Ladda om sidan för att se allt.')
  }

  async function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    const next = {...settings, [key]: value}
    setSettings(next)
    await saveSettings(next)
  }

  return (
    <div className="p-4 space-y-4">
      <h1>Inställningar</h1>

      <section className="card p-4">
        <h2>Tema</h2>
        <div className="flex gap-3 mt-2">
          <button onClick={()=>update('theme','dark')} className={"px-3 py-1 rounded "+(settings.theme==='dark'?'bg-amber-600':'bg-neutral-800')}>Mörkt</button>
          <button onClick={()=>update('theme','light')} className={"px-3 py-1 rounded "+(settings.theme==='light'?'bg-amber-600':'bg-neutral-800')}>Ljust</button>
          <button onClick={()=>update('theme','parchment')} className={"px-3 py-1 rounded "+(settings.theme==='parchment'?'bg-amber-600':'bg-neutral-800')}>Pergament</button>
        </div>
      </section>

      <section className="card p-4">
        <h2>Språk</h2>
        <select value={settings.language} onChange={(e)=>update('language', e.target.value as any)} className="bg-neutral-900 p-2 rounded">
          <option value="sv">Svenska</option>
          <option value="en">English</option>
        </select>
      </section>

      <section className="card p-4">
        <h2>App</h2>
        <div className="text-sm text-neutral-400 mb-2">{swInfo || 'Kontrollerar service worker...'}</div>
        <button
          disabled={!canInstall}
          onClick={onInstall}
          className={"px-4 py-2 rounded "+(canInstall?'bg-amber-600 hover:bg-amber-700':'bg-neutral-800 opacity-60')}
          title={canInstall ? '' : 'Installationsprompten är inte tillgänglig ännu'}
        >
          Installera Boundless Grimoire
        </button>
        <div className="text-xs text-neutral-500 mt-2">
          Tips: om knappen är grå, öppna sidan, vänta 2–3 sekunder och ladda om en gång till.
        </div>
      </section>

      <section className="card p-4">
        <h2>Backup</h2>
        <div className="flex gap-3">
          <button onClick={onExport} className="bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded">Exportera</button>
          <label className="bg-neutral-800 px-4 py-2 rounded cursor-pointer">
            Importera
            <input type="file" accept="application/json" className="hidden" onChange={onImport} />
          </label>
        </div>
      </section>
    </div>
  )
}