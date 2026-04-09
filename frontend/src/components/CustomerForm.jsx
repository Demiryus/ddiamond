import { useState } from 'react'
import { createCustomer, updateCustomer } from '../api'

export default function CustomerForm({ initial = {}, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    phone: initial.phone || '',
    email: initial.email || '',
    birth_date: initial.birth_date || '',
    anniversary_date: initial.anniversary_date || '',
    notes: initial.notes || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return setError('Ad zorunludur')
    setLoading(true)
    setError('')
    try {
      const payload = { ...form }
      Object.keys(payload).forEach((k) => { if (!payload[k]) payload[k] = null })
      if (initial.id) {
        await updateCustomer(initial.id, payload)
      } else {
        await createCustomer(payload)
      }
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
        <label className="block text-sm text-gray-400 mb-1">Ad Soyad *</label>
        <input className="input w-full" value={form.name} onChange={set('name')} placeholder="Ayşe Kaya" />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Telefon</label>
        <input className="input w-full" value={form.phone} onChange={set('phone')} placeholder="05XX XXX XX XX" />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">E-posta</label>
        <input className="input w-full" value={form.email} onChange={set('email')} type="email" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Doğum Tarihi</label>
          <input className="input w-full" value={form.birth_date} onChange={set('birth_date')} type="date" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Evlilik Yıldönümü</label>
          <input className="input w-full" value={form.anniversary_date} onChange={set('anniversary_date')} type="date" />
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Notlar</label>
        <textarea className="input w-full h-20 resize-none" value={form.notes} onChange={set('notes')} />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Kaydediliyor...' : initial.id ? 'Güncelle' : 'Kaydet'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">İptal</button>
      </div>
    </form>
  )
}
