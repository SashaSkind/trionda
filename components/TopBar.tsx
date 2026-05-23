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

  return (
    <div style={{
      position: 'absolute',
      top: isMobile ? 12 : 22,
      left: isMobile ? 16 : 26,
      right: isMobile ? 16 : 26,
      zIndex: 5,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      gap: 8,
    }}>
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
