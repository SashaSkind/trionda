'use client'

import dynamic from 'next/dynamic'
import Logo from './Logo'

const SketchyMap = dynamic(() => import('./SketchyMap'), { ssr: false })

const TRI = {
  ink: '#15171a', inkSoft: '#4a4a4a', inkFaint: '#8b8b8b',
  red: '#E1252C', green: '#009A4E', blue: '#0061B2',
}

function Frame({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 26, height: 26, borderRadius: '50%', background: TRI.ink, color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-kalam), cursive', fontWeight: 700, fontSize: 14,
        }}>{n}</div>
        <div className="hand" style={{ fontSize: 22, fontWeight: 700 }}>{title}</div>
      </div>
      <div className="ink-box" style={{ flex: 1, background: 'white', overflow: 'hidden', position: 'relative', minHeight: 380 }}>
        {children}
      </div>
    </div>
  )
}

function ChatPreview() {
  return (
    <div style={{ padding: 10, background: '#fbf7ee', height: '100%', position: 'relative' }}>
      {/* User bubble */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <div className="ink-box" style={{
          padding: '8px 12px', background: TRI.ink, color: 'white',
          borderRadius: '14px 14px 4px 14px', fontFamily: 'var(--font-kalam), cursive', fontSize: 14, maxWidth: '85%',
        }}>
          where for coffee that isn't Starbucks?
        </div>
      </div>
      {/* Agent bubble */}
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <div className="ink-box" style={{
          padding: '8px 12px', background: 'white',
          borderRadius: '14px 14px 14px 4px', fontFamily: 'var(--font-kalam), cursive', fontSize: 14, maxWidth: '85%',
        }}>
          <div><b>Chromatic Coffee</b> on S Bascom — locals' pick. Roasts on-site, opens 6am.</div>
          <div className="print" style={{
            fontSize: 11, marginTop: 6, paddingTop: 6,
            borderTop: '1px dashed rgba(0,0,0,0.2)',
            opacity: 0.8, fontStyle: 'italic',
          }}>
            via r/SanJose
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Storyboard() {
  return (
    <div style={{ background: '#fbf7ee', minHeight: '100vh', padding: '60px 48px 120px' }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div className="hand" style={{ fontSize: 42, fontWeight: 700 }}>map → stadium → ask → answer</div>
        <div className="print" style={{ fontSize: 16, color: TRI.inkSoft, marginBottom: 8 }}>
          the demo flow, in four frames · under 30 seconds
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <a href="/" className="btn-sketch" style={{ fontSize: 16 }}>← Back to map</a>
          <div className="print" style={{ fontSize: 14, color: TRI.inkFaint, display: 'flex', alignItems: 'center' }}>
            World Cup 2026 · Trionda Assist
          </div>
        </div>
      </div>

      {/* 4-frame storyboard */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <Frame n={1} title="opens the app">
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <SketchyMap width={900} height={560} highlightId="lax" />
          </div>
        </Frame>

        {/* Arrow */}
        <div style={{ flexShrink: 0, paddingTop: 200, fontFamily: 'Caveat', fontSize: 36, color: TRI.red }}>→</div>

        <Frame n={2} title="taps MetLife, NJ">
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <SketchyMap width={900} height={560} highlightId="nyc" />
          </div>
        </Frame>

        {/* Arrow */}
        <div style={{ flexShrink: 0, paddingTop: 200, fontFamily: 'Caveat', fontSize: 36, color: TRI.red }}>→</div>

        <Frame n={3} title="stadium page">
          <div style={{
            width: '100%', height: '100%',
            background: 'repeating-linear-gradient(135deg, #ece6d3, #ece6d3 8px, #e5dec4 8px, #e5dec4 16px)',
            position: 'relative',
          }}>
            <div style={{ position: 'absolute', left: 12, bottom: 12, color: 'white', textShadow: `2px 2px 0 ${TRI.ink}` }}>
              <div className="hand" style={{ fontSize: 28, fontWeight: 700 }}>MetLife Stadium</div>
              <div className="print" style={{ fontSize: 13 }}>New York/NJ · 8 matches · 🏆 FINAL</div>
            </div>
            <div style={{ position: 'absolute', top: 12, left: 12 }}>
              <Logo size={14} />
            </div>
            <div style={{
              position: 'absolute', top: 50, left: 12, right: 12, height: 120,
              background: 'rgba(21,23,26,0.15)', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Caveat', fontSize: 16, color: 'rgba(21,23,26,0.5)',
            }}>
              aerial hero photo
            </div>
            {/* Mini FAB */}
            <div style={{
              position: 'absolute', bottom: 14, left: 14,
              width: 36, height: 36, borderRadius: '50%',
              background: TRI.ink, border: `1.6px solid ${TRI.ink}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '2px 2px 0 ' + TRI.ink,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 3 6 Q 3 3 6 3 L 18 3 Q 21 3 21 6 L 21 14 Q 21 17 18 17 L 11 17 L 6 21 L 6 17 Q 3 17 3 14 Z"/>
              </svg>
            </div>
          </div>
        </Frame>

        {/* Arrow */}
        <div style={{ flexShrink: 0, paddingTop: 200, fontFamily: 'Caveat', fontSize: 36, color: TRI.red }}>→</div>

        <Frame n={4} title="asks the agent">
          <ChatPreview />
        </Frame>
      </div>

      {/* Source note */}
      <div style={{ marginTop: 48, padding: '20px 24px', background: 'white', borderRadius: 10, border: '1.8px solid #15171a', maxWidth: 600 }}>
        <div className="hand" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>How it works</div>
        <div className="print" style={{ fontSize: 15, lineHeight: 1.6, color: TRI.inkSoft }}>
          The chat agent routes each question to the right source: qualitative questions (coffee, hidden gems, vibe) → Reddit via Exa.
          Structured queries (restaurants, hotels, transit) → Google Maps Places.
          The source is always credited as a single italic line at the bottom of the answer.
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {['via exa.ai', 'via r/SanJose', 'via r/WorldCup', 'via Google Maps'].map(s => (
            <span key={s} className="ink-box" style={{ padding: '4px 12px', fontFamily: 'var(--font-caveat), cursive', fontSize: 16, color: TRI.inkSoft, fontStyle: 'italic', background: 'white' }}>{s}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
