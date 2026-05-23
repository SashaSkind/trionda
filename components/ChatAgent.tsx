'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { STADIUMS } from '@/lib/stadiums'

const TRI = {
  ink: '#15171a', inkSoft: '#4a4a4a', inkFaint: '#8b8b8b',
  paper: '#fbf7ee', paper2: '#f3eeda',
  red: '#E1252C', green: '#009A4E', blue: '#0061B2',
  redSoft: '#fde2e3',
}

interface Message {
  from: 'user' | 'agent'
  text: string
  source?: string
}

const SUGGESTED_QUESTIONS = [
  ['where do locals get coffee?', TRI.red],
  ['best bar after the match?', TRI.green],
  ['how to get there without a car?', TRI.blue],
  ['hidden gems nearby?', TRI.red],
]

const MOCK_RESPONSES: { pattern: RegExp; text: string; source: string }[] = [
  {
    pattern: /coffee/i,
    text: 'Chromatic Coffee on S Bascom is the local pick — roasts on-site, opens 6am. Multiple Reddit threads call out their cortado. 3 mi west of the stadium.',
    source: 'r/SanJose',
  },
  {
    pattern: /pizza/i,
    text: 'Here are 3 well-reviewed spots within 1.5 mi:\n1. A Slice of New York — ★ 4.7 · 0.6 mi\n2. Pizz\'A Chicago — ★ 4.5 · 0.9 mi\n3. Tony & Alba\'s — ★ 4.6 · 1.2 mi',
    source: 'Google Maps',
  },
  {
    pattern: /transit|train|subway|bus|get there|transport/i,
    text: 'VTA light rail drops you 200 metres from gate F — way better than driving on match days. The Stadium station is on the Mountain View–Winchester line. From downtown San Jose, about 20 minutes.',
    source: 'r/bayarea',
  },
  {
    pattern: /bar|drink|beer|pub|nightlife|after/i,
    text: "Scott's Bar & Grill (0.6 mi) is the closest with tons of screens — locals pack it for every big match. For craft cocktails, Paper Plane in downtown SJ is the top pick. Opens until 2am.",
    source: 'r/SanJose',
  },
  {
    pattern: /food|eat|restaurant|taco|burger|lunch|dinner/i,
    text: 'La Taqueria is the local go-to — best al pastor in the Bay, 0.8 mi from the stadium, cash only. Mi Pueblo Food Center is great for a quick affordable meal and walkable from the VTA stop.',
    source: 'r/bayarea',
  },
  {
    pattern: /hotel|stay|sleep|accommodation/i,
    text: 'Most fans stay in downtown San Jose (5 mi, lots of options) or Santa Clara itself. The Marriott Santa Clara is the closest to the stadium. Book early — prices spike 6–8 weeks out.',
    source: 'Google Maps',
  },
  {
    pattern: /ticket|seats|price|cost/i,
    text: 'Group stage tickets start around $150–400. Round of 16 upward: $300–800. Check FIFA\'s official site first, then StubHub for resale. Prices spike in the 48 hours before kick-off.',
    source: 'r/WorldCup',
  },
  {
    pattern: /weather|temperature|rain|hot|cold/i,
    text: 'June in Santa Clara is ideal — mid-70s°F (24°C), sunny and dry. Mediterranean climate means almost zero rain. Evenings cool down to the 60s. Light jacket for night matches.',
    source: 'Google Maps',
  },
]

function getMockResponse(query: string): { text: string; source: string } {
  for (const r of MOCK_RESPONSES) {
    if (r.pattern.test(query)) return { text: r.text, source: r.source }
  }
  return {
    text: `Great question about "${query}"! I'd look that up for you using Exa's Reddit search. For now, I'd recommend checking r/WorldCup or r/bayarea — the locals there are incredibly helpful for match-day logistics.`,
    source: 'r/WorldCup',
  }
}

function Bubble({ from, text, source }: { from: 'user' | 'agent'; text: string; source?: string }) {
  const isUser = from === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
      <div
        className="ink-box"
        style={{
          maxWidth: '85%', padding: '10px 14px',
          background: isUser ? TRI.ink : '#fff',
          color: isUser ? '#fff' : TRI.ink,
          borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
          fontFamily: 'var(--font-kalam), cursive', fontSize: 15, lineHeight: 1.45,
          whiteSpace: 'pre-line',
        }}
      >
        <div>{text}</div>
        {source && (
          <div
            className="print"
            style={{
              fontSize: 11, marginTop: 8, paddingTop: 6,
              borderTop: `1px dashed ${isUser ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'}`,
              opacity: 0.8, fontStyle: 'italic',
            }}
          >
            via {source}
          </div>
        )}
      </div>
    </div>
  )
}

type FabState = 'idle' | 'thinking' | 'answered'

