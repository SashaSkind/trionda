'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import TopBar from './TopBar'
import MapDrawer from './MapDrawer'
import { STADIUMS, Stadium } from '@/lib/stadiums'
import { useIsMobile } from '@/lib/hooks'

const SketchyMap = dynamic(() => import('./SketchyMap'), { ssr: false })

export default function MapLanding() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [hoveredStadium, setHoveredStadium] = useState<Stadium>(STADIUMS.find(s => s.id === 'nyc')!)

  const map = (
    <SketchyMap
      highlightId={hoveredStadium.id}
      onHover={s => setHoveredStadium(s)}
      onSelect={s => router.push(`/stadium/${s.id}`)}
    />
  )

  // mobile: vertical scroll layout — map → card stacked in normal flow
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#fbf7ee' }}>
        <TopBar title="16 stadiums. 3 countries. 1 tournament." />

        {/* Map — fixed height so it doesn't fill the whole screen */}
        <div style={{
          height: '52vh', minHeight: 300, flexShrink: 0,
          margin: '0 16px',
          border: '2.4px solid #15171a', borderRadius: 12,
          overflow: 'hidden', background: '#fbf7ee',
        }}>
          {map}
        </div>

        {/* Info card sits naturally below the map */}
        <div style={{ padding: '12px 16px 120px' }}>
          <MapDrawer stadium={hoveredStadium} inline />
        </div>
      </div>
    )
  }

  // desktop: full-screen overlay layout
  return (
    <div style={{
      position: 'relative', width: '100%',
      height: '100dvh', minHeight: '100vh',
      background: '#fbf7ee', overflow: 'hidden',
    }}>
      <TopBar title="16 stadiums. 3 countries. 1 tournament." />

      <div style={{
        position: 'absolute', inset: '70px 26px 220px 26px',
        border: '2.4px solid #15171a', borderRadius: 12,
        overflow: 'hidden', background: '#fbf7ee',
      }}>
        {map}
      </div>

      <MapDrawer stadium={hoveredStadium} />
    </div>
  )
}
