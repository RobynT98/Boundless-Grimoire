import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'   // ⬅️ bytt
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* HashRouter funkar bäst på GitHub Pages, ingen basename behövs */}
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)