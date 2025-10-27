import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/',          label: 'Hem',          icon: '🏛️', end: true },
  { to: '/library',   label: 'Bibliotek',    icon: '📚' },
  { to: '/create',    label: 'Skapa',        icon: '🖋️' },
  { to: '/search',    label: 'Sök',          icon: '🔎' },
  { to: '/settings',  label: 'Inställningar',icon: '⚙️' },
]

export default function BottomNav() {
  return (
    <nav className="tabbar" role="navigation" aria-label="Huvudnavigering">
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            'tab-item' + (isActive ? ' tab-active' : '')
          }
          aria-label={tab.label}
        >
          <span className="tab-ico" aria-hidden>{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}