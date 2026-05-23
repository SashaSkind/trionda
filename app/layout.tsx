import type { Metadata } from 'next'
import { Caveat, Kalam, Patrick_Hand, Architects_Daughter } from 'next/font/google'
import './globals.css'
import ChatAgent from '@/components/ChatAgent'

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
  display: 'swap',
})
const kalam = Kalam({
  weight: ['300', '400', '700'],
  subsets: ['latin'],
  variable: '--font-kalam',
  display: 'swap',
})
const patrickHand = Patrick_Hand({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-patrick',
  display: 'swap',
})
const architectsDaughter = Architects_Daughter({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-arch',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Trionda Assist — World Cup 2026 Travel Companion',
  description: '16 stadiums. 3 countries. 1 tournament. Find your perfect World Cup match day.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${caveat.variable} ${kalam.variable} ${patrickHand.variable} ${architectsDaughter.variable}`}>
      <body>
        {children}
        <ChatAgent />
      </body>
    </html>
  )
}
