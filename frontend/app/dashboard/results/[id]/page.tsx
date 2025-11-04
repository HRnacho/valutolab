'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { categoryLabels } from '@/data/questions'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

interface AssessmentResult {
  skill_category: string
  score: number
  percentile: number | null
  strengths: string[]
  improvements: string[]
}

interface Assessment {
  id: string
  total_score: number
  completed_at: string
}

export default function ResultsPage() {
  const router = useRouter()
  const params = useParams()
  const assessmentId = params.id as string

  const [loading, setLoading] = useState(true)
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [results, setResults] = useState<AssessmentResult[]>([])

  useEffect(() => {
    const loadResults = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: assessmentData } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .single()

      if (!assessmentData) {
        router.push('/dashboard')
        return
      }

      setAssessment(assessmentData)

      const { data: resultsData } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('score', { ascending: false })

      if (resultsData) {
        setResults(resultsData)
      }

      setLoading(false)
    }

    loadResults()
  }, [assessmentId, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento risultati...</p>
        </div>
      </div>
    )
  }

  if (!assessment || results.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Nessun risultato trovato</p>
          <a href="/dashboard" className="text-purple-600 hover:text-purple-700 mt-4 inline-block">
            Torna alla Dashboard
          </a>
        </div>
      </div>
    )
  }

  const radarData = results.map((r) => ({
    category: categoryLabels[r.skill_category]?.substring(0, 12) || r.skill_category,
    score: r.score,
  }))

  const barData = results.map((r) => ({
    name: categoryLabels[r.skill_category] || r.skill_category,
    punteggio: r.score,
  }))

  const strengths = results.slice(0, 3)
  const improvements = results.slice(-3).reverse()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Risultati Assessment</h1>
          <a href="/dashboard" className="text-purple-600 hover:text-purple-700 font-medium">
            Torna alla Dashboard
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-lg shadow-lg p-8 mb-8 text-white">
          <h2 className="text-3xl font-bold mb-4">Complimenti! 🎉</h2>
          <p className="text-xl mb-6">Hai completato l&apos;assessment delle soft skills</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/20 rounded-lg p-6">
              <p className="text-sm opacity-90 mb-2">Punteggio Generale</p>
              <p className="text-5xl font-bold">{assessment.total_score.toFixed(1)}</p>
              <p className="text-sm opacity-90 mt-2">su 5.0</p>
            </div>
            
            <div className="bg-white/20 rounded-lg p-6">
              <p className="text-sm opacity-90 mb-2">Percentuale</p>
              <p className="text-5xl font-bold">{((assessment.total_score / 5) * 100).toFixed(0)}%</p>
              <p className="text-sm opacity-90 mt-2">delle competenze</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">🌟</span>
              Punti di Forza
            </h3>
            <div className="space-y-4">
              {strengths.map((item, index) => (
                <div key={item.skill_category} className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-800 rounded-full flex items-center justify-center font-bold mr-3">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {categoryLabels[item.skill_category]}
                    </p>
                    <p className="text-sm text-gray-600">
                      Punteggio: {item.score.toFixed(1)}/5.0 ({((item.score / 5) * 100).toFixed(0)}%)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">📈</span>
              Aree di Miglioramento
            </h3>
            <div className="space-y-4">
              {improvements.map((item, index) => (
                <div key={item.skill_category} className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-800 rounded-full flex items-center justify-center font-bold mr-3">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {categoryLabels[item.skill_category]}
                    </p>
                    <p className="text-sm text-gray-600">
                      Punteggio: {item.score.toFixed(1)}/5.0 ({((item.score / 5) * 100).toFixed(0)}%)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Panoramica Competenze</h3>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" />
              <Radar name="Il Tuo Punteggio" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Dettaglio per Categoria</h3>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={barData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 5]} />
              <YAxis dataKey="name" type="category" width={150} />
              <Tooltip />
              <Bar dataKey="punteggio" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Dettaglio Completo</h3>
          <div className="space-y-6">
            {results.map((result) => (
              <div key={result.skill_category} className="border-b pb-6 last:border-b-0">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {categoryLabels[result.skill_category]}
                  </h4>
                  <span className="text-2xl font-bold text-purple-600">
                    {result.score.toFixed(1)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div className="bg-purple-600 h-3 rounded-full" style={{ width: `${(result.score / 5) * 100}%` }}></div>
                </div>
                <p className="text-sm text-gray-600">
                  {((result.score / 5) * 100).toFixed(0)}% delle competenze in questa categoria
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <a href="/dashboard" className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition font-semibold">
            Torna alla Dashboard
          </a>
        </div>
      </main>
    </div>
  )
}