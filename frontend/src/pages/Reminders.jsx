import { useEffect, useState } from 'react'
import { getReminders, markReminderDone, deleteReminder } from '../api'
import ReminderBadge from '../components/ReminderBadge'

function formatDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}.${m}.${y}`
}

const FILTERS = [
  { label: 'Bugün', params: { days: 0 } },
  { label: 'Bu Hafta', params: { days: 7 } },
  { label: 'Tümü', params: {} },
]

const TYPES = [
  { label: 'Hepsi', value: '' },
  { label: 'Memnuniyet', value: 'satisfaction_call' },
  { label: 'Ürün Önerisi', value: 'product_suggestion' },
  { label: 'Doğum Günü', value: 'birthday' },
  { label: 'Yıldönümü', value: 'anniversary' },
  { label: 'Özel Gün', value: 'holiday' },
]

export default function Reminders() {
  const [reminders, setReminders] = useState([])
  const [filter, setFilter] = useState(1) // Bu Hafta
  const [typeFilter, setTypeFilter] = useState('')
  const [showDone, setShowDone] = useState(false)

  const load = () => {
    const params = { ...FILTERS[filter].params }
    if (typeFilter) params.reminder_type = typeFilter
    if (showDone) params.show_done = true
    getReminders(params).then(setReminders).catch(() => {})
  }

  useEffect(() => { load() }, [filter, typeFilter, showDone])

  const done = async (id) => {
    await markReminderDone(id)
    load()
  }

  const del = async (id) => {
    if (!confirm('Hatırlatıcıyı silmek istiyor musunuz?')) return
    await deleteReminder(id)
    load()
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gold-light mb-4">Hatırlatıcılar</h2>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex gap-1">
          {FILTERS.map((f, i) => (
            <button
              key={i}
              onClick={() => setFilter(i)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filter === i ? 'bg-gold text-dark font-semibold' : 'bg-surface text-gray-300 border border-gray-700 hover:border-gold'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          className="input text-sm"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer ml-auto">
          <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />
          Tamamlananları göster
        </label>
      </div>

      {reminders.length === 0 ? (
        <div className="bg-surface rounded-xl border border-gray-700 p-8 text-center text-gray-400">
          Gösterilecek hatırlatıcı yok
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map((r) => (
            <div
              key={r.id}
              className={`bg-surface border rounded-xl p-4 flex items-start gap-4 ${r.is_done ? 'border-gray-700 opacity-60' : 'border-gray-600'}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-medium">{r.customer_name || 'Müşteri'}</span>
                  <ReminderBadge type={r.reminder_type} />
                  <span className="text-gray-500 text-xs ml-auto">{formatDate(r.scheduled_date)}</span>
                </div>
                <p className="text-sm text-gray-300">{r.message}</p>
                {r.customer_phone && (
                  <p className="text-xs text-gray-500 mt-1">📞 {r.customer_phone}</p>
                )}
              </div>
              {!r.is_done && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => done(r.id)}
                    className="text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg"
                  >
                    Tamamlandı
                  </button>
                  <button
                    onClick={() => del(r.id)}
                    className="text-xs text-gray-500 hover:text-red-400"
                  >
                    Sil
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
