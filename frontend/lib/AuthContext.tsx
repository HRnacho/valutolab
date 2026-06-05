'use client'

/**
 * AuthContext — Fase 3 migrazione JWT
 *
 * Strategia "JWT first, Supabase fallback":
 * 1. Prova sempre il JWT custom (backend VPS)
 * 2. Se l'utente non è ancora migrato (JWT fallisce), usa Supabase Auth
 * 3. In Fase 4 si rimuove il fallback Supabase
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string
  full_name?: string | null
  role: string
  authType: 'jwt' | 'supabase'
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  /** Restituisce il Bearer token corrente (JWT o Supabase) per le chiamate API */
  getAccessToken: () => Promise<string | null>
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''
const LS_ACCESS  = 'jwt_access_token'
const LS_REFRESH = 'jwt_refresh_token'

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // ── JWT helpers ─────────────────────────────────────────────────────────────

  const refreshJwt = useCallback(async (): Promise<AuthUser | null> => {
    const refreshToken = localStorage.getItem(LS_REFRESH)
    if (!refreshToken) return null

    try {
      const res  = await fetch(`${API_URL}/api/auth/refresh`, {
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
      return { ...data.user, authType: 'jwt' as const }
    } catch {
      return null
    }
  }, [])

  const checkJwt = useCallback(async (): Promise<AuthUser | null> => {
    const token = localStorage.getItem(LS_ACCESS)
    if (!token) return null

    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.status === 401) return refreshJwt()
      if (!res.ok) return null
      const data = await res.json()
      return { ...data.user, authType: 'jwt' as const }
    } catch {
      return null
    }
  }, [refreshJwt])

  // ── checkAuth (mount + visibilitychange) ─────────────────────────────────────

  const checkAuth = useCallback(async () => {
    setLoading(true)
    try {
      // 1. JWT
      const jwtUser = await checkJwt()
      if (jwtUser) { setUser(jwtUser); return }

      // 2. Fallback Supabase (utenti non ancora migrati)
      const { data: { user: supaUser } } = await supabase.auth.getUser()
      if (supaUser) {
        setUser({
          id:        supaUser.id,
          email:     supaUser.email!,
          full_name: supaUser.user_metadata?.full_name ?? null,
          role:      supaUser.user_metadata?.is_admin ? 'admin' : 'user',
          authType:  'supabase'
        })
        return
      }

      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [checkJwt])

  useEffect(() => {
    checkAuth()
    // Ricontrolla quando la tab torna in primo piano
    const onVisible = () => { if (document.visibilityState === 'visible') checkAuth() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [checkAuth])

  // ── login ─────────────────────────────────────────────────────────────────

  const login = useCallback(async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    // 1. Prova JWT
    try {
      const res  = await fetch(`${API_URL}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password })
      })
      const data = await res.json()

      if (res.ok && data.success) {
        localStorage.setItem(LS_ACCESS,  data.access_token)
        localStorage.setItem(LS_REFRESH, data.refresh_token)
        setUser({ ...data.user, authType: 'jwt' })
        return { success: true }
      }

      // 401 = credenziali sbagliate OPPURE utente non ancora su DB locale
      // Prova Supabase solo se JWT risponde 401
      if (res.status === 401) {
        const { data: supaData, error: supaError } =
          await supabase.auth.signInWithPassword({ email, password })

        if (!supaError && supaData.user) {
          setUser({
            id:        supaData.user.id,
            email:     supaData.user.email!,
            full_name: supaData.user.user_metadata?.full_name ?? null,
            role:      supaData.user.user_metadata?.is_admin ? 'admin' : 'user',
            authType:  'supabase'
          })
          return { success: true }
        }
      }

      return { success: false, error: data.message || 'Credenziali non valide' }
    } catch (err: any) {
      return { success: false, error: err.message || 'Errore di rete' }
    }
  }, [])

  // ── logout ────────────────────────────────────────────────────────────────

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
    await supabase.auth.signOut().catch(() => {})
    setUser(null)
  }, [])

  // ── getAccessToken ────────────────────────────────────────────────────────

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (user?.authType === 'jwt') {
      return localStorage.getItem(LS_ACCESS)
    }
    if (user?.authType === 'supabase') {
      const { data } = await supabase.auth.getSession()
      return data.session?.access_token ?? null
    }
    return null
  }, [user])

  // ── render ────────────────────────────────────────────────────────────────

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
