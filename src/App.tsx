import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Library from './pages/Library'
import Create from './pages/Create'
import Search from './pages/Search'
import Settings from './pages/Settings'
import EntryView from './pages/EntryView'
import BottomNav from './components/BottomNav'

export default function App() {
  return (
    <div className="min-h-screen pb-[76px] grain">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/library" element={<Library />} />
        <Route path="/create" element={<Create />} />
        <Route path="/search" element={<Search />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/entry/:id" element={<EntryView />} />
      </Routes>

      <BottomNav />
    </div>
  )
}