import { notFound } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/Logo'
import ScheduleCard from '@/components/ScheduleCard'
import SpotsSection from '@/components/SpotsSection'
import { STADIUMS, getStadium } from '@/lib/stadiums'

export function generateStaticParams() {
  return STADIUMS.map(s => ({ id: s.id }))
}

const SCHEDULE: Record<string, Array<{ teams: string; date: string; time: string; stage: string; highlight?: boolean }>> = {
  sfo: [
    { teams: '🇧🇷 Brazil  vs  🇦🇷 Argentina',  date: 'Sat Jun 13', time: '8:00 PM PT',  stage: 'Group A · Match 8', highlight: true },
    { teams: '🇪🇸 Spain  vs  🇲🇽 Mexico',      date: 'Mon Jun 15', time: '5:00 PM PT',  stage: 'Group B · Match 12' },
    { teams: '🇯🇵 Japan  vs  🇩🇪 Germany',     date: 'Thu Jun 18', time: '2:00 PM PT',  stage: 'Group D · Match 19' },
    { teams: '🇫🇷 France  vs  🇧🇪 Belgium',    date: 'Sun Jun 21', time: '11:00 AM PT', stage: 'Group F · Match 27' },
    { teams: 'TBD  vs  TBD',                    date: 'Sat Jun 27', time: '11:00 AM PT', stage: 'Round of 32 · Match 41' },
    { teams: 'TBD  vs  TBD',                    date: 'Wed Jul 01', time: '2:00 PM PT',  stage: 'Round of 16 · Match 53' },
  ],
  nyc: [
    { teams: '🇩🇪 Germany  vs  🇯🇵 Japan',    date: 'Wed Jun 14', time: '5:00 PM ET',  stage: 'Group D · Match 11', highlight: true },
    { teams: '🇺🇸 USA  vs  🇨🇳 China',         date: 'Sat Jun 17', time: '7:00 PM ET',  stage: 'Group E · Match 21' },
    { teams: '🇧🇷 Brazil  vs  🇵🇹 Portugal',  date: 'Tue Jun 20', time: '8:00 PM ET',  stage: 'Group G · Match 30' },
    { teams: 'TBD  vs  TBD',                    date: 'Mon Jun 26', time: '3:00 PM ET',  stage: 'Round of 32 · Match 37' },
    { teams: 'TBD  vs  TBD',                    date: 'Fri Jul 04', time: '6:00 PM ET',  stage: 'Quarter-final · Match 57' },
    { teams: 'TBD  vs  TBD',                    date: 'Tue Jul 09', time: '3:00 PM ET',  stage: 'Semi-final · Match 61' },
    { teams: 'TBD  vs  TBD',                    date: 'Sun Jul 19', time: '3:00 PM ET',  stage: '🏆 World Cup Final', highlight: true },
    { teams: 'TBD  vs  TBD',                    date: 'Sat Jul 12', time: '3:00 PM ET',  stage: 'Third Place · Match 63' },
  ],
}

function getSchedule(id: string) {
  if (SCHEDULE[id]) return SCHEDULE[id]
  const s = getStadium(id)
  if (!s) return []
  return Array.from({ length: s.matches }, (_, i) => ({
    teams: 'TBD  vs  TBD',
    date: `TBD`,
    time: 'TBD',
    stage: `Match ${i + 1}`,
    highlight: i === 0,
  }))
}

