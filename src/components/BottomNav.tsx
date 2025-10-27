import { NavLink } from 'react-router-dom'

const items = [
  { to: '/',          label: 'Hem',          icon: '🏛️' },
  { to: '/library',   label: 'Bibliotek',    icon: '📚' },
  { to: '/create',    label: 'Skapa',        icon: '🖋️' },
  { to: '/search',    label: 'Sök',          icon: '🔎' },
  { to: '/settings',  label: 'Inställningar',icon: '⚙️' },
]

export default function BottomNav() {
  return (
    <nav className="tabbar" role="navigation" aria-label="Bottom">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.to === '/'}
          className={({ isActive }) =>
            'tab-item' + (isActive ? ' tab-active' : '')
          }
        >
          <span className="tab-ico" aria-hidden>{it.icon}</span>
          <span className="tab-label">{it.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}