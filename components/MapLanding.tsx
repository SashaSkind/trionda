'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import TopBar from './TopBar'
import MapDrawer from './MapDrawer'
import { STADIUMS, Stadium } from '@/lib/stadiums'

const SketchyMap = dynamic(() => import('./SketchyMap'), { ssr: false })

export default function MapLanding() {
  const router = useRouter()
  const [hoveredStadium, setHoveredStadium] = useState<Stadium>(STADIUMS.find(s => s.id === 'nyc')!)

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#fbf7ee', overflow: 'hidden' }}>
      <TopBar title="16 stadiums. 3 countries. 1 tournament." />

      {/* Map container */}
      <div style={{
        position: 'absolute', inset: '70px 26px 220px 26px',
        border: '2.4px solid #15171a', borderRadius: 12,
        overflow: 'hidden', background: '#fbf7ee',
      }}>
        <SketchyMap
          highlightId={hoveredStadium.id}
          onHover={s => setHoveredStadium(s)}
          onSelect={s => router.push(`/stadium/${s.id}`)}
        />
      </div>

      {/* Bottom drawer */}
      <MapDrawer stadium={hoveredStadium} />


    </div>
  )
}
