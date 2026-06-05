'use client'

/**
 * AuthContext — Fase 4: JWT puro, nessun fallback Supabase.
 *
 * user.id  = supabase_id per gli utenti migrati (UUID già usato in tutti i
 *            dati Supabase), oppure l'UUID locale per gli utenti nuovi.
 * user.localId = UUID locale nel DB del VPS (sempre disponibile).
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  /** UUID usato per le query Supabase (supabase_id per utenti migrati, id locale per nuovi) */
  id: string
  /** UUID nel DB locale del VPS */
  localId: string
  email: string
  full_name?: string | null
  role: string
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  /** Restituisce il JWT access token corrente (sincrono, da localStorage) */
  getAccessToken: () => string | null
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

const API_URL    = process.env.NEXT_PUBLIC_API_URL || ''
const LS_ACCESS  = 'jwt_access_token'
const LS_REFRESH = 'jwt_refresh_token'

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapUser(u: any): AuthUser {
  return {
    id:        u.supabase_id ?? u.id,   // backward compat con dati Supabase esistenti
    localId:   u.id,
    email:     u.email,
    full_name: u.full_name ?? null,
    role:      u.role
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Chiama /api/auth/me con il token fornito
  const fetchMe = useCallback(async (token: string): Promise<AuthUser | null> => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) return null
      const data = await res.json()
      return mapUser(data.user)
    } catch {
      return null
    }
  }, [])

  // Tenta il refresh del token
  const refreshJwt = useCallback(async (): Promise<AuthUser | null> => {
    const refreshToken = localStorage.getItem(LS_REFRESH)
    if (!refreshToken) return null
    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ refresh_token: refreshToken })
      })
      if (!res.ok) {
        localStorage.removeItem(LS_ACCESS)
        localStorage.removeItem(LS_REFRESH)
        return null
      }
      const data = await res.json()
      localStorage.setItem(LS_ACCESS,  data.access_token)
      localStorage.setItem(LS_REFRESH, data.refresh_token)
      return await fetchMe(data.access_token)
    } catch {
      return null
    }
  }, [fetchMe])

  // Controlla lo stato auth all'avvio e al ritorno in foreground
  const checkAuth = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem(LS_ACCESS)
      if (!token) { setUser(null); return }

      const jwtUser = await fetchMe(token)
      if (jwtUser) { setUser(jwtUser); return }

      // Token scaduto → prova refresh
      const refreshed = await refreshJwt()
      setUser(refreshed)
    } finally {
      setLoading(false)
    }
  }, [fetchMe, refreshJwt])

  useEffect(() => {
    checkAuth()
    const onVisible = () => { if (document.visibilityState === 'visible') checkAuth() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [checkAuth])

  // ── login ──────────────────────────────────────────────────────────────────

  const login = useCallback(async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res  = await fetch(`${API_URL}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.message || 'Credenziali non valide' }

      localStorage.setItem(LS_ACCESS,  data.access_token)
      localStorage.setItem(LS_REFRESH, data.refresh_token)
      setUser(mapUser(data.user))
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || 'Errore di rete' }
    }
  }, [])

  // ── logout ─────────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem(LS_REFRESH)
    if (refreshToken) {
      await fetch(`${API_URL}/api/auth/logout`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ refresh_token: refreshToken })
      }).catch(() => {})
    }
    localStorage.removeItem(LS_ACCESS)
    localStorage.removeItem(LS_REFRESH)
    setUser(null)
  }, [])

  // ── getAccessToken (sincrono) ──────────────────────────────────────────────

  const getAccessToken = useCallback((): string | null => {
    return localStorage.getItem(LS_ACCESS)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, getAccessToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve essere usato dentro <AuthProvider>')
  return ctx
}
