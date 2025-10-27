import { Routes, Route, NavLink } from 'react-router-dom'
import Home from './pages/Home'
import Library from './pages/Library'
import Create from './pages/Create'
import Search from './pages/Search'
import Settings from './pages/Settings'
import EntryView from './pages/EntryView'

export default function App() {
  return (
    // extra bottenpadding så innehållet inte hamnar under tabbaren
    <div className="min-h-screen pb-[76px] grain">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/library" element={<Library />} />
        <Route path="/create" element={<Create />} />
        <Route path="/search" element={<Search />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/entry/:id" element={<EntryView />} />
      </Routes>

      {/* Bottom nav */}
      <nav className="tabbar" role="navigation" aria-label="Huvudnavigering">
        <Tab to="/" end icon="🏛️" label="Hem" />
        <Tab to="/library" icon="📚" label="Bibliotek" />
        <Tab to="/create" icon="🖋️" label="Skapa" />
        <Tab to="/search" icon="🔎" label="Sök" />
        <Tab to="/settings" icon="⚙️" label="Inställningar" />
      </nav>
    </div>
  )
}

function Tab(props: { to: string; label: string; icon: string; end?: boolean }) {
  const { to, label, icon, end } = props
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => 'tab-item' + (isActive ? ' tab-active' : '')}
      aria-label={label}
    >
      <span className="tab-ico" aria-hidden>{icon}</span>
      <span className="tab-label">{label}</span>
    </NavLink>
  )
}