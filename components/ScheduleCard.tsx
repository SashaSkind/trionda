interface Props {
  teams?: string
  date?: string
  time?: string
  stage?: string
  highlight?: boolean
}

export default function ScheduleCard({
  teams = '🇧🇷 Brazil  vs  🇦🇷 Argentina',
  date = 'Sat Jun 13',
  time = '8:00 PM PT',
  stage = 'Group A · Match 8',
  highlight = false,
}: Props) {
  const [stageGroup, stageMatch] = stage.split('·').map(s => s.trim())
  return (
    <div
      className="ink-box"
      style={{
        padding: '14px 16px',
        background: highlight ? '#fef4a8' : 'white',
        boxShadow: highlight ? '3px 3px 0 #15171a' : 'none',
        display: 'flex', alignItems: 'center', gap: 14,
      }}
    >
      <div className="hand" style={{ fontSize: 14, color: '#E1252C', minWidth: 70, flexShrink: 0 }}>
        {stageGroup}
      </div>
      <div style={{ flex: 1 }}>
        <div className="hand" style={{ fontSize: 22, fontWeight: 600 }}>{teams}</div>
        <div className="print" style={{ fontSize: 13, color: '#4a4a4a' }}>
          {date} · {time}{stageMatch ? ` · ${stageMatch}` : ''}
        </div>
      </div>
      <button className="btn-sketch" style={{ fontSize: 14, padding: '3px 10px', flexShrink: 0 }}>
        tickets ↗
      </button>
    </div>
  )
}
