'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Wordmark } from '@/components/ui/Wordmark'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

function ResetPasswordForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const jwtToken     = searchParams.get('token')

  const [password, setPassword]               = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword]       = useState(false)
  const [loading, setLoading]                 = useState(false)
  const [checking, setChecking]               = useState(true)
  const [message, setMessage]                 = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [mode, setMode]                       = useState<'jwt' | 'supabase' | 'invalid'>('invalid')

  useEffect(() => {
    const detectMode = async () => {
      if (jwtToken) {
        setMode('jwt')
      } else {
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
        const res  = await fetch(`${API_URL}/api/auth/reset-password`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ token: jwtToken, password })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Errore durante il reset')
        setMessage({ type: 'success', text: 'Password aggiornata con successo!' })
      } else {
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
    <div className="flex items-center justify-center py-8">
      <span className="w-6 h-6 border-2 border-ink-300 border-t-ink-700 rounded-full animate-spin" />
    </div>
  )

  if (mode === 'invalid') return (
    <div className="space-y-4 text-center">
      <div className="flex justify-center">
        <AlertCircle className="w-10 h-10 text-sienna-600" />
      </div>
      <div>
        <h2 className="text-[18px] font-semibold text-ink-900 mb-1">Link non valido</h2>
        <p className="text-[13px] text-ink-400 mb-5">Il link per il reset della password è scaduto o non è valido.</p>
        <Link
          href="/forgot-password"
          className="inline-block px-6 py-2.5 bg-ink-900 text-paper-50 text-[13px] font-medium rounded-sm hover:bg-ink-700 transition-colors"
        >
          Richiedi nuovo link
        </Link>
      </div>
    </div>
  )

  if (message?.type === 'success') return (
    <div className="flex items-start gap-3 px-4 py-3 bg-paper-200 border border-paper-300 rounded-sm">
      <CheckCircle className="w-4 h-4 text-ink-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-[13px] font-semibold text-ink-900 mb-0.5">Password aggiornata</p>
        <p className="text-[12px] text-ink-500">Verrai reindirizzato al login…</p>
      </div>
    </div>
  )

  return (
    <>
      <div className="mb-5">
        <h1 className="text-[20px] font-semibold text-ink-900 mb-1">Imposta la tua password</h1>
        <p className="text-[13px] text-ink-400">Scegli una password sicura di almeno 8 caratteri.</p>
      </div>

      {message?.type === 'error' && (
        <div className="px-4 py-3 bg-sienna-50 border border-sienna-300 rounded-sm mb-4">
          <p className="text-[13px] text-sienna-700">{message.text}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-[12px] font-medium text-ink-600 mb-1.5">Nuova password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required minLength={8} placeholder="Almeno 8 caratteri"
              className="w-full px-4 py-2.5 pr-10 border border-paper-300 rounded-sm bg-paper-100 focus:border-ink-600 focus:outline-none font-body text-[14px] text-ink-900 placeholder-ink-400"
              disabled={loading}
            />
            <button
              type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-[12px] font-medium text-ink-600 mb-1.5">Conferma password</label>
          <input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required minLength={8} placeholder="Ripeti la password"
            className="w-full px-4 py-2.5 border border-paper-300 rounded-sm bg-paper-100 focus:border-ink-600 focus:outline-none font-body text-[14px] text-ink-900 placeholder-ink-400"
            disabled={loading}
          />
        </div>

        <Button type="submit" variant="primary" disabled={loading} className="w-full justify-center">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-paper-50 border-t-transparent rounded-full animate-spin" />
              Aggiornamento…
            </span>
          ) : 'Imposta password →'}
        </Button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-paper-100 font-body text-ink-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <Wordmark size={22} className="justify-center" />
          <p className="mt-3 text-[11px] font-semibold tracking-widest uppercase text-sienna-600">
            Nuova Password
          </p>
        </div>

        <div className="bg-paper-50 border border-paper-200 rounded-md shadow-md-ink p-8">
          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <span className="w-6 h-6 border-2 border-ink-300 border-t-ink-700 rounded-full animate-spin" />
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </div>

      </div>
    </div>
  )
}
