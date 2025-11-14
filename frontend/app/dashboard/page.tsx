'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import BadgeGenerator from '@/components/BadgeGenerator'

interface Assessment {
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
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [responsesCount, setResponsesCount] = useState<Record<string, number>>({})
  const [deleting, setDeleting] = useState<string | null>(null)
  const [shareData, setShareData] = useState<Record<string, ShareData>>({})
  const [creatingShare, setCreatingShare] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [badgeModal, setBadgeModal] = useState<{
    open: boolean;
    assessmentId: string | null;
    userName: string;
    score: number;
    topSkills: Array<{ name: string; score: number }>;
    shareToken: string;
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
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      const { data: assessmentsData } = await supabase
        .from('assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setAssessments(assessmentsData || [])

      const counts: Record<string, number> = {}
      for (const assessment of assessmentsData || []) {
        if (assessment.status === 'in_progress') {
          const { count } = await supabase
            .from('assessment_responses')
            .select('*', { count: 'exact', head: true })
            .eq('assessment_id', assessment.id)
          
          counts[assessment.id] = count || 0
        }
      }
      setResponsesCount(counts)

      // Carica dati di condivisione per assessment completati
      const completedIds = (assessmentsData || [])
        .filter(a => a.status === 'completed')
        .map(a => a.id)

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
          .reduce((acc, result) => {
            return { ...acc, ...result }
          }, {} as Record<string, ShareData>)
        
        setShareData(shares)
      }

      setLoading(false)
    }

