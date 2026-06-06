'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { api } from '@/lib/api'
import { Wordmark } from '@/components/ui/Wordmark'
import { Button } from '@/components/ui/Button'
import { ScoreRing } from '@/components/ui/ScoreRing'
import BadgeGenerator from '@/components/BadgeGenerator'
import QRCodeGenerator from '@/components/QRCodeGenerator'
import { FileText, Share2, Mail, Trash2, Play, ChevronRight, BarChart3 } from 'lucide-react'

interface Assessment {
  id: string
  status: string
  total_score: number | null
  created_at: string
  completed_at: string | null
}

interface LeadershipAssessment {
  id: string
  status: string
  total_score: number | null
  created_at: string
  completed_at: string | null
}

interface ShareData {
  assessment_id: string
  share_token: string
  is_active: boolean
  view_count: number
}

export default function DashboardPage() {
  const router = useRouter()
  const { user: authUser, logout, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [leadershipAssessments, setLeadershipAssessments] = useState<LeadershipAssessment[]>([])
  const [responsesCount, setResponsesCount] = useState<Record<string, number>>({})
  const [leadershipResponsesCount, setLeadershipResponsesCount] = useState<Record<string, number>>({})
  const [deleting, setDeleting] = useState<string | null>(null)
  const [shareData, setShareData] = useState<Record<string, ShareData>>({})
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [badgeModal, setBadgeModal] = useState<{
    open: boolean; assessmentId: string | null; userName: string
    score: number; topSkills: Array<{ name: string; score: number }>; shareToken: string
  } | null>(null)
  const [qrModal, setQrModal] = useState<{ open: boolean; profileUrl: string; userName: string } | null>(null)

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(t)
    }
  }, [message])

  const showMessage = (type: 'success' | 'error', text: string) => setMessage({ type, text })

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return
      if (!authUser) { router.push('/login'); return }

      setUser(authUser)

      const [assessmentsRes, leadershipRes] = await Promise.all([
        api.assessments.list(),
        api.leadership.list()
      ])
      const assessmentsData = assessmentsRes.assessments || []
      const leadershipData  = leadershipRes.assessments  || []
      setAssessments(assessmentsData)
      setLeadershipAssessments(leadershipData)

      const counts: Record<string, number> = {}
      for (const a of assessmentsData) {
        if (a.status === 'in_progress') {
          const r = await api.assessments.responses.count(a.id)
          counts[a.id] = r.count || 0
        }
      }
      setResponsesCount(counts)

      const lCounts: Record<string, number> = {}
      for (const a of leadershipData) {
        if (a.status === 'in_progress') {
          const r = await api.leadership.responses.count(a.id)
          lCounts[a.id] = r.count || 0
        }
      }
      setLeadershipResponsesCount(lCounts)

      const completedIds = (assessmentsData as Assessment[])
        .filter(a => a.status === 'completed').map(a => a.id)

      if (completedIds.length > 0) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.valutolab.com'
        const shareResults = await Promise.all(
          completedIds.map(async (id) => {
            try {
              const res = await fetch(`${apiUrl}/api/share/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: authUser.id, assessmentId: id })
              })
              const data = await res.json()
              return data.success ? { [id]: data.share } : null
            } catch { return null }
          })
        )
        const shares = shareResults
          .filter((r): r is Record<string, ShareData> => r !== null)
          .reduce((acc, r) => ({ ...acc, ...r }), {} as Record<string, ShareData>)
        setShareData(shares)
      }

      setLoading(false)
    }
    fetchData()
  }, [router, authUser, authLoading])

  const handleGeneratePDF = async (assessmentId: string) => {
    setGeneratingPDF(assessmentId)
    try {
      const token = localStorage.getItem('jwt_access_token')
      const apiBase = process.env.NEXT_PUBLIC_API_URL || ''
      const response = await fetch(`${apiBase}/api/reports/${assessmentId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error((err as any).message || `Errore ${response.status}`)
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `valutolab-report-${assessmentId.substring(0, 8)}.pdf`
      document.body.appendChild(a); a.click()
      document.body.removeChild(a); URL.revokeObjectURL(url)
      showMessage('success', 'PDF scaricato con successo!')
    } catch (error: any) {
      showMessage('error', error.message || 'Errore nella generazione del PDF')
    } finally {
      setGeneratingPDF(null)
    }
  }

  const handleToggleShare = async (assessmentId: string) => {
    if (!user || !shareData[assessmentId]) return
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.valutolab.com'
      const res = await fetch(
        `${apiUrl}/api/share/${shareData[assessmentId].share_token}/toggle`,
        { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id }) }
      )
      const data = await res.json()
      if (data.success) { setShareData({ ...shareData, [assessmentId]: data.share }); showMessage('success', data.message) }
    } catch { showMessage('error', "Errore durante l'aggiornamento") }
  }

  const handleCopyLink = (assessmentId: string) => {
    if (!shareData[assessmentId]) return
    navigator.clipboard.writeText(`https://valutolab.com/profile/${shareData[assessmentId].share_token}`)
    showMessage('success', 'Link copiato!')
  }

  const handleOpenBadge = async (assessmentId: string) => {
    try {
      const [aRes, pRes, rRes] = await Promise.all([
        api.assessments.get(assessmentId), api.profile.get(), api.assessments.results.get(assessmentId)
      ])
      const categoryLabels: Record<string, string> = {
        communication: 'Comunicazione', leadership: 'Leadership', problem_solving: 'Problem Solving',
        teamwork: 'Lavoro di Squadra', time_management: 'Gestione del Tempo', adaptability: 'Adattabilità',
        creativity: 'Creatività', critical_thinking: 'Pensiero Critico', empathy: 'Empatia',
        resilience: 'Resilienza', negotiation: 'Negoziazione', decision_making: 'Decision Making'
      }
      const topSkills = (rRes.results?.slice(0, 3) || []).map((r: any) => ({
        name: categoryLabels[r.skill_category] || r.skill_category,
        score: Math.round(parseFloat(r.final_score) * 20)
      }))
      setBadgeModal({ open: true, assessmentId, userName: pRes.profile?.full_name || 'Utente ValutoLab', score: aRes.assessment?.total_score || 0, topSkills, shareToken: shareData[assessmentId]?.share_token || '' })
    } catch { showMessage('error', 'Errore nel caricamento dei dati') }
  }

  const handleOpenQR = async (assessmentId: string) => {
    try {
      const pRes = await api.profile.get()
      const shareToken = shareData[assessmentId]?.share_token
      if (!shareToken) { showMessage('error', 'Token di condivisione non trovato'); return }
      setQrModal({ open: true, profileUrl: `https://valutolab.com/profile/${shareToken}`, userName: pRes.profile?.full_name || 'Utente ValutoLab' })
    } catch { showMessage('error', 'Errore nel caricamento del QR code') }
  }

  const handleStartNewAssessment = async () => {
    const isTrial = user?.role === 'trial_user'
    if (isTrial) {
      try {
        const res = await api.assessments.create()
        router.push(`/assessment/${res.assessment.id}`)
      } catch { alert("Errore nell'avvio dell'assessment. Riprova.") }
    } else {
      router.push('/servizi')
    }
  }

  const handleDeleteAssessment = async (id: string) => {
    setDeleting(id)
    try {
      await api.assessments.delete(id)
      setAssessments(assessments.filter(a => a.id !== id))
      showMessage('success', 'Assessment eliminato')
    } catch { showMessage('error', "Errore nell'eliminazione") }
    finally { setDeleting(null) }
  }

  const handleDeleteLeadership = async (id: string) => {
    setDeleting(id)
    try {
      await api.leadership.delete(id)
      setLeadershipAssessments(leadershipAssessments.filter(a => a.id !== id))
      showMessage('success', 'Leadership assessment eliminato')
    } catch { showMessage('error', "Errore nell'eliminazione") }
    finally { setDeleting(null) }
  }

  const handleShareEmail = (assessmentId: string) => {
    const subject = encodeURIComponent('I miei risultati ValutoLab')
    const body = encodeURIComponent(`Ecco i risultati del mio assessment delle soft skills:\n\n${window.location.origin}/dashboard/results/${assessmentId}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper-100">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-ink-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 font-body text-ink-500 text-[14px]">Caricamento...</p>
        </div>
      </div>
    )
  }

  const inProgressAssessments  = assessments.filter(a => a.status === 'in_progress')
  const completedAssessments   = assessments.filter(a => a.status === 'completed')
  const inProgressLeadership   = leadershipAssessments.filter(a => a.status === 'in_progress')
  const completedLeadership    = leadershipAssessments.filter(a => a.status === 'completed')
  const isTrial = user?.user_metadata?.role === 'trial_user'
  const isEmpty = assessments.length === 0 && leadershipAssessments.length === 0

  return (
    <div className="min-h-screen bg-paper-100 font-body text-ink-900">

      {/* Toast */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-sm shadow-lg-ink text-[14px] font-medium text-paper-50 transition-all ${message.type === 'success' ? 'bg-ink-900' : 'bg-sienna-600'}`}>
          {message.text}
        </div>
      )}

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className="bg-paper-50 border-b border-paper-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Wordmark size={20} />
            <div className="flex items-center gap-6">
              <span className="text-[13px] text-ink-500">{user?.email}</span>
              <button
                onClick={async () => { await logout(); router.push('/login') }}
                className="text-[13px] text-ink-600 hover:text-sienna-600 transition-colors"
              >
                Esci
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10 space-y-10">

        {/* ── PAGE TITLE ─────────────────────────────────────────────── */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-1">Area personale</p>
            <h1 className="font-display text-display-3 text-ink-900">Dashboard</h1>
          </div>
          <Button variant="primary" onClick={handleStartNewAssessment}>
            {isTrial ? 'Inizia assessment' : '+ Vai ai servizi'}
          </Button>
        </div>

        {/* ── EMPTY STATE ────────────────────────────────────────────── */}
        {isEmpty && (
          <div className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink p-16 text-center">
            <BarChart3 className="w-10 h-10 text-ink-300 mx-auto mb-4" />
            <h2 className="font-display text-display-3 text-ink-800 mb-2">Nessun assessment ancora</h2>
            <p className="text-ink-500 text-[15px] mb-6">Inizia il tuo primo assessment per scoprire le tue competenze</p>
            <Button variant="primary" onClick={handleStartNewAssessment}>
              {isTrial ? 'Inizia assessment gratuito' : 'Vai ai servizi'}
            </Button>
          </div>
        )}

        {/* ── IN PROGRESS — SOFT SKILLS ──────────────────────────────── */}
        {inProgressAssessments.length > 0 && (
          <section>
            <h2 className="font-display text-[18px] font-medium text-ink-700 mb-4">In corso — Soft Skills</h2>
            <div className="space-y-3">
              {inProgressAssessments.map((a) => {
                const answered = responsesCount[a.id] || 0
                const pct = Math.round((answered / 48) * 100)
                return (
                  <div key={a.id} className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink p-6 flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400">Assessment Soft Skills</span>
                        <p className="text-[13px] text-ink-500 mt-0.5">Iniziato il {new Date(a.created_at).toLocaleDateString('it-IT')}</p>
                      </div>
                      <span className="text-[11px] font-medium uppercase tracking-eyebrow text-sienna-600 bg-sienna-50 border border-sienna-300 px-3 py-1 rounded-sm">
                        In corso
                      </span>
                    </div>
                    <div>
                      <div className="flex justify-between text-[12px] text-ink-500 mb-1.5">
                        <span>{answered}/48 domande</span><span>{pct}%</span>
                      </div>
                      <div className="w-full bg-paper-200 rounded-sm h-1.5">
                        <div className="bg-ink-900 h-1.5 rounded-sm transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="primary" className="flex-1 flex items-center justify-center gap-2" onClick={() => router.push(`/assessment/${a.id}`)}>
                        <Play className="w-4 h-4" /> Riprendi
                      </Button>
                      <Button variant="ghost" className="text-sienna-600 hover:text-sienna-700 text-[13px]"
                        onClick={() => { if (window.confirm('Eliminare questo assessment?')) handleDeleteAssessment(a.id) }}
                        disabled={deleting === a.id}>
                        {deleting === a.id ? '...' : 'Elimina'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── IN PROGRESS — LEADERSHIP ───────────────────────────────── */}
        {inProgressLeadership.length > 0 && (
          <section>
            <h2 className="font-display text-[18px] font-medium text-ink-700 mb-4">In corso — Leadership Deep Dive</h2>
            <div className="space-y-3">
              {inProgressLeadership.map((a) => {
                const answered = leadershipResponsesCount[a.id] || 0
                const pct = Math.round((answered / 30) * 100)
                return (
                  <div key={a.id} className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink p-6 flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400">Leadership Deep Dive</span>
                        <p className="text-[13px] text-ink-500 mt-0.5">Iniziato il {new Date(a.created_at).toLocaleDateString('it-IT')}</p>
                      </div>
                      <span className="text-[11px] font-medium uppercase tracking-eyebrow text-sienna-600 bg-sienna-50 border border-sienna-300 px-3 py-1 rounded-sm">
                        In corso
                      </span>
                    </div>
                    <div>
                      <div className="flex justify-between text-[12px] text-ink-500 mb-1.5">
                        <span>{answered}/30 domande</span><span>{pct}%</span>
                      </div>
                      <div className="w-full bg-paper-200 rounded-sm h-1.5">
                        <div className="bg-ink-900 h-1.5 rounded-sm transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="primary" className="flex-1 flex items-center justify-center gap-2" onClick={() => router.push(`/leadership/${a.id}`)}>
                        <Play className="w-4 h-4" /> Riprendi
                      </Button>
                      <Button variant="ghost" className="text-sienna-600 hover:text-sienna-700 text-[13px]"
                        onClick={() => { if (window.confirm('Eliminare questo assessment?')) handleDeleteLeadership(a.id) }}
                        disabled={deleting === a.id}>
                        {deleting === a.id ? '...' : 'Elimina'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── COMPLETED ──────────────────────────────────────────────── */}
        {(completedAssessments.length > 0 || completedLeadership.length > 0) && (
          <section>
            <h2 className="font-display text-[18px] font-medium text-ink-700 mb-4">Completati</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Soft Skills completati */}
              {completedAssessments.map((a) => {
                const share = shareData[a.id]
                return (
                  <div key={a.id} className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink p-6 flex flex-col gap-5">

                    {/* Header card */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400">Assessment Soft Skills</span>
                        <p className="text-[13px] text-ink-500 mt-0.5">
                          Completato il {new Date(a.completed_at || '').toLocaleDateString('it-IT')}
                        </p>
                      </div>
                      <span className="text-[11px] font-medium uppercase tracking-eyebrow text-level-avanzato bg-green-50 border border-green-200 px-3 py-1 rounded-sm">
                        Completato
                      </span>
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-5 bg-paper-100 rounded-md p-4 border border-paper-200">
                      <ScoreRing value={a.total_score ?? 0} size={72} />
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-0.5">Punteggio generale</p>
                        <p className="font-display text-display-3 text-ink-900">{Number(a.total_score).toFixed(1)}<span className="text-[16px] text-ink-400 font-normal">/5,0</span></p>
                      </div>
                    </div>

                    {/* CTA principale */}
                    <Button variant="primary" className="w-full flex items-center justify-center gap-2"
                      onClick={() => router.push(`/dashboard/results/${a.id}`)}>
                      Visualizza risultati <ChevronRight className="w-4 h-4" />
                    </Button>

                    {/* Share / azioni */}
                    {share && (
                      <div className="border border-paper-200 rounded-md p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Share2 className="w-4 h-4 text-ink-500" />
                            <span className="text-[13px] font-medium text-ink-700">Condivisione</span>
                            {share.is_active && <span className="text-[11px] text-ink-400">{share.view_count} views</span>}
                          </div>
                          {/* Toggle */}
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={share.is_active} onChange={() => handleToggleShare(a.id)} className="sr-only peer" />
                            <div className="w-9 h-5 bg-paper-300 rounded-full peer peer-checked:bg-ink-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                          </label>
                        </div>

                        {share.is_active && (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <input
                                readOnly value={`valutolab.com/profile/${share.share_token}`}
                                className="flex-1 px-3 py-1.5 text-[11px] font-mono border border-paper-200 rounded-sm bg-paper-100 text-ink-600"
                              />
                              <button onClick={() => handleCopyLink(a.id)} className="px-3 py-1.5 bg-ink-900 text-paper-50 text-[11px] font-medium rounded-sm hover:bg-ink-800 transition-colors">
                                Copia
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Azioni secondarie */}
                    <div className="grid grid-cols-4 gap-2">
                      <button onClick={() => handleGeneratePDF(a.id)} disabled={generatingPDF === a.id}
                        className="flex flex-col items-center gap-1 p-2 border border-paper-200 rounded-md hover:bg-paper-100 transition-colors disabled:opacity-40 text-ink-600">
                        <FileText className="w-4 h-4" />
                        <span className="text-[10px] font-medium">{generatingPDF === a.id ? '...' : 'PDF'}</span>
                      </button>
                      {share && (
                        <>
                          <button onClick={() => handleOpenBadge(a.id)}
                            className="flex flex-col items-center gap-1 p-2 border border-paper-200 rounded-md hover:bg-paper-100 transition-colors text-ink-600">
                            <span className="text-[16px]">🏅</span>
                            <span className="text-[10px] font-medium">Badge</span>
                          </button>
                          <button onClick={() => handleOpenQR(a.id)}
                            className="flex flex-col items-center gap-1 p-2 border border-paper-200 rounded-md hover:bg-paper-100 transition-colors text-ink-600">
                            <span className="text-[16px]">⬛</span>
                            <span className="text-[10px] font-medium">QR</span>
                          </button>
                        </>
                      )}
                      <button onClick={() => handleShareEmail(a.id)}
                        className="flex flex-col items-center gap-1 p-2 border border-paper-200 rounded-md hover:bg-paper-100 transition-colors text-ink-600">
                        <Mail className="w-4 h-4" />
                        <span className="text-[10px] font-medium">Email</span>
                      </button>
                    </div>

                    {/* Elimina */}
                    <button
                      onClick={() => { if (window.confirm('Eliminare questo assessment? Azione irreversibile.')) handleDeleteAssessment(a.id) }}
                      disabled={deleting === a.id}
                      className="flex items-center justify-center gap-1.5 text-[12px] text-ink-400 hover:text-sienna-600 transition-colors disabled:opacity-40 py-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {deleting === a.id ? 'Eliminazione...' : 'Elimina assessment'}
                    </button>
                  </div>
                )
              })}

              {/* Leadership completati */}
              {completedLeadership.map((a) => (
                <div key={a.id} className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink p-6 flex flex-col gap-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400">Leadership Deep Dive</span>
                      <p className="text-[13px] text-ink-500 mt-0.5">
                        Completato il {new Date(a.completed_at || '').toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    <span className="text-[11px] font-medium uppercase tracking-eyebrow text-level-avanzato bg-green-50 border border-green-200 px-3 py-1 rounded-sm">
                      Completato
                    </span>
                  </div>

                  <div className="flex items-center gap-5 bg-paper-100 rounded-md p-4 border border-paper-200">
                    <ScoreRing value={a.total_score ?? 0} size={72} />
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-0.5">Punteggio leadership</p>
                      <p className="font-display text-display-3 text-ink-900">{Number(a.total_score).toFixed(1)}<span className="text-[16px] text-ink-400 font-normal">/5,0</span></p>
                    </div>
                  </div>

                  <Button variant="primary" className="w-full flex items-center justify-center gap-2"
                    onClick={() => router.push(`/leadership/${a.id}/results`)}>
                    Visualizza risultati <ChevronRight className="w-4 h-4" />
                  </Button>

                  <button
                    onClick={() => { if (window.confirm('Eliminare questo assessment?')) handleDeleteLeadership(a.id) }}
                    disabled={deleting === a.id}
                    className="flex items-center justify-center gap-1.5 text-[12px] text-ink-400 hover:text-sienna-600 transition-colors disabled:opacity-40 py-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {deleting === a.id ? 'Eliminazione...' : 'Elimina assessment'}
                  </button>
                </div>
              ))}

            </div>
          </section>
        )}
      </main>

      {/* ── MODAL BADGE ─────────────────────────────────────────────── */}
      {badgeModal?.open && (
        <div className="fixed inset-0 bg-ink-950/60 flex items-center justify-center p-4 z-50">
          <div className="bg-paper-50 rounded-md shadow-lg-ink p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-[20px] font-medium text-ink-900">Badge LinkedIn</h3>
              <button onClick={() => setBadgeModal(null)} className="text-ink-400 hover:text-ink-700">✕</button>
            </div>
            <BadgeGenerator userName={badgeModal.userName} score={badgeModal.score} topSkills={badgeModal.topSkills} shareToken={badgeModal.shareToken} />
          </div>
        </div>
      )}

      {/* ── MODAL QR ────────────────────────────────────────────────── */}
      {qrModal?.open && (
        <div className="fixed inset-0 bg-ink-950/60 flex items-center justify-center p-4 z-50">
          <div className="bg-paper-50 rounded-md shadow-lg-ink p-8 max-w-md w-full">
            <QRCodeGenerator profileUrl={qrModal.profileUrl} userName={qrModal.userName} onClose={() => setQrModal(null)} />
          </div>
        </div>
      )}
    </div>
  )
}
