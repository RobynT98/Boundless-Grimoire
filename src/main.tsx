// src/main.tsx (eller src/index.tsx – samma innehåll)
import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

import { registerSW } from 'virtual:pwa-register'
import { ThemeStore } from './theme'

// Initiera tema direkt
ThemeStore.init()

// --- PWA / Service Worker ---
// Autouppdatera SW och ladda om när ny version är redo
const updateSW = registerSW({
  immediate: true,

  // Håll SW:n fräsch (check var 60:e sekund – valfritt)
  onRegisteredSW(_url, reg) {
    if (reg) setInterval(() => reg.update(), 60 * 1000)
  },

  // När pluginen säger att en refresh behövs – hoppa till nya versionen
  onNeedRefresh() {
    updateSW(true) // skipWaiting + clientsClaim
  },

  onOfflineReady() {
    console.log('[PWA] offline ready')
  },

  onRegisterError(err) {
    console.error('[PWA] register error', err)
  },
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