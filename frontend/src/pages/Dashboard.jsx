import { useEffect, useState } from 'react'
import { getDashboardStats, getTodayReminders, getRecentSales, markReminderDone } from '../api'
import ReminderBadge from '../components/ReminderBadge'

function StatCard({ label, value, icon, color = 'text-gold' }) {
  return (
    <div className="bg-surface rounded-xl p-5 border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm">{label}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className={`text-3xl font-bold ${color}`}>{value ?? '—'}</div>
    </div>
  )
}

function formatDate(d) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}.${m}.${y}`
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [reminders, setReminders] = useState([])
  const [sales, setSales] = useState([])

  const load = () => {
    getDashboardStats().then(setStats).catch(() => {})
    getTodayReminders().then(setReminders).catch(() => {})
    getRecentSales().then(setSales).catch(() => {})
  }

  useEffect(() => { load() }, [])

  const done = async (id) => {
    await markReminderDone(id)
    setReminders((r) => r.filter((x) => x.id !== id))
    getDashboardStats().then(setStats).catch(() => {})
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gold-light">Dashboard</h2>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Toplam Müşteri" value={stats?.total_customers} icon="👥" />
        <StatCard label="Bu Ay Satış" value={stats?.sales_this_month} icon="💰" />
        <StatCard
          label="Bugünkü Hatırlatıcı"
          value={stats?.pending_reminders}
          icon="🔔"
          color={stats?.pending_reminders > 0 ? 'text-red-400' : 'text-gold'}
        />
        <StatCard label="Yaklaşan Doğum Günü" value={stats?.upcoming_birthdays} icon="🎂" color="text-pink-400" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl border border-gray-700 p-4">
          <h3 className="font-semibold text-gold mb-3">Bugünkü Hatırlatıcılar</h3>
          {reminders.length === 0 ? (
            <p className="text-gray-400 text-sm">Bugün hatırlatıcı yok 🎉</p>
          ) : (
            <ul className="space-y-2">
              {reminders.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3 bg-surface-2 rounded-lg p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">{r.customer_name}</span>
                      <ReminderBadge type={r.reminder_type} />
                    </div>
                    <p className="text-gray-400 text-xs">{r.message}</p>
                  </div>
                  <button
                    onClick={() => done(r.id)}
                    className="shrink-0 text-xs bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded"
                  >
                    Tamam
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-surface rounded-xl border border-gray-700 p-4">
          <h3 className="font-semibold text-gold mb-3">Son 5 Satış</h3>
          {sales.length === 0 ? (
            <p className="text-gray-400 text-sm">Henüz satış yok</p>
          ) : (
            <ul className="space-y-2">
              {sales.map((s) => (
                <li key={s.id} className="flex items-center justify-between bg-surface-2 rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium">{s.customer_name}</p>
                    <p className="text-xs text-gray-400">{s.product_name} · {s.product_category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gold text-sm font-semibold">{s.price ? `₺${s.price.toLocaleString('tr-TR')}` : '—'}</p>
                    <p className="text-xs text-gray-400">{formatDate(s.sale_date)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
