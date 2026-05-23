'use client'

import { useEffect, useRef, useState } from 'react'
import { STADIUMS, Stadium } from '@/lib/stadiums'

const TRI = {
  ink: '#15171a', inkSoft: '#4a4a4a', inkFaint: '#8b8b8b',
  paper: '#fbf7ee',
  red: '#E1252C', green: '#009A4E', blue: '#0061B2',
}

interface Props {
  width?: number
  height?: number
  highlightId?: string
  onHover?: (s: Stadium) => void
  onSelect?: (s: Stadium) => void
}

export default function SketchyMap({
  width = 1640, height = 1320,
  highlightId = 'nyc',
  onHover,
  onSelect,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredId, setHoveredId] = useState(highlightId)
  const [projected, setProjected] = useState<(Stadium & { x: number; y: number })[] | null>(null)
  const [loadError, setLoadError] = useState(false)

  // Build the rough.js map
  useEffect(() => {
    let cancelled = false

    async function build() {
      try {
        const [d3mod, topomod, roughmod] = await Promise.all([
          import('d3'),
          import('topojson-client'),
          import('roughjs'),
        ])
        const d3 = d3mod
        const topojson = topomod
        const rough = roughmod.default

        const data = await fetch('https://unpkg.com/world-atlas@2.0.2/countries-110m.json').then(r => r.json())
        if (cancelled) return

        const countries = topojson.feature(data as any, (data as any).objects.countries) as any
        const NA = countries.features.filter((f: any) => ['840', '124', '484'].includes(String(f.id)))

        const projection = d3.geoAlbers()
          .rotate([96, 0])
          .center([0, 38])
          .parallels([25, 50])
          .scale(width * 1.0)
          .translate([width / 2, height / 2 - 140])

        const geoPath = d3.geoPath(projection)

        const svg = svgRef.current
        if (!svg) return
        while (svg.firstChild) svg.removeChild(svg.firstChild)

        const rc = rough.svg(svg)

        const fill: Record<string, string> = { '840': '#e5edf6', '124': '#f5dfe1', '484': '#dff0e6' }

        NA.forEach((f: any) => {
          const d = geoPath(f)
          if (!d) return
          const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')

          // shadow pass — no stroke, just offset fill for depth
          const back = rc.path(d, {
            roughness: 0.8, bowing: 0.6, strokeWidth: 0,
            fill: fill[String(f.id)] || '#f1ece0', fillStyle: 'solid',
          })
          back.setAttribute('transform', 'translate(2.5,3)')
          back.setAttribute('opacity', '0.4')
          g.appendChild(back)

          // single clean-but-wobbly stroke pass
          const node = rc.path(d, {
            roughness: 0.9, bowing: 0.7,
            stroke: TRI.ink, strokeWidth: 1.5,
            fill: fill[String(f.id)] || '#f1ece0', fillStyle: 'solid', fillWeight: 1.2,
          })
          g.appendChild(node)
          svg.appendChild(g)
        })

        // Country labels
        const labels: [string, number, number][] = [
          ['CANADA', -85, 50],
          ['UNITED STATES', -98, 39],
          ['MEXICO', -102, 23.5],
        ]
        labels.forEach(([name, lon, lat]) => {
          const pt = projection([lon, lat])
          if (!pt) return
          const [x, y] = pt
          const t = document.createElementNS('http://www.w3.org/2000/svg', 'text')
          t.setAttribute('x', String(x))
          t.setAttribute('y', String(y))
          t.setAttribute('text-anchor', 'middle')
          t.setAttribute('font-family', 'Caveat')
          t.setAttribute('font-size', '34')
          t.setAttribute('letter-spacing', '4')
          t.setAttribute('fill', TRI.ink)
          t.setAttribute('opacity', '0.32')
          t.textContent = name
          svg.appendChild(t)
        })

        // Project stadium pins
        const stops = STADIUMS.map(s => {
          const pt = projection([s.lon, s.lat])
          return { ...s, x: pt ? pt[0] : 0, y: pt ? pt[1] : 0 }
        })
        if (!cancelled) setProjected(stops)
      } catch (err) {
        console.error('Map build failed', err)
        if (!cancelled) setLoadError(true)
      }
    }

    build()
    return () => { cancelled = true }
  }, [width, height])

  // Drag-to-pan
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let dragging = false, startX = 0, startY = 0, sl = 0, st = 0
    const down = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('.map-pin') || t.closest('.preview-card')) return
      dragging = true
      startX = e.clientX; startY = e.clientY
      sl = el.scrollLeft; st = el.scrollTop
      el.style.cursor = 'grabbing'
    }
    const move = (e: MouseEvent) => {
      if (!dragging) return
      el.scrollLeft = sl - (e.clientX - startX)
      el.scrollTop = st - (e.clientY - startY)
    }
    const up = () => { dragging = false; el.style.cursor = 'grab' }
    el.addEventListener('mousedown', down)
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => {
      el.removeEventListener('mousedown', down)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
  }, [])

  // Center on US after first render
  useEffect(() => {
    if (!projected || !containerRef.current) return
    const el = containerRef.current
    el.scrollLeft = Math.max(0, (width - el.clientWidth) / 2)
    // offset upward so the US sits in view, not southern Mexico
    el.scrollTop = Math.max(0, (height - el.clientHeight) / 2 - 200)
  }, [projected, width, height])

  const handlePinInteract = (s: Stadium & { x: number; y: number }) => {
    setHoveredId(s.id)
    onHover?.(s)
  }

  return (
    <div
      ref={containerRef}
      className="scrollbar-hide paper-texture"
      style={{ width: '100%', height: '100%', overflow: 'auto', cursor: 'grab', position: 'relative' }}
    >
      <div style={{ width, height, position: 'relative' }}>
        <svg
          ref={svgRef}
          width={width}
          height={height}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        />
        {loadError && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Caveat', fontSize: 22, color: TRI.red }}>
            (offline — connect to load the sketchy map)
          </div>
        )}

        {/* Pins */}
        {projected?.map(s => {
          const active = s.id === hoveredId
          return (
            <div
              key={s.id}
              className={`map-pin ${s.country} ${active ? 'active' : ''}`}
              style={{ left: s.x, top: s.y }}
              onMouseEnter={() => handlePinInteract(s)}
              onClick={() => { handlePinInteract(s); onSelect?.(s) }}
            >
              <div className="dot" />
              <span className="pin-label">{s.city}</span>
            </div>
          )
        })}
      </div>

      {/* Legend HUD */}
      <div style={{
        position: 'sticky', left: 16, bottom: 16, marginTop: -64, width: 'fit-content',
        background: 'white', border: `1.8px solid ${TRI.ink}`, borderRadius: 10, padding: '8px 12px',
        fontFamily: 'Caveat', fontSize: 16, boxShadow: `3px 3px 0 ${TRI.ink}`,
        display: 'flex', gap: 12, alignItems: 'center', zIndex: 3,
      }}>
        {[['USA', TRI.blue], ['Canada', TRI.red], ['Mexico', TRI.green]].map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, background: color, borderRadius: '50%', border: `1.2px solid ${TRI.ink}`, display: 'inline-block' }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}
