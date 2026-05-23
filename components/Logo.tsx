export default function Logo({ size = 22 }: { size?: number }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <svg width={size + 6} height={size + 6} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="13" fill="white" stroke="#15171a" strokeWidth="1.8"/>
        <path d="M 16 3 A 13 13 0 0 1 28.3 19.5 Q 22 16 16 16 Z" fill="#E1252C"/>
        <path d="M 16 3 A 13 13 0 0 0 3.7 19.5 Q 10 16 16 16 Z" fill="#0061B2"/>
        <path d="M 3.7 19.5 A 13 13 0 0 0 28.3 19.5 Q 22 17 16 17 Q 10 17 3.7 19.5 Z" fill="#009A4E"/>
        <circle cx="16" cy="16" r="13" fill="none" stroke="#15171a" strokeWidth="1.8"/>
      </svg>
      <span className="hand" style={{ fontSize: size + 8, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1 }}>
        trionda <span style={{ color: '#E1252C' }}>assist</span>
      </span>
    </div>
  )
}
