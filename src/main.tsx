import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// PWA: registrera och logga så vi ser att den är aktiv
import { registerSW } from 'virtual:pwa-register'
const updateSW = registerSW({
  immediate: true,
  onRegistered(r) {
    console.log('[PWA] registered', r)
  },
  onRegisterError(err) {
    console.error('[PWA] register error', err)
  }
})

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(reg => {
    console.log('[PWA] ready, scope:', reg.scope)
  })
  if (navigator.serviceWorker.controller) {
    console.log('[PWA] controller OK')
  } else {
    console.log('[PWA] no controller yet (first load)')
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)