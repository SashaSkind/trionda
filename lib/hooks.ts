'use client'

import { useEffect, useState } from 'react'

const MOBILE_QUERY = '(max-width: 640px)'

/** true when viewport is tablet-sized or smaller (≤640px) */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY)
    setIsMobile(media.matches)

    const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])

  return isMobile
}
