const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8765'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Sunucu hatası' }))
    throw new Error(err.detail || 'Bilinmeyen hata')
  }
  return res.json()
}

// Müşteriler
export const getCustomers = (q = '') => request(`/api/customers/${q ? `?q=${encodeURIComponent(q)}` : ''}`)
export const getCustomer = (id) => request(`/api/customers/${id}`)
export const createCustomer = (data) => request('/api/customers/', { method: 'POST', body: JSON.stringify(data) })
export const updateCustomer = (id, data) => request(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteCustomer = (id) => request(`/api/customers/${id}`, { method: 'DELETE' })

// Satışlar
export const getSales = (params = {}) => {
  const qs = new URLSearchParams(params).toString()
  return request(`/api/sales/${qs ? `?${qs}` : ''}`)
}
export const createSale = (data) => request('/api/sales/', { method: 'POST', body: JSON.stringify(data) })
export const deleteSale = (id) => request(`/api/sales/${id}`, { method: 'DELETE' })

// Hatırlatıcılar
export const getReminders = (params = {}) => {
  const qs = new URLSearchParams(params).toString()
  return request(`/api/reminders/${qs ? `?${qs}` : ''}`)
}
export const getTodayReminders = () => request('/api/reminders/today')
export const markReminderDone = (id) => request(`/api/reminders/${id}/done`, { method: 'PUT' })
export const deleteReminder = (id) => request(`/api/reminders/${id}`, { method: 'DELETE' })

// Dashboard
export const getDashboardStats = () => request('/api/dashboard/stats')
export const getCalendar = (month) => request(`/api/dashboard/calendar?month=${month}`)
export const getRecentSales = () => request('/api/dashboard/recent-sales')
