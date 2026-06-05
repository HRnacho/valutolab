'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

// ── Inner component (needs useSearchParams inside Suspense) ──────────────────

function ResetPasswordForm() {
  const router        = useRouter()
  const searchParams  = useSearchParams()
  const jwtToken      = searchParams.get('token')   // presente nelle email di migrazione

  const [password, setPassword]           = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword]   = useState(false)
  const [loading, setLoading]             = useState(false)
  const [checking, setChecking]           = useState(true)
  const [message, setMessage]             = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [mode, setMode]                   = useState<'jwt' | 'supabase' | 'invalid'>('invalid')

  useEffect(() => {
    const detectMode = async () => {
      if (jwtToken) {
        // Token dall'email di migrazione → usa JWT API
        setMode('jwt')
      } else {
        // Nessun token nell'URL → controlla sessione Supabase (vecchio flow)
        const { data: { session } } = await supabase.auth.getSession()
        setMode(session ? 'supabase' : 'invalid')
      }
      setChecking(false)
    }
    detectMode()
  }, [jwtToken])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (password.length < 8) {
      setMessage({ type: 'error', text: 'La password deve essere di almeno 8 caratteri' })
      return
    }
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Le password non coincidono' })
      return
    }

    setLoading(true)
    try {
      if (mode === 'jwt') {
        // Nuovo sistema JWT
        const res  = await fetch(`${API_URL}/api/auth/reset-password`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ token: jwtToken, password })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Errore durante il reset')
        setMessage({ type: 'success', text: 'Password aggiornata con successo!' })
      } else {
        // Vecchio sistema Supabase
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
        setMessage({ type: 'success', text: 'Password aggiornata con successo!' })
      }
      setTimeout(() => router.push('/login'), 2000)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Errore durante il reset della password' })
    } finally {
      setLoading(false)
    }
  }

  if (checking) return (
    <div className="flex items-center justify-center py-12">
      <svg className="animate-spin h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
      </svg>
    </div>
  )

  if (mode === 'invalid') return (
    <div className="text-center">
      <div className="inline-block p-3 bg-red-100 rounded-full mb-4">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Non Valido</h2>
      <p className="text-gray-600 mb-6">Il link per il reset della password è scaduto o non è valido.</p>
      <Link href="/forgot-password" className="inline-block bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-purple-700 transition">
        Richiedi Nuovo Link
      </Link>
    </div>
  )

  return (
    <>
      <div className="text-center mb-8">
        <div className="inline-block p-3 bg-purple-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reimposta Password</h1>
        <p className="text-gray-600 text-sm">Scegli una nuova password sicura per il tuo account</p>
      </div>

      {message?.type === 'success' ? (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div>
              <h3 className="font-semibold text-green-900 mb-1">Password Aggiornata!</h3>
              <p className="text-sm text-green-700">Verrai reindirizzato al login...</p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Nuova Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required minLength={8} placeholder="Almeno 8 caratteri"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                {showPassword
                  ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                  : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                }
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Conferma Password</label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required minLength={8} placeholder="Ripeti la password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {message?.type === 'error' && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{message.text}</p>
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Aggiornamento...
              </span>
            ) : 'Reimposta Password'}
          </button>
        </form>
      )}
    </>
  )
}

// ── Page wrapper con Suspense (richiesto da useSearchParams in Next.js 14) ────

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            <ul className="text-xs text-blue-800 space-y-0.5">
              <li>Usa almeno 8 caratteri</li>
              <li>Combina maiuscole, minuscole, numeri e simboli</li>
              <li>Non riutilizzare password di altri siti</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
