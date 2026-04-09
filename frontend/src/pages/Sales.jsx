import { useEffect, useState } from 'react'
import { getSales, deleteSale } from '../api'
import SaleForm from '../components/SaleForm'

function formatDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}.${m}.${y}`
}

const FILTERS = [
  { label: 'Tümü', days: null },
  { label: 'Bu Ay', days: 30 },
  { label: 'Bu Hafta', days: 7 },
]

export default function Sales() {
  const [sales, setSales] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState(null)

  const load = (days) => getSales(days ? { days } : {}).then(setSales).catch(() => {})

  useEffect(() => { load(filter) }, [filter])

  const handleDelete = async (id) => {
    if (!confirm('Bu satışı silmek istiyor musunuz?')) return
    await deleteSale(id)
    load(filter)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gold-light">Satışlar</h2>
        <button onClick={() => setShowForm(true)} className="btn-primary">+ Satış Ekle</button>
      </div>

      {showForm && (
        <div className="bg-surface border border-gray-700 rounded-xl p-4 mb-4 max-w-lg">
          <h3 className="text-gold font-semibold mb-3">Yeni Satış</h3>
          <SaleForm
            onSave={() => { setShowForm(false); load(filter) }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilter(f.days)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filter === f.days ? 'bg-gold text-dark font-semibold' : 'bg-surface text-gray-300 border border-gray-700 hover:border-gold'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-surface rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400">
              <th className="text-left p-3">Müşteri</th>
              <th className="text-left p-3">Ürün</th>
              <th className="text-left p-3 hidden md:table-cell">Kategori</th>
              <th className="text-left p-3">Fiyat</th>
              <th className="text-left p-3">Tarih</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-gray-400">Satış bulunamadı</td></tr>
            )}
            {sales.map((s) => (
              <tr key={s.id} className="border-b border-gray-700/50 hover:bg-surface-2">
                <td className="p-3 font-medium">{s.customer_name}</td>
                <td className="p-3">{s.product_name}</td>
                <td className="p-3 text-gray-400 hidden md:table-cell">{s.product_category || '—'}</td>
                <td className="p-3 text-gold">{s.price ? `₺${s.price.toLocaleString('tr-TR')}` : '—'}</td>
                <td className="p-3 text-gray-400">{formatDate(s.sale_date)}</td>
                <td className="p-3">
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="text-gray-500 hover:text-red-400 text-xs"
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
