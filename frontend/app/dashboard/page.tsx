'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import BadgeGenerator from '@/components/BadgeGenerator'
import QRCodeGenerator from '@/components/QRCodeGenerator'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
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
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Carica assessment base
      const { data: assessmentsData } = await supabase
        .from('assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setAssessments(assessmentsData || [])

      // Carica leadership assessments
      const { data: leadershipData } = await supabase
        .from('leadership_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setLeadershipAssessments(leadershipData || [])

      // Conta risposte assessment base
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

      // Conta risposte leadership
      const leadershipCounts: Record<string, number> = {}
      for (const assessment of leadershipData || []) {
        if (assessment.status === 'in_progress') {
          const { count } = await supabase
            .from('leadership_responses')
            .select('*', { count: 'exact', head: true })
            .eq('assessment_id', assessment.id)
          
          leadershipCounts[assessment.id] = count || 0
        }
      }
      setLeadershipResponsesCount(leadershipCounts)

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

  const handleGeneratePDF = async (assessmentId: string) => {
    // ... codice esistente per PDF ...
    showMessage('success', 'Funzionalità PDF in arrivo!')
  }

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

  const handleDeleteLeadership = async (assessmentId: string) => {
    setDeleting(assessmentId)
    try {
      await supabase
        .from('leadership_responses')
        .delete()
        .eq('assessment_id', assessmentId)

      await supabase
        .from('leadership_results')
        .delete()
        .eq('assessment_id', assessmentId)

      await supabase
        .from('leadership_ai_reports')
        .delete()
        .eq('assessment_id', assessmentId)

      await supabase
        .from('leadership_assessments')
        .delete()
        .eq('id', assessmentId)

      setLeadershipAssessments(leadershipAssessments.filter(a => a.id !== assessmentId))
      showMessage('success', 'Leadership assessment eliminato')
    } catch (error) {
      console.error('Error deleting leadership assessment:', error)
      showMessage('error', 'Errore nell\'eliminazione')
    } finally {
      setDeleting(null)
    }
  }

  const handleStartNewAssessment = async () => {
    router.push('/servizi')
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
      showMessage('success', 'Assessment eliminato')
    } catch (error) {
      console.error('Error deleting assessment:', error)
      showMessage('error', 'Errore nell\'eliminazione')
    } finally {
      setDeleting(null)
    }
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
  const inProgressLeadership = leadershipAssessments.filter(a => a.status === 'in_progress')
  const completedLeadership = leadershipAssessments.filter(a => a.status === 'completed')

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
              <p className="text-gray-600">Scegli tra Assessment Base o Leadership Deep Dive</p>
            </div>
            <button
              onClick={handleStartNewAssessment}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition shadow-lg"
            >
              + Vai ai Servizi
            </button>
          </div>
        </div>

        {/* ASSESSMENT BASE IN CORSO */}
        {inProgressAssessments.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">📋 Assessment Base in Corso</h3>
            <div className="space-y-4">
              {inProgressAssessments.map((assessment) => {
                const answeredCount = responsesCount[assessment.id] || 0
                const totalQuestions = 48
                const progress = Math.round((answeredCount / totalQuestions) * 100)

                return (
                  <div key={assessment.id} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
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

        {/* LEADERSHIP IN CORSO */}
        {inProgressLeadership.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">🏆 Leadership Deep Dive in Corso</h3>
            <div className="space-y-4">
              {inProgressLeadership.map((assessment) => {
                const answeredCount = leadershipResponsesCount[assessment.id] || 0
                const totalQuestions = 30
                const progress = Math.round((answeredCount / totalQuestions) * 100)

                return (
                  <div key={assessment.id} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Leadership Deep Dive</h4>
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
                          className="bg-gradient-to-r from-yellow-500 to-orange-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => router.push(`/leadership/${assessment.id}`)}
                        className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-700 transition"
                      >
                        Riprendi Leadership Assessment
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Sei sicuro di voler eliminare questo assessment?')) {
                            handleDeleteLeadership(assessment.id)
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

        {/* ASSESSMENT COMPLETATI */}
        {(completedAssessments.length > 0 || completedLeadership.length > 0) && (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">✅ Assessment Completati</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Assessment Base Completati */}
              {completedAssessments.map((assessment) => {
                const share = shareData[assessment.id]
                
                return (
                  <div key={assessment.id} className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-purple-500">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">📋 Assessment Base</h4>
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

                    <div className="space-y-2">
                      <button
                        onClick={() => router.push(`/dashboard/results/${assessment.id}`)}
                        className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
                      >
                        Visualizza Risultati
                      </button>
                      
                      <button
                        onClick={() => {
                          if (window.confirm('Sei sicuro di voler eliminare questo assessment?')) {
                            handleDeleteAssessment(assessment.id)
                          }
                        }}
                        disabled={deleting === assessment.id}
                        className="w-full px-4 py-2 border-2 border-red-300 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition disabled:opacity-50"
                      >
                        {deleting === assessment.id ? 'Eliminazione...' : 'Elimina'}
                      </button>
                    </div>
                  </div>
                )
              })}

              {/* Leadership Completati */}
              {completedLeadership.map((assessment) => (
                <div key={assessment.id} className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-yellow-500">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">🏆 Leadership Deep Dive</h4>
                      <p className="text-sm text-gray-600">
                        Completato il {new Date(assessment.completed_at || '').toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                      Completato
                    </span>
                  </div>

                  <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-600 mb-1">Punteggio Leadership</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {assessment.total_score?.toFixed(1)}<span className="text-lg text-gray-600">/5.0</span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => router.push(`/leadership/${assessment.id}/results`)}
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-700 transition"
                    >
                      Visualizza Risultati Leadership
                    </button>
                    
                    <button
                      onClick={() => {
                        if (window.confirm('Sei sicuro di voler eliminare questo assessment?')) {
                          handleDeleteLeadership(assessment.id)
                        }
                        }}
                        disabled={deleting === assessment.id}
                        className="w-full px-4 py-2 border-2 border-red-300 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition disabled:opacity-50"
                      >
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
              <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nessun assessment ancora</h3>
            <p className="text-gray-600 mb-4">Inizia il tuo primo assessment per scoprire le tue competenze</p>
            <button
              onClick={handleStartNewAssessment}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition shadow-lg"
            >
              Vai ai Servizi
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

