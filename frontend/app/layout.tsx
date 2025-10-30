import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ValutoLab - Piattaforma Valutazione Soft Skills',
  description: 'Valuta e sviluppa le competenze trasversali del tuo team',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  )
}
