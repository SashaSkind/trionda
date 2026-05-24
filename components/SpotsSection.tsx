'use client'

import { useState } from 'react'

const TRI = { red: '#E1252C', green: '#009A4E', blue: '#0061B2', ink: '#15171a', inkFaint: '#8b8b8b', inkSoft: '#4a4a4a' }

interface Spot {
  name: string
  meta: string
  why?: string
  mapsUrl?: string
}

// Static fallback shown only when no `spots` prop is passed (e.g. when the
// Google Maps API key isn't set or the page is rendered without server data).
// In normal operation, the stadium page passes real per-stadium results.
const FALLBACK_SPOTS: Record<string, Spot[]> = {
  Food: [
    { name: 'La Taqueria',             meta: '4.8 · $$ · Tacos · 0.8 mi',          why: 'best al pastor in the bay' },
    { name: 'Mi Pueblo Food Center',   meta: '4.7 · $ · Mexican · 1.1 mi',         why: 'walkable from VTA' },
    { name: 'Sundance the Steakhouse', meta: '4.6 · $$$ · Steakhouse · 0.4 mi',    why: 'pre-game staple' },
    { name: 'Pho Hanoi',               meta: '4.6 · $ · Vietnamese · 1.0 mi',       why: 'kitchen open late' },
    { name: 'Birrieria El Padrino',    meta: '4.8 · $ · Birria · 1.4 mi',          why: 'locals only' },
  ],
  Coffee: [
    { name: 'Chromatic Coffee',   meta: '4.7 · $ · 2.9 mi',  why: 'roasts on-site, opens 6am' },
    { name: 'Voyager Craft Coffee', meta: '4.6 · $ · 1.1 mi', why: 'cortado is the move' },
    { name: 'Academic Coffee',    meta: '4.7 · $ · 5.0 mi',  why: 'study + match prep' },
    { name: 'Caffe Frascati',     meta: '4.5 · $ · 4.8 mi',  why: 'historic + outdoor seats' },
    { name: 'Hub Coffee',         meta: '4.6 · $ · 0.7 mi',  why: 'closest to gate F' },
  ],
  Shopping: [
    { name: 'Valley Fair Mall',    meta: '4.4 · Free parking · 1.2 mi', why: 'Hermès to H&M under one roof' },
    { name: 'Santana Row',         meta: '4.6 · Outdoor · 1.5 mi',      why: 'luxury brands + good restaurants' },
    { name: 'Westfield Oakridge',  meta: '4.2 · 2.0 mi',                why: 'electronics + essentials' },
    { name: 'Willow Glen Village', meta: '4.7 · Boutiques · 3.8 mi',    why: 'local designers, no chains' },
    { name: 'Grand Century Mall',  meta: '4.5 · Asian market · 4.2 mi', why: 'incredible food court' },
  ],
  Nightlife: [
    { name: "Scott's Bar & Grill", meta: '4.6 · Sports bar · 0.6 mi', why: 'screens everywhere, locals pack it' },
    { name: 'The Loft',            meta: '4.5 · Cocktail bar · 1.2 mi', why: 'craft cocktails + rooftop' },
    { name: 'San Pedro Social',    meta: '4.4 · Beer garden · 1.6 mi',  why: 'huge space, pregame or postgame' },
    { name: 'Paper Plane',         meta: '4.7 · Cocktails · 3.4 mi',   why: 'best bar in SJ per locals' },
    { name: 'Cinebar',             meta: '4.5 · Chill · 3.2 mi',       why: 'classic dive, cheap pints' },
  ],
  Activities: [
    { name: 'Computer History Museum', meta: '4.8 · Museum · 1.8 mi', why: 'world-class, free on Sundays' },
    { name: 'Shoreline Park',          meta: '4.7 · Outdoors · 4.0 mi', why: 'kayak before the match' },
    { name: 'Winchester Mystery House', meta: '4.6 · Tour · 3.5 mi',   why: 'unique to the Bay Area' },
    { name: 'Hakone Gardens',          meta: '4.8 · Gardens · 10 mi',  why: 'peaceful Japanese garden' },
    { name: 'Lick Observatory Hike',   meta: '4.7 · Hike · 15 mi',     why: 'views of the whole Bay Area' },
  ],
}

