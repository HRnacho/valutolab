'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Wordmark } from '@/components/ui/Wordmark'
import { Button } from '@/components/ui/Button'

export default function TrialPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (formData.password !== formData.confirmPassword) { setError('Le password non coincidono.'); return }
    if (formData.password.length < 8) { setError('La password deve essere di almeno 8 caratteri.'); return }
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trial-b2c/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: formData.full_name, email: formData.email, password: formData.password })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Errore durante la registrazione.'); return }
      // Auto-login: salva i token e vai alla dashboard
      localStorage.setItem('jwt_access_token',  data.access_token)
      localStorage.setItem('jwt_refresh_token', data.refresh_token)
      router.push('/dashboard')
    } catch { setError('Errore di connessione. Riprova tra qualche minuto.') }
    finally { setLoading(false) }
  }

  const inputCls = 'w-full px-4 py-2.5 border border-paper-300 rounded-sm bg-paper-100 focus:border-ink-600 focus:outline-none font-body text-[14px] text-ink-900 placeholder-ink-400'
  const labelCls = 'block text-[12px] font-medium text-ink-600 mb-1.5'

  return (
    <div className="min-h-screen bg-paper-100 font-body text-ink-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Wordmark size={22} className="justify-center" />
        </div>

        {/* Card */}
        <div className="bg-paper-50 border border-paper-200 rounded-md shadow-md-ink p-8 space-y-5">
          {/* mini-mappa: 3 di 12 — comunica subito che il trial è un sottoinsieme */}
          <div aria-hidden="true" className="w-full">
            <img src="/graphics/mini-mappa-trial.svg" alt="" className="w-full" />
          </div>

          {/* Trial badge */}
          <div className="bg-ink-900 rounded-md p-4 text-center">
            <p className="text-[11px] font-bold uppercase tracking-eyebrow text-paper-300 mb-1">Trial Gratuito</p>
            <p className="text-[13px] text-paper-100">1 assessment completo · Valido 30 giorni · Nessuna carta di credito</p>
          </div>

          {error && (
            <div className="px-4 py-3 bg-sienna-50 border border-sienna-300 rounded-sm">
              <p className="text-[13px] text-sienna-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelCls}>Nome e Cognome *</label>
              <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required
                placeholder="Mario Rossi" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required
                placeholder="mario.rossi@email.com" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Password *</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required
                placeholder="Minimo 8 caratteri" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Conferma Password *</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required
                placeholder="Ripeti la password" className={inputCls} />
            </div>

            <Button type="submit" variant="primary" disabled={loading} className="w-full justify-center">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-paper-50 border-t-transparent rounded-full animate-spin" />
                  Creazione account…
                </span>
              ) : 'Inizia il Trial Gratuito →'}
            </Button>
          </form>

          <div className="border-t border-paper-200 pt-4 text-center space-y-2">
            <p className="text-[13px] text-ink-500">
              Hai già un account?{' '}
              <Link href="/login" className="text-ink-900 font-semibold hover:text-sienna-600 transition-colors">Accedi</Link>
            </p>
            <p className="text-[10px] text-ink-400">
              Registrandoti accetti i nostri{' '}
              <Link href="/termini" className="underline">Termini di Servizio</Link>{' '}e la{' '}
              <Link href="/privacy" className="underline">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
