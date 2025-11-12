import './globals.css'
import type { Metadata } from 'next'
import Script from 'next/script'

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
      <body>{children}
          <Script 
      src="https://embeds.iubenda.com/widgets/4675d4fe-7785-4585-b3e6-3b3c700d9431.js"
      strategy="lazyOnload"
    />
      </body>
    </html>
  )
}
