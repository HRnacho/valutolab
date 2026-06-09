'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { Wordmark } from '@/components/ui/Wordmark'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading, login } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'admin') router.replace('/dashboard')
      else setError('Accesso riservato agli amministratori')
    }
  }, [user, loading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Inserisci email e password'); return }
    setSubmitting(true); setError('')
    const result = await login(email.trim(), password)
    if (result.success) {
      // check role after login
      router.push('/dashboard')
    } else {
      setError(result.error || 'Email o password non corretti')
    }
    setSubmitting(false)
  }

  if (loading) return null

  const inputCls = 'w-full px-3 py-2.5 border border-paper-300 rounded-sm bg-paper-100 focus:border-ink-600 focus:outline-none text-[14px] text-ink-900 placeholder-ink-400'

  return (
    <div className="min-h-screen bg-paper-100 font-body text-ink-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <Wordmark size={22} className="justify-center" />
          <p className="mt-3 text-[14px] text-ink-500">Pannello di amministrazione</p>
        </div>

        <div className="bg-paper-50 border border-paper-200 rounded-md shadow-md-ink p-8 space-y-5">

          {error && (
            <div className="px-4 py-3 bg-sienna-50 border border-sienna-300 rounded-sm">
              <p className="text-[13px] text-sienna-700 text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[12px] font-medium text-ink-600 mb-1.5">Email</label>
              <input
                id="email" type="email" required autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                className={inputCls} placeholder="admin@valutolab.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-[12px] font-medium text-ink-600 mb-1.5">Password</label>
              <input
                id="password" type="password" required autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)}
                className={inputCls} placeholder="••••••••"
              />
            </div>
            <Button type="submit" variant="primary" className="w-full justify-center mt-2" disabled={submitting}>
              {submitting ? 'Accesso…' : 'Accedi'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
