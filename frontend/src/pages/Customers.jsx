import { useEffect, useState } from 'react'
import { getCustomers, getCustomer, deleteCustomer } from '../api'
import CustomerForm from '../components/CustomerForm'
import ReminderBadge from '../components/ReminderBadge'

function formatDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}.${m}.${y}`
}

function formatPhone(p) {
  if (!p) return '—'
  const digits = p.replace(/\D/g, '')
  if (digits.length === 11) return `${digits.slice(0,4)} ${digits.slice(4,7)} ${digits.slice(7,9)} ${digits.slice(9)}`
  return p
}

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editCustomer, setEditCustomer] = useState(null)

  const load = (q = '') => getCustomers(q).then(setCustomers).catch(() => {})

  useEffect(() => { load() }, [])

  useEffect(() => {
    const t = setTimeout(() => load(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const openDetail = (c) => {
    setSelected(c)
    getCustomer(c.id).then(setDetail).catch(() => {})
  }

  const handleDelete = async (id) => {
    if (!confirm('Bu müşteriyi silmek istiyor musunuz?')) return
    await deleteCustomer(id)
    setSelected(null)
    setDetail(null)
    load(search)
  }

  return (
    <div className="p-6 flex gap-4 h-full">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gold-light">Müşteriler</h2>
          <button onClick={() => { setShowForm(true); setEditCustomer(null) }} className="btn-primary">+ Yeni Müşteri</button>
        </div>

        <input
          className="input w-full mb-4"
          placeholder="İsim veya telefon ile ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {showForm && (
          <div className="bg-surface border border-gray-700 rounded-xl p-4 mb-4">
            <h3 className="text-gold font-semibold mb-3">{editCustomer ? 'Müşteriyi Düzenle' : 'Yeni Müşteri'}</h3>
            <CustomerForm
              initial={editCustomer || {}}
              onSave={() => { setShowForm(false); setEditCustomer(null); load(search) }}
              onCancel={() => { setShowForm(false); setEditCustomer(null) }}
            />
          </div>
        )}

        <div className="bg-surface rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400">
                <th className="text-left p-3">Ad Soyad</th>
                <th className="text-left p-3">Telefon</th>
                <th className="text-left p-3 hidden md:table-cell">Kayıt Tarihi</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 && (
                <tr><td colSpan={3} className="p-6 text-center text-gray-400">Müşteri bulunamadı</td></tr>
              )}
              {customers.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => openDetail(c)}
                  className={`border-b border-gray-700/50 cursor-pointer hover:bg-surface-2 transition-colors ${selected?.id === c.id ? 'bg-surface-2' : ''}`}
                >
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3 text-gray-400">{formatPhone(c.phone)}</td>
                  <td className="p-3 text-gray-400 hidden md:table-cell">{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="w-80 shrink-0 bg-surface border border-gray-700 rounded-xl p-4 overflow-y-auto max-h-[calc(100vh-6rem)]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gold">{selected.name}</h3>
            <button onClick={() => { setSelected(null); setDetail(null) }} className="text-gray-400 hover:text-white">✕</button>
          </div>

          {detail ? (
            <>
              <div className="text-sm space-y-1 mb-4 text-gray-300">
                <p>📞 {formatPhone(detail.phone)}</p>
                {detail.email && <p>✉️ {detail.email}</p>}
                {detail.birth_date && <p>🎂 {formatDate(detail.birth_date)}</p>}
                {detail.anniversary_date && <p>💑 {formatDate(detail.anniversary_date)}</p>}
                {detail.notes && <p className="text-gray-400 text-xs mt-2">{detail.notes}</p>}
              </div>

              <h4 className="text-xs text-gray-400 uppercase mb-2">Satışlar ({detail.sales?.length || 0})</h4>
              <ul className="space-y-1 mb-4">
                {(detail.sales || []).map((s) => (
                  <li key={s.id} className="bg-surface-2 rounded p-2 text-xs">
                    <p className="font-medium">{s.product_name}</p>
                    <p className="text-gray-400">{formatDate(s.sale_date)} · {s.price ? `₺${s.price.toLocaleString('tr-TR')}` : '—'}</p>
                  </li>
                ))}
              </ul>

              <h4 className="text-xs text-gray-400 uppercase mb-2">Hatırlatıcılar ({detail.reminders?.length || 0})</h4>
              <ul className="space-y-1 mb-4">
                {(detail.reminders || []).map((r) => (
                  <li key={r.id} className="bg-surface-2 rounded p-2 text-xs">
                    <div className="mb-1"><ReminderBadge type={r.reminder_type} /></div>
                    <p className="text-gray-300">{r.message}</p>
                    <p className="text-gray-500 mt-1">{formatDate(r.scheduled_date)}</p>
                  </li>
                ))}
              </ul>

              <div className="flex gap-2">
                <button
                  onClick={() => { setEditCustomer(detail); setShowForm(true) }}
                  className="btn-secondary flex-1 text-xs"
                >
                  Düzenle
                </button>
                <button
                  onClick={() => handleDelete(selected.id)}
                  className="bg-red-800 hover:bg-red-700 text-white rounded-lg px-3 py-1.5 text-xs"
                >
                  Sil
                </button>
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-sm">Yükleniyor...</p>
          )}
        </div>
      )}
    </div>
  )
}
