'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts'

const skillColors = {
  adaptability: '#06B6D4',
  leadership: '#8B5CF6',
  problem_solving: '#EC4899',
  time_management: '#F59E0B',
  communication: '#3B82F6',
  empathy: '#14B8A6',
  negotiation: '#A855F7',
  decision_making: '#84CC16',
  critical_thinking: '#6366F1',
  teamwork: '#10B981',
  creativity: '#F43F5E',
  resilience: '#EF4444'
}

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

export default function ResultsPage() {
  const router = useRouter()
  const params = useParams()
  const assessmentId = params.id as string

  const [loading, setLoading] = useState(true)
  const [assessment, setAssessment] = useState<any>(null)
  const [results, setResults] = useState<any[]>([])
  const [qualitativeReport, setQualitativeReport] = useState<any>(null)
  const [generatingReport, setGeneratingReport] = useState(false)

  useEffect(() => {
    const fetchResults = async () => {
      try {
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
          .from('combined_assessment_results')
          .select('*')
          .eq('assessment_id', assessmentId)
          .order('skill_category')

        setResults(resultsData || [])

        const { data: reportData } = await supabase
          .from('qualitative_reports')
          .select('*')
          .eq('assessment_id', assessmentId)
          .single()

        if (reportData) {
          setQualitativeReport(reportData)
        } else {
          generateReport()
        }

        setLoading(false)
      } catch (error) {
        console.error('Error fetching results:', error)
        setLoading(false)
      }
    }

    fetchResults()
  }, [assessmentId, router])

  const generateReport = async () => {
    setGeneratingReport(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://valutolab-backend.onrender.com'
      const response = await fetch(`${apiUrl}/api/ai-reports/generate/${assessmentId}`, {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        setQualitativeReport(data.report)
      }
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setGeneratingReport(false)
    }
  }

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

  const topSkills = [...results]
    .sort((a, b) => b.final_score - a.final_score)
    .slice(0, 3)

  const bottomSkills = [...results]
    .sort((a, b) => a.final_score - b.final_score)
    .slice(0, 3)

  const radarData = results.map(r => ({
    skill: categoryLabels[r.skill_category],
    score: parseFloat(r.final_score),
    fullMark: 5
  }))

  const barData = results.map(r => ({
    name: categoryLabels[r.skill_category],
    score: parseFloat(r.final_score),
    category: r.skill_category
  }))

  const percentile = Math.round((assessment?.total_score / 5) * 100)

  const getLevelBadge = (score: number) => {
    if (score >= 4.5) return { text: 'Esperto', color: 'bg-green-100 text-green-800' }
    if (score >= 3.5) return { text: 'Avanzato', color: 'bg-blue-100 text-blue-800' }
    if (score >= 2.5) return { text: 'Intermedio', color: 'bg-yellow-100 text-yellow-800' }
    return { text: 'Base', color: 'bg-gray-100 text-gray-800' }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-2xl p-8 text-white">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-4xl font-bold">Risultati Assessment</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition"
            >
              ← Dashboard
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <p className="text-white/80 text-sm mb-2">Punteggio Generale</p>
              <p className="text-6xl font-bold mb-2">{assessment?.total_score.toFixed(1)}</p>
              <p className="text-white/80 text-lg">su 5.0</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <p className="text-white/80 text-sm mb-2">Percentuale</p>
              <p className="text-6xl font-bold mb-2">{percentile}%</p>
              <p className="text-white/80 text-lg">delle competenze</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Punti di Forza</h2>
            </div>
            <div className="space-y-4">
              {topSkills.map((skill, index) => {
                const level = getLevelBadge(skill.final_score)
                return (
                  <div key={skill.skill_category} className="border-l-4 pl-4" style={{ borderColor: skillColors[skill.skill_category as keyof typeof skillColors] }}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-gray-700">{index + 1}</span>
                        <span className="font-semibold text-gray-900">{categoryLabels[skill.skill_category]}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${level.color}`}>
                        {level.text}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div 
                          className="h-3 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${(skill.final_score / 5) * 100}%`,
                            backgroundColor: skillColors[skill.skill_category as keyof typeof skillColors]
                          }}
                        ></div>
                      </div>
                      <span className="text-lg font-bold text-gray-900">{skill.final_score}/5.0</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Aree di Miglioramento</h2>
            </div>
            <div className="space-y-4">
              {bottomSkills.map((skill, index) => {
                const level = getLevelBadge(skill.final_score)
                return (
                  <div key={skill.skill_category} className="border-l-4 pl-4" style={{ borderColor: skillColors[skill.skill_category as keyof typeof skillColors] }}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-gray-700">{index + 1}</span>
                        <span className="font-semibold text-gray-900">{categoryLabels[skill.skill_category]}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${level.color}`}>
                        {level.text}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div 
                          className="h-3 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${(skill.final_score / 5) * 100}%`,
                            backgroundColor: skillColors[skill.skill_category as keyof typeof skillColors]
                          }}
                        ></div>
                      </div>
                      <span className="text-lg font-bold text-gray-900">{skill.final_score}/5.0</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Panoramica Competenze</h2>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: '#374151', fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fill: '#6b7280' }} />
                <Radar 
                  name="Competenze" 
                  dataKey="score" 
                  stroke="#8B5CF6" 
                  fill="#8B5CF6" 
                  fillOpacity={0.6} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Dettaglio per Categoria</h2>
          <div className="h-96 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  tick={{ fill: '#374151', fontSize: 11 }}
                />
                <YAxis domain={[0, 5]} tick={{ fill: '#6b7280' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value: any) => [`${value}/5.0`, 'Punteggio']}
                />
                <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={skillColors[entry.category as keyof typeof skillColors]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(categoryLabels).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded" 
                  style={{ backgroundColor: skillColors[key as keyof typeof skillColors] }}
                ></div>
                <span className="text-sm text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {qualitativeReport && (
          <>
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg p-8 text-white">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">💡</span>
                <h2 className="text-3xl font-bold">Il Tuo Profilo Professionale</h2>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
                <p className="text-lg leading-relaxed">
                  {qualitativeReport.profile_insights?.summary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-xl mb-3">Profilo Suggerito:</h3>
                  <p className="text-2xl font-bold bg-white/20 rounded-lg p-4 inline-block">
                    {qualitativeReport.profile_insights?.suggested_profile}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-xl mb-3">Ruoli Ideali:</h3>
                  <div className="flex flex-wrap gap-2">
                    {qualitativeReport.profile_insights?.ideal_roles?.map((role: string, idx: number) => (
                      <span key={idx} className="bg-white/20 px-4 py-2 rounded-lg text-sm font-medium">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {qualitativeReport.profile_insights?.unique_strengths && (
                <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <h3 className="font-semibold text-xl mb-2">La Tua Unicità:</h3>
                  <p className="text-lg">{qualitativeReport.profile_insights.unique_strengths}</p>
                </div>
              )}

              {qualitativeReport.profile_insights?.patterns && (
                <div className="mt-6">
                  <h3 className="font-semibold text-xl mb-3">Pattern Comportamentali:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {qualitativeReport.profile_insights.patterns.map((pattern: string, idx: number) => (
                      <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-start gap-3">
                        <span className="text-xl">✓</span>
                        <p>{pattern}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">🎓</span>
                <h2 className="text-3xl font-bold text-gray-900">Interpretazione Qualitativa</h2>
              </div>

              <div className="space-y-6">
                {Object.entries(qualitativeReport.category_interpretations || {}).map(([category, interp]: [string, any]) => {
                  const level = getLevelBadge(interp.score)
                  return (
                    <div 
                      key={category} 
                      className="border-l-4 rounded-r-xl p-6 bg-gray-50"
                      style={{ borderColor: skillColors[category as keyof typeof skillColors] }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{categoryLabels[category]}</h3>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-2xl font-bold" style={{ color: skillColors[category as keyof typeof skillColors] }}>
                              {interp.score}/5.0
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${level.color}`}>
                              {level.text}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4 leading-relaxed">{interp.description}</p>

                      {interp.behavioral_notes && (
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                          <p className="text-sm font-semibold text-blue-900 mb-1">Note Comportamentali:</p>
                          <p className="text-blue-800">{interp.behavioral_notes}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                            <span>✓</span> Punti di Forza
                          </h4>
                          <ul className="space-y-1">
                            {interp.strengths?.map((strength: string, idx: number) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-green-600 mt-1">•</span>
                                <span>{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                            <span>↗</span> Aree di Miglioramento
                          </h4>
                          <ul className="space-y-1">
                            {interp.improvements?.map((improvement: string, idx: number) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-orange-600 mt-1">•</span>
                                <span>{improvement}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">🎯</span>
                <h2 className="text-3xl font-bold text-gray-900">Piano di Sviluppo Personalizzato</h2>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-6 rounded-r-xl">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⏱️</span>
                  <div>
                    <p className="font-semibold text-blue-900">Timeline Consigliata</p>
                    <p className="text-blue-800 text-lg">{qualitativeReport.development_plan?.timeline}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6 mb-8">
                {qualitativeReport.development_plan?.focus_areas?.map((area: any, idx: number) => {
                  const priorityColors = {
                    'Alta': 'bg-red-100 text-red-800 border-red-300',
                    'Media': 'bg-yellow-100 text-yellow-800 border-yellow-300',
                    'Bassa': 'bg-green-100 text-green-800 border-green-300'
                  }
                  const priorityColor = priorityColors[area.priority as keyof typeof priorityColors] || priorityColors['Media']

                  return (
                    <div key={idx} className="border-2 border-gray-200 rounded-xl p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{area.skill}</h3>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-sm text-gray-600">
                              Attuale: <span className="font-semibold">{area.current_score}/5.0</span>
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="text-sm text-gray-600">
                              Obiettivo: <span className="font-semibold">{area.target_score}/5.0</span>
                            </span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border-2 ${priorityColor}`}>
                          Priorità {area.priority}
                        </span>
                      </div>

                      {area.gap_analysis && (
                        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-4 rounded-r">
                          <p className="text-sm font-semibold text-purple-900 mb-1">Gap Analysis:</p>
                          <p className="text-purple-800">{area.gap_analysis}</p>
                        </div>
                      )}

                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Azioni Concrete:</h4>
                        <div className="space-y-2">
                          {area.actions?.map((action: string, actionIdx: number) => (
                            <div key={actionIdx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                              <span className="text-purple-600 font-bold text-lg">{actionIdx + 1}</span>
                              <p className="text-gray-700 flex-1">{action}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {area.resources && area.resources.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Risorse Consigliate:</h4>
                          <div className="flex flex-wrap gap-2">
                            {area.resources.map((resource: string, resIdx: number) => (
                              <span key={resIdx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                {resource}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {qualitativeReport.development_plan?.quick_wins && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">⚡</span>
                    <h3 className="text-2xl font-bold text-gray-900">Quick Wins</h3>
                  </div>
                  <p className="text-gray-700 mb-4">Azioni immediate che puoi intraprendere da subito:</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {qualitativeReport.development_plan.quick_wins.map((win: string, idx: number) => (
                      <div key={idx} className="bg-white rounded-lg p-4 shadow-sm border border-green-200">
                        <div className="flex items-start gap-2">
                          <span className="text-green-600 font-bold text-lg">{idx + 1}</span>
                          <p className="text-sm text-gray-800">{win}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {generatingReport && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Generazione report qualitativo in corso...</p>
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition shadow-lg"
          >
            Torna alla Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
