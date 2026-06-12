'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import { Wordmark } from '@/components/ui/Wordmark'
import { Button } from '@/components/ui/Button'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim() })
      })
      if (!res.ok) throw new Error('Errore di rete')
      setSent(true)
    } catch {
      setError("Errore durante l'invio. Riprova tra qualche minuto.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper-100 font-body text-ink-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <Wordmark size={22} className="justify-center" />
          <p className="mt-3 text-[11px] font-semibold tracking-widest uppercase text-sienna-600">
            Reimposta Password
          </p>
        </div>

        <div className="bg-paper-50 border border-paper-200 rounded-md shadow-md-ink p-8 space-y-5">

          {sent ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 px-4 py-3 bg-paper-200 border border-paper-300 rounded-sm">
                <CheckCircle className="w-4 h-4 text-ink-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-semibold text-ink-900 mb-0.5">Email inviata</p>
                  <p className="text-[12px] text-ink-500">
                    Se l&apos;email è registrata, riceverai un link per reimpostare la password. Il link è valido per 24 ore. Controlla anche la cartella spam.
                  </p>
                </div>
              </div>
              <Link href="/login" className="flex items-center justify-center gap-1.5 text-[13px] text-ink-500 hover:text-ink-800 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                Torna al login
              </Link>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-[20px] font-semibold text-ink-900 mb-1">Hai dimenticato la password?</h1>
                <p className="text-[13px] text-ink-400">Inserisci la tua email e ti invieremo un link per reimpostarla.</p>
              </div>

              {error && (
                <div className="px-4 py-3 bg-sienna-50 border border-sienna-300 rounded-sm">
                  <p className="text-[13px] text-sienna-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-[12px] font-medium text-ink-600 mb-1.5">Email</label>
                  <input
                    id="email" type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    required placeholder="nome@esempio.com"
                    className="w-full px-4 py-2.5 border border-paper-300 rounded-sm bg-paper-100 focus:border-ink-600 focus:outline-none font-body text-[14px] text-ink-900 placeholder-ink-400"
                    disabled={loading}
                  />
                </div>

                <Button type="submit" variant="primary" disabled={loading} className="w-full justify-center">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-paper-50 border-t-transparent rounded-full animate-spin" />
                      Invio in corso…
                    </span>
                  ) : 'Invia link di reset →'}
                </Button>
              </form>

              <div className="text-center pt-1">
                <Link href="/login" className="flex items-center justify-center gap-1.5 text-[13px] text-ink-400 hover:text-ink-700 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Torna al login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
