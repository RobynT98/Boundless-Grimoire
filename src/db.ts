import { createStore, get, set } from 'idb-keyval'
import type { Collection, Entry, Settings } from './types'

const store = createStore('grimoire-db', 'kv')

const DEFAULT_COLLECTIONS: Collection[] = [
  { id: 'demons', name: 'Demoner', icon: '👹', fields: [
    { key:'rank', label:'Rang', type:'text' },
    { key:'aspect', label:'Aspekt', type:'text' },
    { key:'warnings', label:'Varningar', type:'longtext' },
  ]},
  { id: 'gods', name: 'Gudar', icon: '⚡', fields: [{ key:'domain', label:'Domän', type:'text'}]},
  { id: 'angels', name: 'Änglar', icon: '🪽', fields: [{ key:'choir', label:'Kor', type:'text'}]},
  { id: 'spirits', name: 'Naturväsen', icon: '🌲', fields: [{ key:'region', label:'Region', type:'text'}]},
  { id: 'creatures', name: 'Väsen', icon: '🐾', fields: [{ key:'habitat', label:'Habitat', type:'text'}]},
  { id: 'crystals', name: 'Kristaller & mineraler', icon: '💎', fields: [
    { key:'properties', label:'Egenskaper', type:'longtext' },
    { key:'chakra', label:'Chakra', type:'text' },
  ]},
  { id: 'herbs', name: 'Örter & växter', icon: '🌿', fields: [
    { key:'uses', label:'Användning', type:'longtext' },
    { key:'correspondences', label:'Korresponderenser', type:'longtext' },
  ]},
  { id: 'aura', name: 'Aura', icon: '✨', fields: [{ key:'color', label:'Färg', type:'text'}]},
  { id: 'runes', name: 'Runor', icon: 'ᚠ', fields: [
    { key:'phoneme', label:'Ljudvärde', type:'text' },
    { key:'meaning', label:'Betydelse', type:'longtext' },
  ]},
  { id: 'healing', name: 'Healing', icon: '🜁', fields: [{ key:'method', label:'Metod', type:'text'}]},
  { id: 'curses', name: 'Förbannelser', icon: '☠️', fields: [{ key:'risk', label:'Risk', type:'longtext'}]},
  { id: 'spells', name: 'Trollformler', icon: '🪄', fields: [{ key:'ingredients', label:'Ingredienser', type:'longtext'}]},
  { id: 'rituals', name: 'Ritualer', icon: '🕯️', fields: [{ key:'steps', label:'Steg', type:'longtext'}]},
  { id: 'notes', name: 'Anteckningar', icon: '📝', fields: []}
]

export async function getCollections(): Promise<Collection[]> {
  const col = await get<Collection[]>('collections', store)
  if (!col) {
    await set('collections', DEFAULT_COLLECTIONS, store)
    return DEFAULT_COLLECTIONS
  }
  return col
}

export async function saveCollections(cols: Collection[]) { await set('collections', cols, store) }
export async function getEntries(): Promise<Entry[]> { return (await get<Entry[]>('entries', store)) ?? [] }
export async function saveEntries(entries: Entry[]) { await set('entries', entries, store) }
export async function getSettings(): Promise<Settings> { return (await get<Settings>('settings', store)) ?? { theme: 'dark', language: 'sv' } }
export async function saveSettings(s: Settings) { await set('settings', s, store) }

export async function exportAll() {
  const [collections, entries, settings] = await Promise.all([getCollections(), getEntries(), getSettings()])
  return { collections, entries, settings, version: 2 }
}
export async function importAll(payload: any) {
  if (!payload) return
  if (payload.collections) await saveCollections(payload.collections)
  if (payload.entries) await saveEntries(payload.entries)
  if (payload.settings) await saveSettings(payload.settings)
}