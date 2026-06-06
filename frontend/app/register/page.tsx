'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Wordmark } from '@/components/ui/Wordmark'
import { Button } from '@/components/ui/Button'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const res  = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ email: email.trim(), password, full_name: fullName.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Errore durante la registrazione')
      localStorage.setItem('jwt_access_token',  data.access_token)
      localStorage.setItem('jwt_refresh_token', data.refresh_token)
      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (err: any) {
      setError(err.message || 'Errore durante la registrazione')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = () => {
    window.location.href = `${API_URL}/api/auth/google`
  }

  return (
    <div className="min-h-screen bg-paper-100 font-body text-ink-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <Wordmark size={22} className="justify-center" />
          <p className="mt-3 text-[14px] text-ink-500">Crea il tuo account</p>
        </div>

        {/* Card */}
        <div className="bg-paper-50 border border-paper-200 rounded-md shadow-md-ink p-8 space-y-5">

          {success ? (
            <div className="px-4 py-4 bg-green-50 border border-green-200 rounded-sm text-center">
              <p className="text-[14px] font-semibold text-level-avanzato mb-1">Registrazione completata!</p>
              <p className="text-[12px] text-ink-500">Reindirizzamento in corso…</p>
            </div>
          ) : (
            <>
              {/* Google */}
              <button
                onClick={handleGoogleSignUp} disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-paper-300 rounded-sm bg-paper-50 hover:bg-paper-100 transition-colors disabled:opacity-50 text-[14px] font-medium text-ink-700"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? 'Registrazione…' : 'Registrati con Google'}
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-paper-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-paper-50 text-[11px] text-ink-400">oppure registrati con email</span>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="px-4 py-3 bg-sienna-50 border border-sienna-300 rounded-sm">
                  <p className="text-[13px] text-sienna-700">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-[12px] font-medium text-ink-600 mb-1.5">Nome Completo</label>
                  <input
                    id="fullName" type="text" value={fullName}
                    onChange={e => setFullName(e.target.value)} required
                    placeholder="Mario Rossi"
                    className="w-full px-4 py-2.5 border border-paper-300 rounded-sm bg-paper-100 focus:border-ink-600 focus:outline-none font-body text-[14px] text-ink-900 placeholder-ink-400"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-[12px] font-medium text-ink-600 mb-1.5">Email</label>
                  <input
                    id="email" type="email" value={email}
                    onChange={e => setEmail(e.target.value)} required
                    placeholder="tua@email.com"
                    className="w-full px-4 py-2.5 border border-paper-300 rounded-sm bg-paper-100 focus:border-ink-600 focus:outline-none font-body text-[14px] text-ink-900 placeholder-ink-400"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-[12px] font-medium text-ink-600 mb-1.5">Password</label>
                  <input
                    id="password" type="password" value={password}
                    onChange={e => setPassword(e.target.value)}
                    required minLength={8}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 border border-paper-300 rounded-sm bg-paper-100 focus:border-ink-600 focus:outline-none font-body text-[14px] text-ink-900"
                  />
                  <p className="text-[11px] text-ink-400 mt-1">Minimo 8 caratteri</p>
                </div>

                <Button type="submit" variant="primary" disabled={loading} className="w-full justify-center">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-paper-50 border-t-transparent rounded-full animate-spin" />
                      Registrazione in corso…
                    </span>
                  ) : 'Crea account'}
                </Button>
              </form>
            </>
          )}

          {/* Link login */}
          <div className="text-center pt-1">
            <p className="text-[13px] text-ink-500">
              Hai già un account?{' '}
              <Link href="/login" className="text-ink-900 font-semibold hover:text-sienna-600 transition-colors">Accedi</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
