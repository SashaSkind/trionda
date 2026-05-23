'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Stadium } from '@/lib/stadiums'

const MATCH_ROUNDS: Record<string, string[]> = {
  nyc: ['Group stage', 'Round of 32', 'Round of 16', 'FINAL'],
  dal: ['Group stage', 'Round of 32', 'Round of 16', 'Quarter-final'],
  lax: ['Group stage', 'Round of 32', 'Round of 16', 'Quarter-final'],
  atl: ['Group stage', 'Round of 32', 'Round of 16', 'Quarter-final'],
  default: ['Group stage', 'Round of 32', 'Round of 16', 'Round of 16'],
}

export default function MapDrawer({ stadium }: { stadium: Stadium }) {
  const rounds = MATCH_ROUNDS[stadium.id] || MATCH_ROUNDS.default

  return (
    <div
      className="preview-card"
      style={{
        position: 'absolute', bottom: 26, left: 26, right: 26, height: 180,
        background: 'white', border: '2.4px solid #15171a', borderRadius: 12,
        boxShadow: '5px 5px 0 #15171a',
        display: 'flex', gap: 18, padding: 18, alignItems: 'stretch',
      }}
    >
      {/* Thumbnail */}
      <div style={{
        width: 280, borderRadius: 8, overflow: 'hidden',
        border: '1.6px solid #15171a',
        flexShrink: 0, position: 'relative',
      }}>
        <Image
          src={stadium.image}
          alt={`Aerial view of ${stadium.name}`}
          fill
          style={{ objectFit: 'cover' }}
          sizes="280px"
        />
      </div>

      {/* Info */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span className="hand" style={{ fontSize: 36, fontWeight: 700 }}>{stadium.name}</span>
          <span className="print" style={{ fontSize: 16, color: '#4a4a4a' }}>{stadium.flag} {stadium.city}</span>
        </div>
        <div className="print" style={{ fontSize: 14, color: '#4a4a4a', marginBottom: 10 }}>
          capacity {stadium.cap.toLocaleString()} · {stadium.matches} matches
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {rounds.map((m, i) => (
            <span
              key={i}
              className="ink-box print"
              style={{ padding: '3px 10px', fontSize: 14, color: '#4a4a4a', background: i === 3 && stadium.isFinal ? '#fef4a8' : 'white' }}
            >
              {m}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
          <Link href={`/stadium/${stadium.id}`} className="btn-sketch red" style={{ fontSize: 16 }}>
            Explore stadium →
          </Link>
        </div>
      </div>
    </div>
  )
}
