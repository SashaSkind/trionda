import Link from 'next/link'
import Logo from './Logo'

interface TopBarProps {
  title?: string
  right?: React.ReactNode
}

export default function TopBar({ title, right }: TopBarProps) {
  return (
    <div style={{
      position: 'absolute', top: 22, left: 26, right: 26, zIndex: 5,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <Link href="/" style={{ textDecoration: 'none' }}>
        <Logo />
      </Link>
      {title && (
        <div className="hand squiggle" style={{ fontSize: 22 }}>{title}</div>
      )}
      <div style={{ display: 'flex', gap: 12 }}>
        {right ?? (
          <>
            <button className="btn-sketch" style={{ fontSize: 16 }}>🇬🇧 EN</button>
            <button className="btn-sketch solid" style={{ fontSize: 16 }}>Sign in</button>
          </>
        )}
      </div>
    </div>
  )
}
