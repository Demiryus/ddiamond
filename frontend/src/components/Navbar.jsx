import { NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getTodayReminders } from '../api'

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/customers', label: 'Müşteriler', icon: '👥' },
  { to: '/sales', label: 'Satışlar', icon: '💰' },
  { to: '/reminders', label: 'Hatırlatıcılar', icon: '🔔' },
  { to: '/calendar', label: 'Takvim', icon: '📅' },
]

export default function Navbar() {
  const [badge, setBadge] = useState(0)

  useEffect(() => {
    getTodayReminders().then((d) => setBadge(d.length)).catch(() => {})
    const t = setInterval(() => {
      getTodayReminders().then((d) => setBadge(d.length)).catch(() => {})
    }, 60000)
    return () => clearInterval(t)
  }, [])

  return (
    <nav className="w-56 min-h-screen bg-surface border-r border-gray-700 flex flex-col p-4 shrink-0">
      <div className="mb-8">
        <h1 className="text-gold text-xl font-bold">💎 D Diamond</h1>
        <p className="text-gray-400 text-xs mt-1">Kuyumcu CRM</p>
      </div>
      <ul className="space-y-1 flex-1">
        {links.map((l) => (
          <li key={l.to}>
            <NavLink
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-gold text-dark font-semibold'
                    : 'text-gray-300 hover:bg-surface-2 hover:text-white'
                }`
              }
            >
              <span>{l.icon}</span>
              <span>{l.label}</span>
              {l.to === '/reminders' && badge > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {badge}
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="border-t border-gray-700 pt-4 mt-4">
        <p className="text-gold-light text-sm font-semibold italic">"Çok Para Lazım"</p>
        <p className="text-gray-500 text-xs mt-0.5">— AEO</p>
      </div>
    </nav>
  )
}