const CATS = [
  { name: 'Food',       emoji: '🍴' },
  { name: 'Coffee',     emoji: '☕' },
  { name: 'Shopping',   emoji: '🛍' },
  { name: 'Nightlife',  emoji: '🍺' },
  { name: 'Activities', emoji: '✨' },
]

const rankColors = [TRI.red, TRI.blue, TRI.green, '#fef4a8', '#fef4a8']
const rankTextColors = ['white', 'white', 'white', TRI.ink, TRI.ink]

interface Props {
  spots?: Record<string, Spot[]>
}

export default function SpotsSection({ spots }: Props) {
  const data = spots && Object.keys(spots).length > 0 ? spots : FALLBACK_SPOTS
  const [active, setActive] = useState('Food')
  const list = data[active] || []

  return (
    <section>
      <div className="hand" style={{ fontSize: 36, fontWeight: 700, marginBottom: 4 }}>
        Spots <span className="squiggle">nearby</span>
      </div>
      <div className="print" style={{ fontSize: 14, color: TRI.inkFaint, marginBottom: 18 }}>
        top 5 per category · via Google Maps Places, sorted by ★
      </div>

      <div className="spots-grid" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 28, alignItems: 'flex-start' }}>
        {/* Category sidebar */}
        <aside className="spots-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'sticky', top: 80 }}>
          {CATS.map(c => {
            const on = c.name === active
            const n = (data[c.name] ?? []).length
            return (
              <button
                key={c.name}
                onClick={() => setActive(c.name)}
                className="ink-box"
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', cursor: 'pointer',
                  background: on ? TRI.ink : 'white',
                  color: on ? 'white' : TRI.ink,
                  boxShadow: on ? `3px 3px 0 ${TRI.red}` : 'none',
                  fontFamily: 'var(--font-caveat), cursive', fontSize: 22, fontWeight: 600,
                  textAlign: 'left', border: 'none',
                }}
              >
                <span style={{ fontSize: 22 }}>{c.emoji}</span>
                <span style={{ flex: 1 }}>{c.name}</span>
                <span className="print" style={{ fontSize: 13, opacity: on ? 0.8 : 0.5 }}>{n}</span>
              </button>
            )
          })}
          <div className="print" style={{ fontSize: 12, color: TRI.inkFaint, padding: '12px 4px', lineHeight: 1.4 }}>
            need something specific?<br />ask the agent ↘
          </div>
        </aside>

        {/* Spots list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.length === 0 && (
            <div className="ink-box" style={{ padding: '18px 22px', background: 'white', color: TRI.inkSoft, fontFamily: 'var(--font-caveat), cursive', fontSize: 18 }}>
              no {active.toLowerCase()} spots yet — Google Places hasn't returned results for this stadium.
            </div>
          )}
          {list.map((s, i) => (
            <div key={i} className="ink-box spot-card" style={{ padding: '14px 18px', background: 'white', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: rankColors[i], color: rankTextColors[i],
                border: `1.6px solid ${TRI.ink}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-caveat), cursive', fontWeight: 700, fontSize: 20,
                flexShrink: 0,
              }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div className="hand" style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.1 }}>{s.name}</div>
                <div className="print" style={{ fontSize: 13, color: TRI.inkSoft }}>{s.meta}</div>
                {s.why && (
                  <div className="print" style={{ fontSize: 13, color: TRI.red, fontStyle: 'italic' }}>"{s.why}"</div>
                )}
              </div>
              {s.mapsUrl ? (
                <a
                  href={s.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-sketch"
                  style={{ fontSize: 14, padding: '3px 10px', flexShrink: 0, textDecoration: 'none' }}
                >
                  open in maps ↗
                </a>
              ) : (
                <button className="btn-sketch" style={{ fontSize: 14, padding: '3px 10px', flexShrink: 0 }}>
                  open in maps ↗
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
