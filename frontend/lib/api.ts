/**
 * Client HTTP per il backend VPS.
 * Aggiunge automaticamente il JWT access token a ogni richiesta.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

const LS_ACCESS  = 'jwt_access_token'
const LS_REFRESH = 'jwt_refresh_token'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(LS_ACCESS)
}

async function tryRefresh(): Promise<string | null> {
  const refreshToken = localStorage.getItem(LS_REFRESH)
  if (!refreshToken) return null
  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    })
    if (!res.ok) {
      localStorage.removeItem(LS_ACCESS)
      localStorage.removeItem(LS_REFRESH)
      return null
    }
    const data = await res.json()
    localStorage.setItem(LS_ACCESS,  data.access_token)
    localStorage.setItem(LS_REFRESH, data.refresh_token)
    return data.access_token
  } catch {
    return null
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let token = getToken()
  const buildHeaders = (t: string | null): Record<string, string> => ({
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
    ...(t ? { Authorization: `Bearer ${t}` } : {})
  })

  let res = await fetch(`${API_URL}${path}`, { ...options, headers: buildHeaders(token) })

  // Token scaduto: prova il refresh una volta sola
  if (res.status === 401 && token) {
    token = await tryRefresh()
    if (token) {
      res = await fetch(`${API_URL}${path}`, { ...options, headers: buildHeaders(token) })
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).message || `HTTP ${res.status}`)
  }
  return res.json()
}

// ── Assessments ───────────────────────────────────────────────────────────────
export const api = {
  // Profilo utente
  profile: {
    get:    ()          => request<any>('/api/data/profile'),
    update: (body: any) => request<any>('/api/data/profile', { method: 'PUT', body: JSON.stringify(body) })
  },

  // Assessment base
  assessments: {
    list:          ()          => request<any>('/api/data/assessments'),
    create:        ()          => request<any>('/api/data/assessments', { method: 'POST', body: '{}' }),
    get:           (id: string)=> request<any>(`/api/data/assessments/${id}`),
    delete:        (id: string)=> request<any>(`/api/data/assessments/${id}`, { method: 'DELETE' }),
    inProgress:    ()          => request<any>('/api/data/assessments/in-progress'),
    complete:      (id: string, score: number) =>
      request<any>(`/api/data/assessments/${id}/complete`, { method: 'PUT', body: JSON.stringify({ total_score: score }) }),

    responses: {
      list:  (id: string) => request<any>(`/api/data/assessments/${id}/responses`),
      count: (id: string) => request<any>(`/api/data/assessments/${id}/responses/count`),
      upsert: (id: string, body: any) =>
        request<any>(`/api/data/assessments/${id}/responses`, { method: 'POST', body: JSON.stringify(body) })
    },

    results: {
      get:    (id: string) => request<any>(`/api/data/assessments/${id}/results`),
      upsert: (id: string, results: any[]) =>
        request<any>(`/api/data/assessments/${id}/results`, { method: 'POST', body: JSON.stringify({ results }) })
    },

    report: {
      get: (id: string) => request<any>(`/api/data/assessments/${id}/report`)
    }
  },

  // Leadership
  leadership: {
    list:   ()          => request<any>('/api/data/leadership'),
    delete: (id: string)=> request<any>(`/api/data/leadership/${id}`, { method: 'DELETE' }),
    responses: {
      list:  (id: string) => request<any>(`/api/data/leadership/${id}/responses`),
      count: (id: string) => request<any>(`/api/data/leadership/${id}/responses/count`)
    }
  }
}
