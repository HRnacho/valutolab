import './globals.css'
import type { Metadata } from 'next'
import Script from 'next/script'
import { Space_Grotesk, IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google'
import { AuthProvider } from '@/lib/AuthContext'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ValutoLab — Assessment delle competenze trasversali ESCO',
  description: 'Dodici competenze trasversali mappate sullo standard europeo ESCO v1.2. Assessment professionale, report vettoriale, badge verificabile.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="it"
      className={`${spaceGrotesk.variable} ${ibmPlexSans.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Script
          src="https://embeds.iubenda.com/widgets/4675d4fe-7785-4585-b3e6-3b3c700d9431.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  )
}
