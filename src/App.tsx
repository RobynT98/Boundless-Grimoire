import { Routes, Route, NavLink } from 'react-router-dom'
import Home from './pages/Home'
import Library from './pages/Library'
import Create from './pages/Create'
import Search from './pages/Search'
import Settings from './pages/Settings'
import EntryView from './pages/EntryView'

export default function App() {
  return (
    <div className="min-h-screen pb-16 grain">
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/library" element={<Library/>} />
        <Route path="/create" element={<Create/>} />
        <Route path="/search" element={<Search/>} />
        <Route path="/settings" element={<Settings/>} />
        <Route path="/entry/:id" element={<EntryView/>} />
      </Routes>

      <nav className="tabbar">
        <Tab to="/">🏛️<span>Hem</span></Tab>
        <Tab to="/library">📚<span>Bibliotek</span></Tab>
        <Tab to="/create">✍️<span>Skapa</span></Tab>
        <Tab to="/search">🔎<span>Sök</span></Tab>
        <Tab to="/settings">⚙️<span>Inställningar</span></Tab>
      </nav>
    </div>
  )
}
function Tab({ to, children }: { to: string, children: any }) {
  return (
    <NavLink to={to} className={({isActive}) => isActive ? 'active' : '' }>
      <div className="text-xl">{children}</div>
    </NavLink>
  )
}