'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { api } from '@/lib/api'
import BadgeGenerator from '@/components/BadgeGenerator'
import QRCodeGenerator from '@/components/QRCodeGenerator'
import QRCode from 'qrcode'

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
  const [creatingShare, setCreatingShare] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null)
  const [badgeModal, setBadgeModal] = useState<{
    open: boolean;
    assessmentId: string | null;
    userName: string;
    score: number;
    topSkills: Array<{ name: string; score: number }>;
    shareToken: string;
  } | null>(null)
  const [qrModal, setQrModal] = useState<{
    open: boolean;
    profileUrl: string;
    userName: string;
  } | null>(null)

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
  }

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return        // AuthContext ancora in caricamento
      const user = authUser
      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      const [assessmentsRes, leadershipRes] = await Promise.all([
        api.assessments.list(),
        api.leadership.list()
      ])
      const assessmentsData = assessmentsRes.assessments || []
      const leadershipData  = leadershipRes.assessments  || []

      setAssessments(assessmentsData)
      setLeadershipAssessments(leadershipData)

      const counts: Record<string, number> = {}
      for (const assessment of assessmentsData) {
        if (assessment.status === 'in_progress') {
          const r = await api.assessments.responses.count(assessment.id)
          counts[assessment.id] = r.count || 0
        }
      }
      setResponsesCount(counts)

      const leadershipCounts: Record<string, number> = {}
      for (const assessment of leadershipData) {
        if (assessment.status === 'in_progress') {
          const r = await api.leadership.responses.count(assessment.id)
          leadershipCounts[assessment.id] = r.count || 0
        }
      }
      setLeadershipResponsesCount(leadershipCounts)

      const completedIds = (assessmentsData as Assessment[])
        .filter((a: Assessment) => a.status === 'completed')
        .map((a: Assessment) => a.id)

      if (completedIds.length > 0) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://valutolab-backend.onrender.com'
        
        const sharePromises = completedIds.map(async (id) => {
          try {
            const response = await fetch(`${apiUrl}/api/share/create`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id, assessmentId: id })
            })
            const data = await response.json()
            if (data.success) {
              return { [id]: data.share }
            }
          } catch (error) {
            console.error('Error checking share:', error)
          }
          return null
        })

        const shareResults = await Promise.all(sharePromises)
        const shares: Record<string, ShareData> = shareResults
          .filter((result): result is Record<string, ShareData> => result !== null)
          .reduce((acc, result) => ({ ...acc, ...result }), {} as Record<string, ShareData>)
        
        setShareData(shares)
      }

      setLoading(false)
    }

    fetchData()
  }, [router, authUser, authLoading])

  // Escapa caratteri HTML per prevenire XSS nei template innerHTML del PDF
  const sanitizeText = (value: unknown): string => {
    const str = value == null ? '' : String(value)
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
  }

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
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showMessage('success', 'PDF scaricato con successo!')
    } catch (error: any) {
      console.error('Error generating PDF:', error)
      showMessage('error', error.message || 'Errore nella generazione del PDF')
    } finally {
      setGeneratingPDF(null)
    }
  }


  const handleToggleShare = async (assessmentId: string) => {
    if (!user || !shareData[assessmentId]) return
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://valutolab-backend.onrender.com'
      const response = await fetch(
        `${apiUrl}/api/share/${shareData[assessmentId].share_token}/toggle`,
        { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id }) }
      )
      const data = await response.json()
      if (data.success) {
        setShareData({ ...shareData, [assessmentId]: data.share })
        showMessage('success', data.message)
      }
    } catch (error) {
      showMessage('error', "Errore durante l'aggiornamento")
    }
  }

  const handleCopyLink = (assessmentId: string) => {
    if (!shareData[assessmentId]) return
    navigator.clipboard.writeText(`https://valutolab.com/profile/${shareData[assessmentId].share_token}`)
    showMessage('success', 'Link copiato!')
  }

  const handleOpenBadge = async (assessmentId: string) => {
    try {
      const [assessmentRes, profileRes, resultsRes] = await Promise.all([
        api.assessments.get(assessmentId),
        api.profile.get(),
        api.assessments.results.get(assessmentId)
      ])
      const assessment = assessmentRes.assessment
      const profile    = profileRes.profile
      const results    = resultsRes.results?.slice(0, 3)
      const categoryLabels: Record<string, string> = {
        communication: 'Comunicazione', leadership: 'Leadership', problem_solving: 'Problem Solving',
        teamwork: 'Lavoro di Squadra', time_management: 'Gestione del Tempo', adaptability: 'AdattabilitÃ ',
        creativity: 'CreativitÃ ', critical_thinking: 'Pensiero Critico', empathy: 'Empatia',
        resilience: 'Resilienza', negotiation: 'Negoziazione', decision_making: 'Decision Making'
      }
      const topSkills = (results as any[] || []).map((r: any) => ({ name: categoryLabels[r.skill_category] || r.skill_category, score: Math.round(parseFloat(r.final_score) * 20) }))
      setBadgeModal({ open: true, assessmentId, userName: profile?.full_name || 'Utente ValutoLab', score: assessment?.total_score || 0, topSkills, shareToken: shareData[assessmentId]?.share_token || '' })
    } catch (error) {
      showMessage('error', 'Errore nel caricamento dei dati')
    }
  }

  const handleOpenQR = async (assessmentId: string) => {
    try {
      const profileRes = await api.profile.get()
      const profile = profileRes.profile
      const shareToken = shareData[assessmentId]?.share_token
      if (!shareToken) { showMessage('error', 'Errore: token di condivisione non trovato'); return }
      setQrModal({ open: true, profileUrl: `https://valutolab.com/profile/${shareToken}`, userName: profile?.full_name || 'Utente ValutoLab' })
    } catch (error) {
      showMessage('error', 'Errore nel caricamento del QR code')
    }
  }

  const handleStartNewAssessment = async () => {
    const isTrial = user?.role === 'trial_user'
    if (isTrial) {
      try {
        const res = await api.assessments.create()
        router.push(`/assessment/${res.assessment.id}`)
      } catch (error) {
        console.error('Error starting assessment:', error)
        alert("Errore nell'avvio dell'assessment. Riprova.")
      }
    } else {
      router.push('/servizi')
    }
  }

  const handleDeleteLeadership = async (assessmentId: string) => {
    setDeleting(assessmentId)
    try {
      await api.leadership.delete(assessmentId)
      setLeadershipAssessments(leadershipAssessments.filter(a => a.id !== assessmentId))
      showMessage('success', 'Leadership assessment eliminato')
    } catch (error) {
      showMessage('error', "Errore nell'eliminazione")
    } finally {
      setDeleting(null)
    }
  }

  const handleDeleteAssessment = async (assessmentId: string) => {
    setDeleting(assessmentId)
    try {
      await api.assessments.delete(assessmentId)
      setAssessments(assessments.filter(a => a.id !== assessmentId))
      showMessage('success', 'Assessment eliminato')
    } catch (error) {
      showMessage('error', "Errore nell'eliminazione")
    } finally {
      setDeleting(null)
    }
  }

  const handlePrintPDF = (assessmentId: string) => {
    router.push(`/dashboard/results/${assessmentId}`)
  }

  const handleShareEmail = (assessmentId: string) => {
    const subject = encodeURIComponent('I miei risultati ValutoLab')
    const body = encodeURIComponent(`Ecco i risultati del mio assessment delle soft skills:\n\n${window.location.origin}/dashboard/results/${assessmentId}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const handleSignOut = async () => {
    await logout()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    )
  }

  const inProgressAssessments = assessments.filter(a => a.status === 'in_progress')
  const completedAssessments = assessments.filter(a => a.status === 'completed')
  const inProgressLeadership = leadershipAssessments.filter(a => a.status === 'in_progress')
  const completedLeadership = leadershipAssessments.filter(a => a.status === 'completed')

  const isTrial = user?.user_metadata?.role === 'trial_user'

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white font-semibold`}>
          {message.text}
        </div>
      )}

      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">ValutoLab</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">{user?.email}</span>
              <button onClick={handleSignOut} className="text-gray-600 hover:text-gray-900">Esci</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Gestisci i tuoi assessment delle soft skills</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nuovo Assessment</h3>
              <p className="text-gray-600">
                {isTrial ? 'Inizia il tuo assessment gratuito delle soft skills' : 'Scegli tra Assessment Base o Leadership Deep Dive'}
              </p>
            </div>
            <button onClick={handleStartNewAssessment} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition shadow-lg">
              {isTrial ? 'Inizia Assessment' : '+ Vai ai Servizi'}
            </button>
          </div>
        </div>

        {inProgressAssessments.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Assessment Base in Corso</h3>
            <div className="space-y-4">
              {inProgressAssessments.map((assessment) => {
                const answeredCount = responsesCount[assessment.id] || 0
                const progress = Math.round((answeredCount / 48) * 100)
                return (
                  <div key={assessment.id} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Assessment Soft Skills</h4>
                        <p className="text-sm text-gray-600">Iniziato il {new Date(assessment.created_at).toLocaleDateString('it-IT')}</p>
                      </div>
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">In corso</span>
                    </div>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progresso: {answeredCount}/48 domande</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => router.push(`/assessment/${assessment.id}`)} className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition">Riprendi Assessment</button>
                      <button onClick={() => { if (window.confirm('Eliminare questo assessment?')) handleDeleteAssessment(assessment.id) }} disabled={deleting === assessment.id} className="px-4 py-2 border-2 border-red-300 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition disabled:opacity-50">
                        {deleting === assessment.id ? 'Eliminazione...' : 'Elimina'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {inProgressLeadership.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Leadership Deep Dive in Corso</h3>
            <div className="space-y-4">
              {inProgressLeadership.map((assessment) => {
                const answeredCount = leadershipResponsesCount[assessment.id] || 0
                const progress = Math.round((answeredCount / 30) * 100)
                return (
                  <div key={assessment.id} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Leadership Deep Dive</h4>
                        <p className="text-sm text-gray-600">Iniziato il {new Date(assessment.created_at).toLocaleDateString('it-IT')}</p>
                      </div>
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">In corso</span>
                    </div>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progresso: {answeredCount}/30 domande</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-gradient-to-r from-yellow-500 to-orange-600 h-3 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => router.push(`/leadership/${assessment.id}`)} className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-700 transition">Riprendi Leadership Assessment</button>
                      <button onClick={() => { if (window.confirm('Eliminare questo assessment?')) handleDeleteLeadership(assessment.id) }} disabled={deleting === assessment.id} className="px-4 py-2 border-2 border-red-300 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition disabled:opacity-50">
                        {deleting === assessment.id ? 'Eliminazione...' : 'Elimina'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {(completedAssessments.length > 0 || completedLeadership.length > 0) && (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Assessment Completati</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedAssessments.map((assessment) => {
                const share = shareData[assessment.id]
                return (
                  <div key={assessment.id} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Assessment Soft Skills</h4>
                        <p className="text-sm text-gray-600">Completato il {new Date(assessment.completed_at || '').toLocaleDateString('it-IT')}</p>
                      </div>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">Completato</span>
                    </div>
                    <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-600 mb-1">Punteggio Generale</p>
                      <p className="text-3xl font-bold text-gray-900">{Number(assessment.total_score).toFixed(1)}<span className="text-lg text-gray-600">/5.0</span></p>
                    </div>
                    <div className="space-y-3">
                      <button onClick={() => router.push(`/dashboard/results/${assessment.id}`)} className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition">
                        Visualizza Risultati
                      </button>
                      {share && (
                        <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-700">Condivisione</span>
                              {share.is_active && <span className="text-xs text-gray-600">{share.view_count} views</span>}
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" checked={share.is_active} onChange={() => handleToggleShare(assessment.id)} className="sr-only peer" />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                          </div>
                          {share.is_active && (
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <input type="text" value={`valutolab.com/profile/${share.share_token}`} readOnly className="flex-1 px-3 py-1 text-xs border border-gray-300 rounded bg-white text-gray-600 font-mono" />
                                <button onClick={() => handleCopyLink(assessment.id)} className="px-3 py-1 bg-purple-600 text-white rounded text-xs font-semibold hover:bg-purple-700">Copia</button>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => handleOpenBadge(assessment.id)} className="px-2 py-1 border border-purple-300 text-purple-700 rounded text-xs font-semibold hover:bg-purple-50">Badge</button>
                                <button onClick={() => handleOpenQR(assessment.id)} className="px-2 py-1 border border-purple-300 text-purple-700 rounded text-xs font-semibold hover:bg-purple-50">QR</button>
                                <button onClick={() => handleGeneratePDF(assessment.id)} disabled={generatingPDF === assessment.id} className="px-2 py-1 border border-purple-300 text-purple-700 rounded text-xs font-semibold hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed">
                                  {generatingPDF === assessment.id ? '...' : 'PDF'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => handlePrintPDF(assessment.id)} className="px-3 py-2 border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-1">
                          PDF
                        </button>
                        <button onClick={() => handleShareEmail(assessment.id)} className="px-3 py-2 border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-1">
                          Email
                        </button>
                        <button onClick={() => { if (window.confirm('Eliminare questo assessment? Azione irreversibile.')) handleDeleteAssessment(assessment.id) }} disabled={deleting === assessment.id} className="px-3 py-2 border-2 border-red-300 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition disabled:opacity-50 flex items-center justify-center gap-1">
                          {deleting === assessment.id ? '...' : 'Elimina'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}

              {completedLeadership.map((assessment) => (
                <div key={assessment.id} className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-yellow-500">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">Leadership Deep Dive</h4>
                      <p className="text-sm text-gray-600">Completato il {new Date(assessment.completed_at || '').toLocaleDateString('it-IT')}</p>
                    </div>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">Completato</span>
                  </div>
                  <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-600 mb-1">Punteggio Leadership</p>
                    <p className="text-3xl font-bold text-gray-900">{Number(assessment.total_score).toFixed(1)}<span className="text-lg text-gray-600">/5.0</span></p>
                  </div>
                  <div className="space-y-2">
                    <button onClick={() => router.push(`/leadership/${assessment.id}/results`)} className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-700 transition">
                      Visualizza Risultati Leadership
                    </button>
                    <button onClick={() => { if (window.confirm('Eliminare questo assessment?')) handleDeleteLeadership(assessment.id) }} disabled={deleting === assessment.id} className="w-full px-4 py-2 border-2 border-red-300 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition disabled:opacity-50">
                      {deleting === assessment.id ? 'Eliminazione...' : 'Elimina'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {assessments.length === 0 && leadershipAssessments.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nessun assessment ancora</h3>
            <p className="text-gray-600 mb-4">Inizia il tuo primo assessment per scoprire le tue competenze</p>
            <button onClick={handleStartNewAssessment} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition shadow-lg">
              {isTrial ? 'Inizia Assessment Gratuito' : 'Vai ai Servizi'}
            </button>
          </div>
        )}

        {badgeModal?.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Badge LinkedIn</h3>
                <button onClick={() => setBadgeModal(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <BadgeGenerator userName={badgeModal.userName} score={badgeModal.score} topSkills={badgeModal.topSkills} shareToken={badgeModal.shareToken} />
            </div>
          </div>
        )}

        {qrModal?.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
              <QRCodeGenerator profileUrl={qrModal.profileUrl} userName={qrModal.userName} onClose={() => setQrModal(null)} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