export default function ChatAgent() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [fabState, setFabState] = useState<FabState>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Determine context from URL
  const stadiumId = pathname?.startsWith('/stadium/') ? pathname.split('/')[2] : null
  const stadium = stadiumId ? STADIUMS.find(s => s.id === stadiumId) : null
  const contextLabel = stadium ? `${stadium.name} · ${stadium.city}` : 'World Cup 2026'
  const fabLabel = stadium ? `ask about ${stadium.name}` : 'Ask Trionda'

  const initialMessage: Message = {
    from: 'agent',
    text: stadium
      ? `hi! I can see you're on the ${stadium.name} page. ask me anything about ${stadium.city} — matches, food, transit, hidden gems.`
      : 'hi! I\'m Trionda Assist. ask me anything about the World Cup 2026 — stadiums, cities, travel tips, local food.',
  }

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([initialMessage])
    }
  }, [open]) // eslint-disable-line

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const sendMessage = (text: string) => {
    const q = text.trim()
    if (!q) return
    setInput('')
    setMessages(prev => [...prev, { from: 'user', text: q }])
    setFabState('thinking')

    setTimeout(() => {
      const response = getMockResponse(q)
      setMessages(prev => [...prev, { from: 'agent', text: response.text, source: response.source }])
      setFabState('answered')
      setTimeout(() => setFabState('idle'), 3000)
    }, 800 + Math.random() * 600)
  }

  return (
    <>
      {/* Floating chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 100, right: 26, zIndex: 50,
          width: 420, height: 540,
          background: 'white', border: `2.4px solid ${TRI.ink}`, borderRadius: 14,
          boxShadow: `6px 6px 0 ${TRI.ink}`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'fadeSlideUp 0.2s ease-out',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
            borderBottom: `2px solid ${TRI.ink}`, background: TRI.paper,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', background: TRI.red,
              border: `1.8px solid ${TRI.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 3 6 Q 3 3 6 3 L 18 3 Q 21 3 21 6 L 21 14 Q 21 17 18 17 L 11 17 L 6 21 L 6 17 Q 3 17 3 14 Z"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="hand" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>trionda assist</div>
              <div className="print" style={{ fontSize: 11, color: TRI.inkSoft }}>
                <span style={{ color: TRI.green }}>●</span> {contextLabel}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="btn-sketch"
              style={{ padding: '0 8px', fontSize: 14, height: 26 }}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: 14, background: TRI.paper, overflowY: 'auto' }}>
            {messages.map((m, i) => (
              <Bubble key={i} from={m.from} text={m.text} source={m.source} />
            ))}
            {fabState === 'thinking' && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
                <div className="ink-box" style={{ padding: '10px 14px', background: 'white', borderRadius: '14px 14px 14px 4px', fontFamily: 'Caveat', fontSize: 22, color: TRI.red }}>
                  ...
                </div>
              </div>
            )}
            {/* Suggested questions when only welcome message */}
            {messages.length === 1 && (
              <div>
                <div className="print" style={{ fontSize: 12, color: TRI.inkFaint, margin: '4px 0 8px' }}>try:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {SUGGESTED_QUESTIONS.map(([q, color]) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="ink-box"
                      style={{
                        padding: '6px 10px', background: 'white',
                        fontFamily: 'var(--font-caveat), cursive', fontSize: 16,
                        borderLeft: `4px solid ${color}`, cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: 12, borderTop: `2px solid ${TRI.ink}`, background: TRI.paper, display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendMessage(input) }}
              placeholder={`ask anything about ${stadium ? stadium.city : 'the World Cup'}…`}
              className="ink-box"
              style={{
                flex: 1, padding: '8px 12px', background: 'white',
                fontFamily: 'var(--font-kalam), cursive', fontSize: 15, color: TRI.ink,
                outline: 'none',
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              className="btn-sketch solid"
              style={{ width: 44, justifyContent: 'center', padding: '8px 0', fontSize: 18 }}
            >
              →
            </button>
          </div>
        </div>
      )}

      {/* FAB — combined pill button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 26, right: 26, zIndex: 50,
          display: 'flex', alignItems: 'center', gap: 10,
          background: TRI.green, border: `2.4px solid ${TRI.ink}`,
          borderRadius: 999, padding: '10px 20px 10px 14px',
          boxShadow: `3px 3px 0 ${TRI.ink}`,
          cursor: 'pointer', transition: 'transform 0.15s',
        }}
      >
        {fabState === 'thinking' ? (
          <span className="hand" style={{ fontSize: 22, color: 'white', lineHeight: 1 }}>...</span>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 3 6 Q 3 3 6 3 L 18 3 Q 21 3 21 6 L 21 14 Q 21 17 18 17 L 11 17 L 6 21 L 6 17 Q 3 17 3 14 Z"/>
          </svg>
        )}
        <span
          className="hand"
          style={{ fontSize: 20, color: 'white', fontWeight: 600, lineHeight: 1 }}
        >
          {fabLabel}
        </span>
        {fabState === 'answered' && (
          <div style={{
            position: 'absolute', top: -4, right: -4, width: 18, height: 18,
            borderRadius: '50%', background: TRI.red, border: `1.6px solid ${TRI.ink}`,
            fontSize: 11, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-kalam), cursive', fontWeight: 700,
          }}>1</div>
        )}
      </button>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