    fetchData()
  }, [router])

  const handleToggleShare = async (assessmentId: string) => {
    if (!user || !shareData[assessmentId]) return

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://valutolab-backend.onrender.com'
      const response = await fetch(
        `${apiUrl}/api/share/${shareData[assessmentId].share_token}/toggle`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        }
      )

      const data = await response.json()

      if (data.success) {
        setShareData({
          ...shareData,
          [assessmentId]: data.share
        })
        showMessage('success', data.message)
      }
    } catch (error) {
      showMessage('error', 'Errore durante l\'aggiornamento')
    }
  }

  const handleCopyLink = (assessmentId: string) => {
    if (!shareData[assessmentId]) return
    
    const link = `https://valutolab.com/profile/${shareData[assessmentId].share_token}`
    navigator.clipboard.writeText(link)
    showMessage('success', 'Link copiato!')
  }

  const handleOpenBadge = async (assessmentId: string) => {
    try {
      const { data: assessment } = await supabase
        .from('assessments')
        .select('total_score')
        .eq('id', assessmentId)
        .single()

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      const { data: results } = await supabase
        .from('combined_assessment_results')
        .select('skill_category, final_score')
        .eq('assessment_id', assessmentId)
        .order('final_score', { ascending: false })
        .limit(3)

      const categoryLabels: Record<string, string> = {
        communication: 'Comunicazione',
        leadership: 'Leadership',
        problem_solving: 'Problem Solving',
        teamwork: 'Lavoro di Squadra',
        time_management: 'Gestione del Tempo',
        adaptability: 'Adattabilità',
        creativity: 'Creatività',
        critical_thinking: 'Pensiero Critico',
        empathy: 'Empatia',
        resilience: 'Resilienza',
        negotiation: 'Negoziazione',
        decision_making: 'Decision Making'
      }

      const topSkills = (results || []).map(r => ({
        name: categoryLabels[r.skill_category] || r.skill_category,
        score: Math.round(parseFloat(r.final_score) * 20)
      }))

      setBadgeModal({
        open: true,
        assessmentId,
        userName: profile?.full_name || 'Utente ValutoLab',
        score: assessment?.total_score || 0,
        topSkills,
        shareToken: shareData[assessmentId]?.share_token || ''
      })
    } catch (error) {
      console.error('Error loading badge data:', error)
      showMessage('error', 'Errore nel caricamento dei dati')
    }
  }

  const handleStartNewAssessment = async () => {
    try {
      const inProgressAssessment = assessments.find(a => a.status === 'in_progress')
      
      if (inProgressAssessment) {
        const confirmDelete = window.confirm(
          'Hai già un assessment in corso. Vuoi eliminarlo e iniziarne uno nuovo?'
        )
        
        if (!confirmDelete) return
        
        await handleDeleteAssessment(inProgressAssessment.id)
      }

      const { data: newAssessment, error } = await supabase
        .from('assessments')
        .insert({
          user_id: user.id,
          status: 'in_progress'
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/assessment/${newAssessment.id}`)
    } catch (error) {
      console.error('Error starting assessment:', error)
      alert('Errore nell\'avvio dell\'assessment. Riprova.')
    }
  }

  const handleDeleteAssessment = async (assessmentId: string) => {
    setDeleting(assessmentId)
    try {
      await supabase
        .from('assessment_responses')
        .delete()
        .eq('assessment_id', assessmentId)

      await supabase
        .from('situational_responses')
        .delete()
        .eq('assessment_id', assessmentId)

      await supabase
        .from('assessment_results')
        .delete()
        .eq('assessment_id', assessmentId)

      await supabase
        .from('qualitative_reports')
        .delete()
        .eq('assessment_id', assessmentId)

      await supabase
        .from('shared_profiles')
        .delete()
        .eq('assessment_id', assessmentId)

      await supabase
        .from('assessments')
        .delete()
        .eq('id', assessmentId)

      setAssessments(assessments.filter(a => a.id !== assessmentId))
    } catch (error) {
      console.error('Error deleting assessment:', error)
      alert('Errore nell\'eliminazione. Riprova.')
    } finally {
      setDeleting(null)
    }
  }

  const handlePrintPDF = (assessmentId: string) => {
    router.push(`/dashboard/results/${assessmentId}`)
    setTimeout(() => {
      window.print()
    }, 1000)
  }

  const handleShareEmail = (assessmentId: string) => {
    const subject = encodeURIComponent('I miei risultati ValutoLab')
    const body = encodeURIComponent(
      `Ecco i risultati del mio assessment delle soft skills:\n\n${window.location.origin}/dashboard/results/${assessmentId}`
    )
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white font-semibold`}>
          {message.text}
        </div>
      )}

      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">ValutoLab</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-900"
              >
                Esci
              </button>
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
              <p className="text-gray-600">Inizia un nuovo assessment delle tue competenze</p>
            </div>
            <button
              onClick={handleStartNewAssessment}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition shadow-lg"
            >
              + Nuovo Assessment
            </button>
          </div>
        </div>

        {inProgressAssessments.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Assessment in Corso</h3>
            <div className="space-y-4">
              {inProgressAssessments.map((assessment) => {
                const answeredCount = responsesCount[assessment.id] || 0
                const totalQuestions = 48
                const progress = Math.round((answeredCount / totalQuestions) * 100)

                return (
                  <div key={assessment.id} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Assessment Soft Skills</h4>
                        <p className="text-sm text-gray-600">
                          Iniziato il {new Date(assessment.created_at).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                        In corso
                      </span>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progresso: {answeredCount}/{totalQuestions} domande</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => router.push(`/assessment/${assessment.id}`)}
                        className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
                      >
                        Riprendi Assessment
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Sei sicuro di voler eliminare questo assessment?')) {
                            handleDeleteAssessment(assessment.id)
                          }
                        }}
                        disabled={deleting === assessment.id}
                        className="px-4 py-2 border-2 border-red-300 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition disabled:opacity-50"
                      >
                        {deleting === assessment.id ? 'Eliminazione...' : 'Elimina'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {completedAssessments.length > 0 && (
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
                        <p className="text-sm text-gray-600">
                          Completato il {new Date(assessment.completed_at || '').toLocaleDateString('it-IT')}
                        </p>
                      </div>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                        Completato
                      </span>
                    </div>

                    <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-600 mb-1">Punteggio Generale</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {assessment.total_score?.toFixed(1)}<span className="text-lg text-gray-600">/5.0</span>
                      </p>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={() => router.push(`/dashboard/results/${assessment.id}`)}
                        className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
                      >
                        Visualizza Risultati
                      </button>

                      {share && (
                        <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-700">🔗 Condivisione</span>
                              {share.is_active && (
                                <span className="text-xs text-gray-600">👁️ {share.view_count} views</span>
                              )}
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={share.is_active}
                                onChange={() => handleToggleShare(assessment.id)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                          </div>

                          {share.is_active && (
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={`valutolab.com/profile/${share.share_token}`}
                                  readOnly
                                  className="flex-1 px-3 py-1 text-xs border border-gray-300 rounded bg-white text-gray-600 font-mono"
                                />
                                <button
                                  onClick={() => handleCopyLink(assessment.id)}
                                  className="px-3 py-1 bg-purple-600 text-white rounded text-xs font-semibold hover:bg-purple-700"
                                >
                                  Copia
                                </button>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2">
                                <button
                                  onClick={() => handleOpenBadge(assessment.id)}
                                  className="px-2 py-1 border border-purple-300 text-purple-700 rounded text-xs font-semibold hover:bg-purple-50"
                                >
                                  📱 Badge
                                </button>
                               <button
                                  onClick={() => setShowQRModal(true)}
                                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                                >
                                <span>📄</span>
                                  QR
                                </button>
                                <button
                                  disabled
                                  className="px-2 py-1 border border-gray-300 text-gray-400 rounded text-xs font-semibold cursor-not-allowed opacity-50"
                                  title="Coming Soon"
                                >
                                  📋 PDF
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => handlePrintPDF(assessment.id)}
                          className="px-3 py-2 border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          PDF
                        </button>
                        
                        <button
                          onClick={() => handleShareEmail(assessment.id)}
                          className="px-3 py-2 border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Email
                        </button>
                        
                        <button
                          onClick={() => {
                            if (window.confirm('Sei sicuro di voler eliminare questo assessment? Questa azione è irreversibile.')) {
                              handleDeleteAssessment(assessment.id)
                            }
                          }}
                          disabled={deleting === assessment.id}
                          className="px-3 py-2 border-2 border-red-300 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          {deleting === assessment.id ? '...' : 'Elimina'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {assessments.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nessun assessment ancora</h3>
            <p className="text-gray-600">Inizia il tuo primo assessment per scoprire le tue soft skills</p>
          </div>
        )}

        {badgeModal?.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Badge LinkedIn</h3>
                <button
                  onClick={() => setBadgeModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <BadgeGenerator
                userName={badgeModal.userName}
                score={badgeModal.score}
                topSkills={badgeModal.topSkills}
                shareToken={badgeModal.shareToken}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

