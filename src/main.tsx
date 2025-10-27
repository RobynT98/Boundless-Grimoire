import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// PWA: registrera service workern (vite-plugin-pwa)
import { registerSW } from 'virtual:pwa-register'
registerSW({
  immediate: true,
  onRegistered(r) {
    console.log('[PWA] registered', r)
  },
  onRegisterError(err) {
    console.error('[PWA] register error', err)
  }
})

// Gör beforeinstallprompt globalt så vi inte missar det på SPA-rutter
window.addEventListener('beforeinstallprompt', (e: any) => {
  e.preventDefault()
  ;(window as any).deferredPrompt = e
  // skicka en egen signal som sidor kan lyssna på
  window.dispatchEvent(new Event('pwa:beforeinstallprompt'))
})

window.addEventListener('appinstalled', () => {
  // nollställ när appen installerats
  ;(window as any).deferredPrompt = null
  console.log('[PWA] app installed')
})

// (valfritt) logga när SW kontrollerar sidan
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