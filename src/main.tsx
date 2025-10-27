import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

import { registerSW } from 'virtual:pwa-register'
import { ThemeStore } from './theme'

// Initiera tema direkt
ThemeStore.init()

registerSW({
  immediate: true,
  onRegistered(r) { console.log('[PWA] registered', r) },
  onRegisterError(err) { console.error('[PWA] register error', err) }
})

// beforeinstallprompt → global
window.addEventListener('beforeinstallprompt', (e: any) => {
  e.preventDefault()
  ;(window as any).deferredPrompt = e
  window.dispatchEvent(new Event('pwa:beforeinstallprompt'))
})
window.addEventListener('appinstalled', () => { (window as any).deferredPrompt = null })

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(reg => {
    console.log('[PWA] ready, scope:', reg.scope)
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)