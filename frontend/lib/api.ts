/**
 * Client HTTP per il backend VPS.
 * Aggiunge automaticamente il JWT access token a ogni richiesta.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('jwt_access_token')
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {})
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
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
