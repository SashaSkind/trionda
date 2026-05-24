'use client'

import Link from 'next/link'
import Logo from './Logo'
import { useIsMobile } from '@/lib/hooks'
import { useState, useRef, useEffect } from 'react'

interface TopBarProps {
  title?: string
  right?: React.ReactNode
}

export default function TopBar({ title, right }: TopBarProps) {
  const isMobile = useIsMobile()
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)

  // close the popover when clicking outside
  useEffect(() => {
    if (!langOpen) return
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [langOpen])

  // on mobile the layout is a normal flex column, so TopBar lives in flow
  // on desktop it overlays the full-screen map, so it stays absolute
  const style = isMobile
    ? {
        position: 'relative' as const,
        padding: '12px 16px',
        zIndex: 5,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: 8,
        flexShrink: 0,
      }
    : {
        position: 'absolute' as const,
        top: 22,
        left: 26,
        right: 26,
        zIndex: 5,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: 8,
      }

  return (
    <div style={style}>
      <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
        <Logo />
      </Link>
      {title && !isMobile && (
        <div className="hand" style={{ fontSize: 22, flex: 1, textAlign: 'center', minWidth: 0 }}>
          <span className="squiggle">{title}</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 12 }}>
        {right ?? (
          <div ref={langRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button
              className="btn-sketch"
              style={{ fontSize: 16 }}
              onClick={() => setLangOpen(o => !o)}
            >
              🇬🇧 EN
            </button>
            {langOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: 'white', border: '1.8px solid #15171a',
                borderRadius: 8, padding: '10px 16px',
                boxShadow: '3px 3px 0 #15171a',
                whiteSpace: 'nowrap', zIndex: 50,
              }}>
                <div className="hand" style={{ fontSize: 15, color: '#15171a', marginBottom: 2 }}>
                  More languages
                </div>
                <div className="print" style={{ fontSize: 13, color: '#8b8b8b' }}>
                  translations coming soon
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
