// Gör beforeinstallprompt globalt så vi inte missar det på SPA-rutter
declare global {
  interface Window { deferredPrompt?: any }
}

window.addEventListener('beforeinstallprompt', (e: any) => {
  e.preventDefault()
  window.deferredPrompt = e
  // skicka en egen signal som sidor kan lyssna på
  window.dispatchEvent(new Event('pwa:beforeinstallprompt'))
})

window.addEventListener('appinstalled', () => {
  // nollställ när appen installerats
  window.deferredPrompt = null
})