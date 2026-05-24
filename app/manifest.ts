import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'trionda assist',
    short_name: 'trionda assist',
    description: 'World Cup 2026 travel companion — explore host stadiums across North America.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fbf7ee',
    theme_color: '#15171a',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
