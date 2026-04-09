import { useState, useEffect } from 'react'
import { getCustomers, createSale } from '../api'

const CATEGORIES = ['Yüzük', 'Kolye', 'Bilezik', 'Küpe', 'Saat', 'Diğer']

export default function SaleForm({ initialCustomerId = null, onSave, onCancel }) {
  const [customers, setCustomers] = useState([])
  const [form, setForm] = useState({
    customer_id: initialCustomerId || '',
    product_name: '',
    product_category: 'Yüzük',
    price: '',
    sale_date: new Date().toISOString().slice(0, 10),
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getCustomers().then(setCustomers).catch(() => {})
  }, [])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.customer_id) return setError('Müşteri seçiniz')
    if (!form.product_name.trim()) return setError('Ürün adı zorunludur')
    setLoading(true)
    setError('')
    try {
      await createSale({
        ...form,
        customer_id: Number(form.customer_id),
        price: form.price ? Number(form.price) : null,
      })
      onSave()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <div className="bg-red-900 text-red-200 p-2 rounded text-sm">{error}</div>}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Müşteri *</label>
        <select className="input w-full" value={form.customer_id} onChange={set('customer_id')}>
          <option value="">Müşteri seçin...</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Ürün Kategorisi</label>
        <select className="input w-full" value={form.product_category} onChange={set('product_category')}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Ürün Adı *</label>
        <input className="input w-full" value={form.product_name} onChange={set('product_name')} placeholder="14 Ayar Altın Yüzük" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Fiyat (₺)</label>
          <input className="input w-full" value={form.price} onChange={set('price')} type="number" min="0" step="0.01" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Satış Tarihi</label>
          <input className="input w-full" value={form.sale_date} onChange={set('sale_date')} type="date" />
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Notlar</label>
        <textarea className="input w-full h-16 resize-none" value={form.notes} onChange={set('notes')} />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Kaydediliyor...' : 'Satış Ekle'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">İptal</button>
      </div>
    </form>
  )
}
