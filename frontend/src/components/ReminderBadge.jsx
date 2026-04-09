const TYPE_CONFIG = {
  satisfaction_call: { label: 'Memnuniyet Araması', color: 'bg-blue-500', icon: '📞' },
  product_suggestion: { label: 'Ürün Önerisi', color: 'bg-purple-500', icon: '💍' },
  birthday: { label: 'Doğum Günü', color: 'bg-pink-500', icon: '🎂' },
  anniversary: { label: 'Yıldönümü', color: 'bg-red-500', icon: '💑' },
  holiday: { label: 'Özel Gün', color: 'bg-gold', icon: '🎉' },
}

export default function ReminderBadge({ type }) {
  const cfg = TYPE_CONFIG[type] || { label: type, color: 'bg-gray-500', icon: '🔔' }
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full text-white ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  )
}
