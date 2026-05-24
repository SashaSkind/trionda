'use client'

import Link from 'next/link'
import Logo from './Logo'
import { useIsMobile } from '@/lib/hooks'

interface TopBarProps {
  title?: string
  right?: React.ReactNode
}

export default function TopBar({ title, right }: TopBarProps) {
  const isMobile = useIsMobile()

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
        <div className="hand squiggle" style={{ fontSize: 22, flex: 1, textAlign: 'center', minWidth: 0 }}>{title}</div>
      )}
      <div style={{ display: 'flex', gap: 12 }}>
        {right ?? (
          <button className="btn-sketch" style={{ fontSize: 16 }}>🇬🇧 EN</button>
        )}
      </div>
    </div>
  )
}
