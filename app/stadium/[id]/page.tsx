import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Logo from '@/components/Logo'
import ScheduleCard from '@/components/ScheduleCard'
import SpotsSection from '@/components/SpotsSection'
import { STADIUMS, getStadium } from '@/lib/stadiums'
import { getSpotsByCategory } from '@/lib/spots'

export function generateStaticParams() {
  return STADIUMS.map(s => ({ id: s.id }))
}

import scheduleData from '@/data/schedule.json'

type ScheduleEntry = { teams: string; date: string; time: string; stage: string; highlight?: boolean }
const SCHEDULE = scheduleData as Record<string, ScheduleEntry[]>

function getSchedule(id: string): ScheduleEntry[] {
  if (SCHEDULE[id]) return SCHEDULE[id]
  const s = getStadium(id)
  if (!s) return []
  return Array.from({ length: s.matches }, (_, i) => ({
    teams: 'TBD  vs  TBD',
    date: 'TBD',
    time: 'TBD',
    stage: `Match ${i + 1}`,
    highlight: i === 0,
  }))
}

export default async function StadiumPage({ params }: { params: { id: string } }) {
  const stadium = getStadium(params.id)
  if (!stadium) notFound()

  const schedule = getSchedule(params.id)
  const spots = await getSpotsByCategory(params.id).catch(() => ({}))

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
      <nav className="stadium-nav" style={{
        position: 'sticky', top: 0, zIndex: 20,
        padding: '18px 32px',
        display: 'flex', alignItems: 'center', gap: 16,
        background: 'linear-gradient(180deg, rgba(251,247,238,0.98), rgba(251,247,238,0.90))',
        backdropFilter: 'blur(8px)',
        borderBottom: '1.4px solid rgba(21,23,26,0.08)',
      }}>
        <Link href="/" className="btn-sketch" style={{ padding: '4px 14px', fontSize: 16 }}>← Map</Link>
        <div className="hand nav-stadium-name" style={{ fontSize: 18, color: '#4a4a4a' }}>/ {stadium.name}</div>
        <div style={{ flex: 1 }} />
        <Logo size={18} />
      </nav>

      {/* Hero — full-bleed */}
      <div className="stadium-hero" style={{ position: 'relative', width: '100%', height: 640, overflow: 'hidden' }}>
        {/* Aerial stadium photo */}
        <Image
          src={stadium.image}
          alt={`Aerial view of ${stadium.name}`}
          fill
          priority
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          sizes="100vw"
        />

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(0,97,178,0.0) 0%, rgba(0,97,178,0.0) 40%, rgba(21,23,26,0.65) 100%)',
        }} />

        {/* Hero copy */}
        <div className="stadium-hero-footer" style={{
          position: 'absolute', left: 32, bottom: 32, right: 32, color: 'white',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        }}>
          <div>
            <div className="print" style={{ fontSize: 14, letterSpacing: 3, color: 'white', opacity: 0.85 }}>
              HOST CITY · {String(STADIUMS.findIndex(s => s.id === params.id) + 1).padStart(2, '0')} OF {STADIUMS.length}
            </div>
            <div className="hand" style={{ fontSize: 'clamp(36px, 10vw, 72px)', fontWeight: 700, lineHeight: 0.95, textShadow: '2px 2px 0 #15171a' }}>
              {stadium.name}
            </div>
            <div className="hand" style={{ fontSize: 'clamp(18px, 4vw, 28px)', opacity: 0.95, textShadow: '1px 1px 0 #15171a' }}>
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
          <div className="stadium-hero-stats" style={{ display: 'flex', gap: 24, alignItems: 'flex-end' }}>
            {[
              [String(stadium.matches), 'matches'],
              [stadium.airport.split('·')[0].trim(), 'nearest airport'],
              [stadium.timezone.split('(')[0].trim(), stadium.timezone.split('(')[1]?.replace(')', '') || 'timezone'],
            ].map(([big, small]) => (
              <div key={big} style={{ textShadow: '1px 1px 0 #15171a', textAlign: 'center' }}>
                <div className="hand" style={{ fontSize: 'clamp(28px, 6vw, 48px)', fontWeight: 700, lineHeight: 1 }}>{big}</div>
                <div className="print" style={{ fontSize: 13 }}>{small}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="stadium-body" style={{ padding: '48px 80px 160px', maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 56 }}>

        {/* 1 · Match schedule */}
        <section>
          <div className="hand" style={{ fontSize: 36, fontWeight: 700, marginBottom: 4 }}>
            Match <span className="squiggle">schedule</span>
          </div>
          <div className="print" style={{ fontSize: 14, color: '#8b8b8b', marginBottom: 18 }}>
            all kickoff times in {stadium.timezone}
          </div>
          <div className="stadium-schedule-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
          <div className="stadium-about-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32, alignItems: 'flex-start', marginTop: 14 }}>
            <p className="print" style={{ fontSize: 18, lineHeight: 1.7, color: '#15171a', margin: 0 }}>
              {stadium.about}
            </p>
            <div className="stadium-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
        <SpotsSection spots={spots} />
      </div>

    </div>
  )
}
