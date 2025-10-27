// Gör filen till en modul (krävs för TS)
export {}

declare global {
  interface Window {
    deferredPrompt?: any
  }
}