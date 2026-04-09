import { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { getCalendar } from '../api'
import ReminderBadge from '../components/ReminderBadge'

const TYPE_COLORS = {
  satisfaction_call: '#3b82f6',
  product_suggestion: '#8b5cf6',
  birthday: '#ec4899',
  anniversary: '#ef4444',
  holiday: '#C9A84C',
}

function formatDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}.${m}.${y}`
}

export default function Calendar() {
  const [events, setEvents] = useState([])
  const [allReminders, setAllReminders] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedReminders, setSelectedReminders] = useState([])
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const load = (month) => {
    getCalendar(month).then((data) => {
      setAllReminders(data)
      const evs = data.map((r) => ({
        id: String(r.id),
        title: r.customer_name || 'Hatırlatıcı',
        date: r.scheduled_date,
        backgroundColor: TYPE_COLORS[r.reminder_type] || '#C9A84C',
        borderColor: 'transparent',
        extendedProps: r,
      }))
      setEvents(evs)
    }).catch(() => {})
  }

  useEffect(() => { load(currentMonth) }, [currentMonth])

  const handleDateClick = (info) => {
    const day = info.dateStr
    setSelectedDay(day)
    setSelectedReminders(allReminders.filter((r) => r.scheduled_date === day))
  }

  const handleDatesSet = (info) => {
    const mid = new Date((info.start.getTime() + info.end.getTime()) / 2)
    const month = `${mid.getFullYear()}-${String(mid.getMonth() + 1).padStart(2, '0')}`
    if (month !== currentMonth) setCurrentMonth(month)
  }

  return (
    <div className="p-6 flex gap-4">
      <div className="flex-1 min-w-0">
        <h2 className="text-2xl font-bold text-gold-light mb-4">Takvim</h2>
        <div className="bg-surface rounded-xl border border-gray-700 p-4">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale="tr"
            events={events}
            dateClick={handleDateClick}
            datesSet={handleDatesSet}
            headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
            height="auto"
            eventDisplay="dot"
          />
        </div>
      </div>

      {selectedDay && (
        <div className="w-72 shrink-0 bg-surface border border-gray-700 rounded-xl p-4 overflow-y-auto max-h-[calc(100vh-6rem)]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gold">{formatDate(selectedDay)}</h3>
            <button onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-white">✕</button>
          </div>
          {selectedReminders.length === 0 ? (
            <p className="text-gray-400 text-sm">Bu günde hatırlatıcı yok</p>
          ) : (
            <ul className="space-y-2">
              {selectedReminders.map((r) => (
                <li key={r.id} className="bg-surface-2 rounded-lg p-3 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{r.customer_name}</span>
                  </div>
                  <ReminderBadge type={r.reminder_type} />
                  <p className="text-gray-400 text-xs mt-1">{r.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
