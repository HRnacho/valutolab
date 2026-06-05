'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router          = useRouter()
  const { user, loading, login } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState('')

  // Redirect se già autenticato
  useEffect(() => {
    if (!loading && user) router.replace('/')
  }, [user, loading, router])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Inserisci email e password'); return }

    setSubmitting(true)
    setError('')

    const result = await login(email.trim(), password)
    if (result.success) {
      router.push('/')
      router.refresh()
    } else {
      if (result.error?.toLowerCase().includes('invalid login') ||
          result.error?.toLowerCase().includes('credenziali')) {
        setError('Email o password non corretti')
      } else if (result.error?.toLowerCase().includes('email not confirmed')) {
        setError('Devi confermare la tua email prima di accedere')
      } else {
        setError(result.error || 'Errore durante il login')
      }
    }
    setSubmitting(false)
  }

  // Google OAuth rimane su Supabase fino alla Fase 4
  const handleGoogleLogin = async () => {
    setSubmitting(true)
    setError('')
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` }
      })
      if (oauthError) throw oauthError
    } catch {
      setError('Errore durante il login con Google')
      setSubmitting(false)
    }
  }

  if (loading) return null // evita flash

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">ValutoLab</h1>
          <p className="text-gray-600">Accedi al tuo account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                id="email" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="il-tuo-email@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={submitting} required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                id="password" type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={submitting} required
              />
            </div>

            <button
              type="submit" disabled={submitting}
              className="w-full py-3 px-4 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Accesso in corso...
                </span>
              ) : 'Accedi'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"/></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">oppure</span></div>
          </div>

          <button
            type="button" onClick={handleGoogleLogin} disabled={submitting}
            className="w-full py-3 px-4 border border-gray-300 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-gray-700 font-medium">Accedi con Google</span>
          </button>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600">
              Non hai un account?{' '}
              <a href="/register" className="text-purple-600 font-medium hover:text-purple-700">Registrati</a>
            </p>
            <a href="/forgot-password" className="text-sm text-gray-500 hover:text-gray-700 block">
              Password dimenticata?
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
