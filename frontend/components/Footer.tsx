'use client'

import { useEffect } from 'react'

interface FooterProps {
  variant?: 'full' | 'reduced' | 'minimal'
}

export default function Footer({ variant = 'full' }: FooterProps) {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://cdn.iubenda.com/iubenda.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  if (variant === 'minimal') {
    return (
      <footer className="bg-gray-900 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center gap-6 text-sm">
            <a 
              href="https://www.iubenda.com/privacy-policy/89679336" 
              className="iubenda-white iubenda-noiframe iubenda-embed iubenda-noiframe hover:text-gray-300" 
              title="Privacy Policy"
            >
              Privacy Policy
            </a>
            <a 
              href="https://www.iubenda.com/privacy-policy/89679336/cookie-policy" 
              className="iubenda-white iubenda-noiframe iubenda-embed iubenda-noiframe hover:text-gray-300" 
              title="Cookie Policy"
            >
              Cookie Policy
            </a>
          </div>
        </div>
      </footer>
    )
  }

  if (variant === 'reduced') {
    return (
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <p className="text-sm text-gray-400">© 2025 ValutoLab. Tutti i diritti riservati.</p>
            </div>
            <div className="flex gap-6 text-sm">
              <a 
                href="https://www.iubenda.com/privacy-policy/89679336" 
                className="iubenda-white iubenda-noiframe iubenda-embed iubenda-noiframe hover:text-gray-300" 
                title="Privacy Policy"
              >
                Privacy Policy
              </a>
              <a 
                href="https://www.iubenda.com/privacy-policy/89679336/cookie-policy" 
                className="iubenda-white iubenda-noiframe iubenda-embed iubenda-noiframe hover:text-gray-300" 
                title="Cookie Policy"
              >
                Cookie Policy
              </a>
              <a href="/terms" className="hover:text-gray-300">
                Termini e Condizioni
              </a>
            </div>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">ValutoLab</h3>
            <p className="text-gray-400 mb-4">
              Piattaforma professionale per la valutazione delle soft skills. 
              Scopri i tuoi punti di forza e migliora le tue competenze trasversali.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Prodotto</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/assessment" className="hover:text-white">Assessment</a></li>
              <li><a href="/dashboard" className="hover:text-white">Dashboard</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legale</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a 
                  href="https://www.iubenda.com/privacy-policy/89679336" 
                  className="iubenda-white iubenda-noiframe iubenda-embed iubenda-noiframe hover:text-white" 
                  title="Privacy Policy"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a 
                  href="https://www.iubenda.com/privacy-policy/89679336/cookie-policy" 
                  className="iubenda-white iubenda-noiframe iubenda-embed iubenda-noiframe hover:text-white" 
                  title="Cookie Policy"
                >
                  Cookie Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-white">
                  Termini e Condizioni
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <p className="text-center text-gray-400 text-sm">
            © 2025 ValutoLab. Tutti i diritti riservati.
          </p>
        </div>
      </div>
    </footer>
  )
}