export default function StadiumPage({ params }: { params: { id: string } }) {
  const stadium = getStadium(params.id)
  if (!stadium) notFound()

  const schedule = getSchedule(params.id)

  const infoCards = [
    ['NEAREST AIRPORT', stadium.airport, '#0061B2'],
    ['FROM AIRPORT',    stadium.airportDist, '#0061B2'],
    ['GET TO STADIUM',  stadium.transit, '#009A4E'],
    ['LANGUAGE',        stadium.language, '#009A4E'],
    ['TIME ZONE',       stadium.timezone, '#E1252C'],
    ['JUNE WEATHER',    stadium.weather,   '#E1252C'],
  ]

  return (
    <div style={{ background: '#fbf7ee', minHeight: '100vh' }}>
      {/* Sticky nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 20,
        padding: '18px 32px',
        display: 'flex', alignItems: 'center', gap: 16,
        background: 'linear-gradient(180deg, rgba(251,247,238,0.98), rgba(251,247,238,0.90))',
        backdropFilter: 'blur(8px)',
        borderBottom: '1.4px solid rgba(21,23,26,0.08)',
      }}>
        <Link href="/" className="btn-sketch" style={{ padding: '4px 14px', fontSize: 16 }}>← Map</Link>
        <Logo size={18} />
        <div className="hand" style={{ fontSize: 18, color: '#4a4a4a' }}>/ {stadium.name}</div>
        <div style={{ flex: 1 }} />
        <button className="btn-sketch" style={{ fontSize: 16 }}>Share</button>
        <button className="btn-sketch solid" style={{ fontSize: 16 }}>Save trip</button>
      </nav>

      {/* Hero — full-bleed */}
      <div style={{ position: 'relative', width: '100%', height: 640, overflow: 'hidden' }}>
        {/* Placeholder — user can swap for a real bird's-eye photo */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'repeating-linear-gradient(135deg, #d0c9b5, #d0c9b5 10px, #c8c1aa 10px, #c8c1aa 20px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-caveat), cursive', fontSize: 24, color: 'rgba(21,23,26,0.4)',
        }}>
          ↑ drop your bird's-eye photo here ↑
        </div>

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(0,97,178,0.0) 0%, rgba(0,97,178,0.0) 40%, rgba(21,23,26,0.65) 100%)',
        }} />

        {/* Hero copy */}
        <div style={{
          position: 'absolute', left: 32, bottom: 32, right: 32, color: 'white',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        }}>
          <div>
            <div className="print" style={{ fontSize: 14, letterSpacing: 3, color: 'white', opacity: 0.85 }}>
              HOST CITY · {String(STADIUMS.findIndex(s => s.id === params.id) + 1).padStart(2, '0')} OF {STADIUMS.length}
            </div>
            <div className="hand" style={{ fontSize: 72, fontWeight: 700, lineHeight: 0.95, textShadow: '2px 2px 0 #15171a' }}>
              {stadium.name}
            </div>
            <div className="hand" style={{ fontSize: 28, opacity: 0.95, textShadow: '1px 1px 0 #15171a' }}>
              {stadium.flag} {stadium.city} · {stadium.cap.toLocaleString()} seats
            </div>
            {stadium.isFinal && (
              <div className="hand" style={{
                display: 'inline-block', marginTop: 8,
                background: '#fef4a8', color: '#15171a',
                padding: '4px 16px', borderRadius: 99, fontSize: 22, fontWeight: 700,
                border: '2px solid #15171a',
              }}>
                🏆 World Cup Final venue
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end' }}>
            {[
              [String(stadium.matches), 'matches'],
              [stadium.airport.split('·')[0].trim(), 'nearest airport'],
              [stadium.timezone.split('(')[0].trim(), stadium.timezone.split('(')[1]?.replace(')', '') || 'timezone'],
            ].map(([big, small]) => (
              <div key={big} style={{ textShadow: '1px 1px 0 #15171a', textAlign: 'center' }}>
                <div className="hand" style={{ fontSize: 48, fontWeight: 700, lineHeight: 1 }}>{big}</div>
                <div className="print" style={{ fontSize: 13 }}>{small}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '48px 80px 160px', maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 56 }}>

        {/* 1 · Match schedule */}
        <section>
          <div className="hand" style={{ fontSize: 36, fontWeight: 700, marginBottom: 4 }}>
            Match <span className="squiggle">schedule</span>
          </div>
          <div className="print" style={{ fontSize: 14, color: '#8b8b8b', marginBottom: 18 }}>
            all kickoff times in {stadium.timezone}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {schedule.map((m, i) => (
              <ScheduleCard key={i} {...m} />
            ))}
          </div>
        </section>

        {/* 2 · About the city */}
        <section>
          <div className="hand" style={{ fontSize: 36, fontWeight: 700, marginBottom: 4 }}>
            About {stadium.city.split('/')[0].trim()} <span className="squiggle">&amp; the region</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32, alignItems: 'flex-start', marginTop: 14 }}>
            <p className="print" style={{ fontSize: 18, lineHeight: 1.7, color: '#15171a', margin: 0 }}>
              {stadium.about}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {infoCards.map(([label, value, color]) => (
                <div key={label} className="ink-box" style={{ padding: '10px 14px', background: 'white' }}>
                  <div className="print" style={{ fontSize: 11, letterSpacing: 1.5, color }}>{label}</div>
                  <div className="hand" style={{ fontSize: 18, fontWeight: 600 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3 · Spots nearby */}
        <SpotsSection />
      </div>

      {/* Designer annotation */}
      <div style={{
        position: 'fixed', top: 180, right: 40, zIndex: 2,
        fontFamily: 'var(--font-caveat), cursive', color: '#E1252C',
        fontSize: 18, lineHeight: 1.05, maxWidth: 200, pointerEvents: 'none',
      }}>
        <span style={{ display: 'block', fontSize: 24 }}>↗</span>
        hero = real photo<br />
        swap the hatched area
      </div>
    </div>
  )
}
