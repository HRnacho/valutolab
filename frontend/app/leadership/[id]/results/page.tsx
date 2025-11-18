'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

interface DimensionResult {
  dimension: string
  dimension_name: string
  score: string
}

interface AIReport {
  leadership_style: string
  style_description: string
  key_strengths: string
  development_areas: string
  action_plan: {
    immediate_actions: string[]
    medium_term_goals: string[]
    recommended_resources: string[]
  }
}

export default function LeadershipResultsPage() {
  const router = useRouter()
  const params = useParams()
  const assessmentId = params.id as string

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [assessment, setAssessment] = useState<any>(null)
  const [results, setResults] = useState<DimensionResult[]>([])
  const [aiReport, setAIReport] = useState<AIReport | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser(user)

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://valutolab-backend.onrender.com'
        
        const response = await fetch(`${apiUrl}/api/leadership/${assessmentId}/results`)
        const data = await response.json()

        if (data.success) {
          setAssessment(data.data.assessment)
          setResults(data.data.results)
          setAIReport(data.data.aiReport)
        } else {
          throw new Error(data.message)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error loading results:', error)
        alert('Errore nel caricamento dei risultati')
        router.push('/dashboard')
      }
    }

    init()
  }, [router, assessmentId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento risultati...</p>
        </div>
      </div>
    )
  }

  const dimensionIcons: Record<string, string> = {
    visione_strategica: '🎯',
    people_management: '👥',
    decisionalita: '⚡',
    change_management: '🔄',
    influenza_persuasione: '💬',
    orientamento_risultati: '🏆'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              Leadership Deep Dive - Risultati
            </h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Dashboard
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Score Overview */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-6 mb-4">
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Assessment Completato!</h2>
            <p className="text-gray-600">
              Completato il {new Date(assessment?.completed_at || '').toLocaleDateString('it-IT')}
            </p>
          </div>

          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-6 text-center">
            <p className="text-sm text-gray-600 mb-2">Punteggio Generale Leadership</p>
            <p className="text-6xl font-bold text-gray-900">
              {assessment?.total_score?.toFixed(1)}
              <span className="text-3xl text-gray-600">/5.0</span>
            </p>
          </div>
        </div>

        {/* Stile di Leadership */}
        {aiReport && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">👑</span>
              <h3 className="text-2xl font-bold text-gray-900">Il Tuo Stile di Leadership</h3>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 mb-6">
              <h4 className="text-2xl font-bold text-yellow-700 mb-4">{aiReport.leadership_style}</h4>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{aiReport.style_description}</p>
            </div>
          </div>
        )}

        {/* Punteggi per Dimensione */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">📊</span>
            <h3 className="text-2xl font-bold text-gray-900">Punteggi per Dimensione</h3>
          </div>

          <div className="space-y-6">
            {results.map((result) => {
              const score = parseFloat(result.score)
              const percentage = (score / 5) * 100
              
              return (
                <div key={result.dimension}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{dimensionIcons[result.dimension]}</span>
                      <span className="font-semibold text-gray-900">{result.dimension_name}</span>
                    </div>
                    <span className="text-2xl font-bold text-yellow-600">{score.toFixed(1)}</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full transition-all duration-1000 flex items-center justify-end px-2"
                      style={{ width: `${percentage}%` }}
                    >
                      {percentage >= 30 && (
                        <span className="text-white text-xs font-bold">{percentage.toFixed(0)}%</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Punti di Forza */}
        {aiReport && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">💪</span>
              <h3 className="text-2xl font-bold text-gray-900">I Tuoi Punti di Forza</h3>
            </div>
            
            <div className="bg-green-50 rounded-xl p-6">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{aiReport.key_strengths}</p>
            </div>
          </div>
        )}

        {/* Aree di Sviluppo */}
        {aiReport && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">🎯</span>
              <h3 className="text-2xl font-bold text-gray-900">Aree di Sviluppo</h3>
            </div>
            
            <div className="bg-blue-50 rounded-xl p-6">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{aiReport.development_areas}</p>
            </div>
          </div>
        )}

        {/* Piano d'Azione */}
        {aiReport && aiReport.action_plan && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">🚀</span>
              <h3 className="text-2xl font-bold text-gray-900">Piano d'Azione Personalizzato</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Azioni Immediate */}
              <div>
                <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">⚡</span>
                  Azioni Immediate (1 mese)
                </h4>
                <ul className="space-y-3">
                  {aiReport.action_plan.immediate_actions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-3 bg-yellow-50 p-4 rounded-lg">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500 text-white flex items-center justify-center text-sm font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-gray-700">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Obiettivi Medio Termine */}
              <div>
                <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🎯</span>
                  Obiettivi Medio Termine (3-6 mesi)
                </h4>
                <ul className="space-y-3">
                  {aiReport.action_plan.medium_term_goals.map((goal, idx) => (
                    <li key={idx} className="flex items-start gap-3 bg-orange-50 p-4 rounded-lg">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-gray-700">{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Risorse Consigliate */}
            <div>
              <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">📚</span>
                Risorse Consigliate
              </h4>
              <ul className="space-y-2">
                {aiReport.action_plan.recommended_resources.map((resource, idx) => (
                  <li key={idx} className="flex items-center gap-3 bg-purple-50 p-4 rounded-lg">
                    <span className="text-purple-600">📖</span>
                    <span className="text-gray-700">{resource}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:from-yellow-600 hover:to-orange-700 transition shadow-lg"
          >
            Torna alla Dashboard
          </button>
          
          <button
            onClick={() => window.print()}
            className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Stampa Report
          </button>
        </div>
      </main>
    </div>
  )
}
