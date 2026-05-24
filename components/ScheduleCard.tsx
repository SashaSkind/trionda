interface Props {
  teams?: string
  date?: string
  time?: string
  stage?: string
  highlight?: boolean
}

// Build a Google search URL that lands on the official FIFA match page as the
// top result. Per-match deep links into FIFA's ticket portal don't exist
// (the portal routes dynamically), so a search-by-match query is the most
// reliable way to send users to the right place.
function ticketsUrl(teams: string, stage: string, date: string): string {
  // Surrogate-pair form so we don't need the `u` regex flag (which requires
  // ES2015+ target — this project's tsconfig doesn't set one).
  // \uD83C[\uDDE6-\uDDFF] = country-flag regional indicators (🇧🇷, 🇲🇽, …)
  // 🏴         = 🏴 (Scotland / England subdivision flags base)
  const cleanTeams = teams
    .replace(/\uD83C[\uDDE6-\uDDFF]/g, '')
    .replace(/🏴[\s\S]*?(?=\s|$)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  const cleanStage = stage.replace(/🏆\s*/g, '').trim()
  const isTbd = /^TBD\s+vs\s+TBD$/i.test(cleanTeams)
  const query = isTbd
    ? `FIFA World Cup 2026 ${cleanStage} ${date} tickets`
    : `FIFA World Cup 2026 ${cleanTeams} tickets`
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`
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
      <a
        href={ticketsUrl(teams, stage, date)}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-sketch"
        style={{ fontSize: 14, padding: '3px 10px', flexShrink: 0, textDecoration: 'none' }}
      >
        tickets ↗
      </a>
    </div>
  )
}
