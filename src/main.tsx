import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// PWA-registrering (vite-plugin-pwa)
import { registerSW } from 'virtual:pwa-register'

// Visa en enkel alert när appen är redo offline (bra för att se att SW verkligen kör)
registerSW({
  immediate: true,
  onOfflineReady() {
    // Kommentera bort om du inte vill se denna.
    console.log('PWA offline ready')
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)