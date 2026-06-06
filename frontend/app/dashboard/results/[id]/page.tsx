'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { api } from '@/lib/api'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { Button } from '@/components/ui/Button'
import { Wordmark } from '@/components/ui/Wordmark'
import ShareSection from '@/components/ShareSection'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from 'recharts'
import { ArrowLeft, TrendingUp, TrendingDown, Calendar } from 'lucide-react'

// ── Palette DS v2 per le 12 skill ────────────────────────────────────────────
const skillColors: Record<string, string> = {
  adaptability:     '#2D5F73',
  leadership:       '#4F7A53',
  problem_solving:  '#B0473A',
  time_management:  '#C68A2E',
  communication:    '#0E1A2B',
  empathy:          '#4F7A53',
  negotiation:      '#2D5F73',
  decision_making:  '#C68A2E',
  critical_thinking:'#B0473A',
  teamwork:         '#4F7A53',
  creativity:       '#2D5F73',
  resilience:       '#C68A2E',
}

const categoryLabels: Record<string, string> = {
  communication:    'Comunicazione',
  leadership:       'Leadership',
  problem_solving:  'Problem Solving',
  teamwork:         'Lavoro di Squadra',
  time_management:  'Gestione del Tempo',
  adaptability:     'Adattabilità',
  creativity:       'Creatività',
  critical_thinking:'Pensiero Critico',
  empathy:          'Empatia',
  resilience:       'Resilienza',
  negotiation:      'Negoziazione',
  decision_making:  'Decision Making',
}

// Mapping livello → token DS colore
const levelStyle: Record<string, { label: string; className: string }> = {
  base:       { label: 'Base',       className: 'text-ink-500 bg-paper-200 border-paper-300' },
  intermedio: { label: 'Intermedio', className: 'text-level-intermedio bg-amber-50 border-amber-200' },
  avanzato:   { label: 'Avanzato',   className: 'text-level-avanzato bg-green-50 border-green-200' },
  esperto:    { label: 'Esperto',    className: 'text-level-esperto bg-teal-50 border-teal-200' },
}

const getLevelKey = (score: number) => {
  if (score >= 4.5) return 'esperto'
  if (score >= 3.5) return 'avanzato'
  if (score >= 2.5) return 'intermedio'
  return 'base'
}

const LevelBadge = ({ score }: { score: number }) => {
  const key = getLevelKey(score)
  const { label, className } = levelStyle[key]
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-eyebrow px-2 py-0.5 border rounded-sm ${className}`}>
      {label}
    </span>
  )
}

// Tooltip custom per i chart
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-paper-50 border border-paper-200 rounded-sm shadow-md-ink px-3 py-2">
      <p className="font-body text-[12px] font-semibold text-ink-900">{payload[0]?.payload?.name || payload[0]?.payload?.skill}</p>
      <p className="font-body text-[12px] text-ink-600">{Number(payload[0]?.value).toFixed(2)} / 5,0</p>
    </div>
  )
}

export default function ResultsPage() {
  const router = useRouter()
  const params = useParams()
  const assessmentId = params.id as string
  const { user: authUser } = useAuth()

  const [loading, setLoading] = useState(true)
  const [assessment, setAssessment] = useState<any>(null)
  const [results, setResults] = useState<any[]>([])
  const [qualitativeReport, setQualitativeReport] = useState<any>(null)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const user = authUser
        if (!user) { router.push('/login'); return }
        setUserId(user.id)

        const [assessmentRes, resultsRes, reportRes] = await Promise.all([
          api.assessments.get(assessmentId),
          api.assessments.results.get(assessmentId),
          api.assessments.report.get(assessmentId),
        ])

        if (!assessmentRes.assessment) { router.push('/dashboard'); return }

        setAssessment(assessmentRes.assessment)
        setResults(resultsRes.results || [])

        if (reportRes.report) {
          setQualitativeReport(reportRes.report)
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.valutolab.com'
      const response = await fetch(`${apiUrl}/api/ai-reports/generate/${assessmentId}`, { method: 'POST' })
      const data = await response.json()
      if (data.success) setQualitativeReport(data.report)
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setGeneratingReport(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper-100">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-ink-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 font-body text-ink-500 text-[14px]">Caricamento risultati...</p>
        </div>
      </div>
    )
  }

  const topSkills    = [...results].sort((a, b) => b.final_score - a.final_score).slice(0, 3)
  const bottomSkills = [...results].sort((a, b) => a.final_score - b.final_score).slice(0, 3)

  const radarData = results.map(r => ({
    skill: categoryLabels[r.skill_category] ?? r.skill_category,
    score: parseFloat(r.final_score),
    fullMark: 5,
  }))

  const barData = results.map(r => ({
    name: categoryLabels[r.skill_category] ?? r.skill_category,
    score: parseFloat(r.final_score),
    category: r.skill_category,
  }))

  const escoAdvancedCount = qualitativeReport
    ? Object.values(qualitativeReport.category_interpretations || {}).filter(
        (i: any) => i.esco_mapping?.esco_level === 'Avanzato' || i.esco_mapping?.esco_level === 'Esperto'
      ).length
    : 0

  return (
    <div className="min-h-screen bg-paper-100 font-body text-ink-900">

      {/* ── HEADER ───────────────────────────────────────────────────── */}
      <header className="bg-paper-50 border-b border-paper-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Wordmark size={20} />
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1.5 text-[13px] text-ink-600 hover:text-ink-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 lg:px-8 py-10 space-y-8">

        {/* ── HERO SCORES ──────────────────────────────────────────────── */}
        <div className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink p-8">
          <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-1">Assessment Soft Skills</p>
          <h1 className="font-display text-display-2 text-ink-900 mb-8">Risultati</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Punteggio generale */}
            <div className="bg-ink-900 rounded-md p-6 flex items-center gap-5">
              <ScoreRing value={assessment?.total_score ?? 0} size={80} />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-1">Punteggio</p>
                <p className="font-display text-[36px] leading-none text-paper-50">
                  {Number(assessment?.total_score).toFixed(1)}<span className="text-[18px] text-ink-400">/5,0</span>
                </p>
              </div>
            </div>

            {/* Percentuale */}
            <div className="bg-ink-900 rounded-md p-6">
              <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-2">Percentuale competenze</p>
              <p className="font-display text-[48px] leading-none text-paper-50">
                {Math.round((assessment?.total_score / 5) * 100)}<span className="text-[24px] text-ink-400">%</span>
              </p>
            </div>

            {/* ESCO */}
            <div className="bg-ink-900 rounded-md p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[16px]">🇪🇺</span>
                <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400">Standard ESCO v1.2</p>
              </div>
              {qualitativeReport ? (
                <>
                  <p className="font-display text-[48px] leading-none text-paper-50">
                    {escoAdvancedCount}<span className="text-[24px] text-ink-400">/12</span>
                  </p>
                  <p className="text-[12px] text-ink-400 mt-1">competenze Avanzato/Esperto</p>
                </>
              ) : (
                <p className="text-[13px] text-ink-500 mt-2">Report in generazione…</p>
              )}
            </div>
          </div>
        </div>

        {/* ── PUNTI DI FORZA & AREE DI MIGLIORAMENTO ───────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Forze */}
          <div className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink p-6">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-5 h-5 text-level-avanzato" />
              <h2 className="font-display text-[20px] font-medium text-ink-900">Punti di Forza</h2>
            </div>
            <div className="space-y-4">
              {topSkills.map((skill, i) => (
                <div key={skill.skill_category}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-ink-400 w-4">{i + 1}</span>
                      <span className="text-[14px] font-medium text-ink-800">{categoryLabels[skill.skill_category]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-ink-900">{Number(skill.final_score).toFixed(2)}</span>
                      <LevelBadge score={skill.final_score} />
                    </div>
                  </div>
                  <div className="w-full bg-paper-200 rounded-sm h-1.5">
                    <div className="h-1.5 rounded-sm transition-all" style={{ width: `${(skill.final_score / 5) * 100}%`, backgroundColor: skillColors[skill.skill_category] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Aree di miglioramento */}
          <div className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink p-6">
            <div className="flex items-center gap-2 mb-5">
              <TrendingDown className="w-5 h-5 text-sienna-600" />
              <h2 className="font-display text-[20px] font-medium text-ink-900">Aree di Miglioramento</h2>
            </div>
            <div className="space-y-4">
              {bottomSkills.map((skill, i) => (
                <div key={skill.skill_category}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-ink-400 w-4">{i + 1}</span>
                      <span className="text-[14px] font-medium text-ink-800">{categoryLabels[skill.skill_category]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-ink-900">{Number(skill.final_score).toFixed(2)}</span>
                      <LevelBadge score={skill.final_score} />
                    </div>
                  </div>
                  <div className="w-full bg-paper-200 rounded-sm h-1.5">
                    <div className="h-1.5 rounded-sm transition-all" style={{ width: `${(skill.final_score / 5) * 100}%`, backgroundColor: skillColors[skill.skill_category] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RADAR CHART ──────────────────────────────────────────────── */}
        <div className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink p-8">
          <h2 className="font-display text-[20px] font-medium text-ink-900 mb-6">Panoramica Competenze</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#ECE6D8" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: '#3A4A5C', fontSize: 11, fontFamily: 'IBM Plex Sans' }} />
                <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fill: '#8A9BB0', fontSize: 10 }} />
                <Radar name="Competenze" dataKey="score" stroke="#0E1A2B" fill="#0E1A2B" fillOpacity={0.35} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── BAR CHART ────────────────────────────────────────────────── */}
        <div className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink p-8">
          <h2 className="font-display text-[20px] font-medium text-ink-900 mb-6">Dettaglio per Categoria</h2>
          <div className="h-72 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ECE6D8" vertical={false} />
                <XAxis dataKey="name" angle={-40} textAnchor="end" height={80} tick={{ fill: '#3A4A5C', fontSize: 10, fontFamily: 'IBM Plex Sans' }} />
                <YAxis domain={[0, 5]} tick={{ fill: '#8A9BB0', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="score" radius={[2, 2, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={skillColors[entry.category]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Legenda */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(categoryLabels).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: skillColors[key] }} />
                <span className="text-[11px] text-ink-600">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── REPORT QUALITATIVO ───────────────────────────────────────── */}
        {generatingReport && (
          <div className="bg-paper-50 border border-paper-200 rounded-md p-10 text-center">
            <div className="w-8 h-8 border-2 border-ink-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-body text-[14px] text-ink-500">Generazione report AI in corso…</p>
          </div>
        )}

        {qualitativeReport && (
          <>
            {/* ── PROFILO PROFESSIONALE ──── */}
            <div className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink p-8">
              <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-1">Analisi AI</p>
              <h2 className="font-display text-display-3 text-ink-900 mb-6">Il Tuo Profilo Professionale</h2>

              <div className="bg-paper-100 border border-paper-200 rounded-md p-6 mb-6">
                <p className="font-body text-[15px] leading-relaxed text-ink-700">
                  {qualitativeReport.profile_insights?.summary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-ink-900 rounded-md p-5">
                  <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-2">Profilo Suggerito</p>
                  <p className="font-display text-[20px] text-paper-50">{qualitativeReport.profile_insights?.suggested_profile}</p>
                </div>
                <div className="bg-ink-900 rounded-md p-5">
                  <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-2">Ruoli Ideali</p>
                  <div className="flex flex-wrap gap-2">
                    {qualitativeReport.profile_insights?.ideal_roles?.map((role: string, idx: number) => (
                      <span key={idx} className="bg-ink-700 text-paper-100 text-[12px] px-3 py-1 rounded-sm">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {qualitativeReport.profile_insights?.unique_strengths && (
                <div className="bg-paper-100 border border-paper-200 rounded-md p-5 mb-4">
                  <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-2">La Tua Unicità</p>
                  <p className="font-body text-[15px] text-ink-700">{qualitativeReport.profile_insights.unique_strengths}</p>
                </div>
              )}

              {qualitativeReport.profile_insights?.patterns?.length > 0 && (
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-3">Pattern Comportamentali</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {qualitativeReport.profile_insights.patterns.map((p: string, idx: number) => (
                      <div key={idx} className="bg-paper-100 border border-paper-200 rounded-md p-4 flex items-start gap-3">
                        <span className="text-level-avanzato mt-0.5 text-[16px]">✓</span>
                        <p className="font-body text-[13px] text-ink-700">{p}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── ESCO OVERVIEW ──── */}
            {qualitativeReport.profile_insights?.esco_profile_summary && (
              <div className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink p-8">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[22px]">🇪🇺</span>
                  <h2 className="font-display text-[20px] font-medium text-ink-900">Profilo ESCO Europeo</h2>
                </div>
                <p className="text-[12px] text-ink-400 mb-5">Framework European Skills, Competences, Qualifications and Occupations — v1.2 (maggio 2024)</p>

                <div className="bg-paper-100 border border-paper-200 rounded-md p-5 mb-6">
                  <p className="font-body text-[14px] text-ink-700 leading-relaxed">{qualitativeReport.profile_insights.esco_profile_summary}</p>
                </div>

                <h3 className="text-[12px] font-medium text-ink-600 uppercase tracking-eyebrow mb-3">Livello ESCO per Competenza</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {Object.entries(qualitativeReport.category_interpretations || {}).map(([category, interp]: [string, any]) => {
                    const escoLevel = interp.esco_mapping?.esco_level || interp.level || 'Base'
                    const escoGroup = interp.esco_mapping?.esco_group
                    const levelKeyMap: Record<string, string> = { 'Esperto': 'esperto', 'Avanzato': 'avanzato', 'Intermedio': 'intermedio', 'Base': 'base' }
                    const { className } = levelStyle[levelKeyMap[escoLevel] ?? 'base']
                    return (
                      <div key={category} className={`border rounded-md p-3 ${className}`}>
                        <p className="text-[12px] font-semibold mb-0.5">{categoryLabels[category]}</p>
                        <p className="text-[10px] font-bold uppercase tracking-eyebrow">{escoLevel}</p>
                        {escoGroup && <p className="text-[10px] mt-1 opacity-70 leading-snug">{escoGroup}</p>}
                      </div>
                    )
                  })}
                </div>
                <p className="text-[10px] text-ink-400 mt-4 text-right">© Commissione Europea — ESCO v1.2 | Competenze mappate da ValutoLab</p>
              </div>
            )}

            {/* ── INTERPRETAZIONE QUALITATIVA ──── */}
            <div className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink p-8">
              <h2 className="font-display text-[20px] font-medium text-ink-900 mb-6">Interpretazione Qualitativa</h2>
              <div className="space-y-5">
                {Object.entries(qualitativeReport.category_interpretations || {}).map(([category, interp]: [string, any]) => {
                  const escoMapping = interp.esco_mapping
                  const escoLevel = escoMapping?.esco_level || 'Base'
                  const levelKeyMap: Record<string, string> = { 'Esperto': 'esperto', 'Avanzato': 'avanzato', 'Intermedio': 'intermedio', 'Base': 'base' }
                  const { className: escoClass } = levelStyle[levelKeyMap[escoLevel] ?? 'base']
                  return (
                    <div key={category} className="border border-paper-200 rounded-md overflow-hidden">
                      {/* Header skill */}
                      <div className="flex items-center justify-between px-5 py-3 bg-paper-100 border-b border-paper-200">
                        <div className="flex items-center gap-3">
                          <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: skillColors[category] }} />
                          <h3 className="font-display text-[16px] font-medium text-ink-900">{categoryLabels[category]}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[14px] text-ink-900">{Number(interp.score).toFixed(2)}/5,0</span>
                          <LevelBadge score={interp.score} />
                          {escoMapping?.esco_level && (
                            <span className={`text-[10px] font-semibold uppercase tracking-eyebrow px-2 py-0.5 border rounded-sm ${escoClass}`}>
                              🇪🇺 {escoMapping.esco_level}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-5 space-y-4">
                        <p className="font-body text-[14px] text-ink-700 leading-relaxed">{interp.description}</p>

                        {interp.behavioral_notes && (
                          <div className="bg-paper-100 border-l-4 border-ink-900 pl-4 py-2">
                            <p className="text-[11px] font-semibold text-ink-600 uppercase tracking-eyebrow mb-1">Note Comportamentali</p>
                            <p className="text-[13px] text-ink-700">{interp.behavioral_notes}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {interp.strengths?.length > 0 && (
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-level-avanzato mb-2">✓ Punti di Forza</p>
                              <ul className="space-y-1">
                                {interp.strengths.map((s: string, idx: number) => (
                                  <li key={idx} className="text-[13px] text-ink-700 flex items-start gap-2">
                                    <span className="text-level-avanzato mt-0.5">•</span>{s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {interp.improvements?.length > 0 && (
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-sienna-600 mb-2">↗ Aree di Miglioramento</p>
                              <ul className="space-y-1">
                                {interp.improvements.map((s: string, idx: number) => (
                                  <li key={idx} className="text-[13px] text-ink-700 flex items-start gap-2">
                                    <span className="text-sienna-600 mt-0.5">•</span>{s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* ESCO skills tags */}
                        {escoMapping && (escoMapping.esco_skills_demonstrated?.length > 0 || escoMapping.esco_skills_to_develop?.length > 0) && (
                          <div className="bg-paper-100 border border-paper-200 rounded-md p-4">
                            <p className="text-[10px] font-bold text-ink-500 uppercase tracking-eyebrow mb-3">🇪🇺 Skill ESCO v1.2 — {escoMapping.esco_group}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {escoMapping.esco_skills_demonstrated?.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-semibold text-level-avanzato mb-1">✓ Dimostrate</p>
                                  <div className="flex flex-wrap gap-1">
                                    {escoMapping.esco_skills_demonstrated.map((sk: string, i: number) => (
                                      <span key={i} className="bg-green-50 text-level-avanzato border border-green-200 text-[10px] px-2 py-0.5 rounded-sm">{sk}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {escoMapping.esco_skills_to_develop?.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-semibold text-sienna-600 mb-1">↗ Da sviluppare</p>
                                  <div className="flex flex-wrap gap-1">
                                    {escoMapping.esco_skills_to_develop.map((sk: string, i: number) => (
                                      <span key={i} className="bg-sienna-50 text-sienna-700 border border-sienna-300 text-[10px] px-2 py-0.5 rounded-sm">{sk}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── PIANO DI SVILUPPO ──── */}
            <div className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink p-8">
              <h2 className="font-display text-[20px] font-medium text-ink-900 mb-6">Piano di Sviluppo Personalizzato</h2>

              {/* Timeline */}
              {qualitativeReport.development_plan?.timeline && (
                <div className="flex items-center gap-3 bg-paper-100 border border-paper-200 rounded-md px-5 py-3 mb-6">
                  <Calendar className="w-4 h-4 text-ink-500" />
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400">Timeline Consigliata</p>
                    <p className="text-[14px] font-medium text-ink-900">{qualitativeReport.development_plan.timeline}</p>
                  </div>
                </div>
              )}

              {/* Focus areas */}
              <div className="space-y-4 mb-6">
                {qualitativeReport.development_plan?.focus_areas?.map((area: any, idx: number) => {
                  const priorityStyle: Record<string, string> = {
                    'Alta':   'text-sienna-700 bg-sienna-50 border-sienna-300',
                    'Media':  'text-level-intermedio bg-amber-50 border-amber-200',
                    'Bassa':  'text-level-avanzato bg-green-50 border-green-200',
                  }
                  const pStyle = priorityStyle[area.priority] ?? priorityStyle['Media']
                  return (
                    <div key={idx} className="border border-paper-200 rounded-md overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-3 bg-paper-100 border-b border-paper-200">
                        <div>
                          <h3 className="font-display text-[16px] font-medium text-ink-900">{area.skill}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[12px] text-ink-500">Attuale: <span className="font-semibold text-ink-800">{area.current_score}/5,0</span></span>
                            <span className="text-ink-400">→</span>
                            <span className="text-[12px] text-ink-500">Obiettivo: <span className="font-semibold text-ink-800">{area.target_score}/5,0</span></span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-semibold uppercase tracking-eyebrow px-2 py-1 border rounded-sm ${pStyle}`}>
                          Priorità {area.priority}
                        </span>
                      </div>

                      <div className="p-5 space-y-4">
                        {area.gap_analysis && (
                          <div className="bg-paper-100 border-l-4 border-ink-400 pl-4 py-2">
                            <p className="text-[11px] font-semibold text-ink-500 uppercase tracking-eyebrow mb-1">Gap Analysis</p>
                            <p className="text-[13px] text-ink-700">{area.gap_analysis}</p>
                          </div>
                        )}

                        {area.esco_target && (
                          <div className="bg-paper-100 border-l-4 border-level-esperto pl-4 py-2">
                            <p className="text-[11px] font-semibold text-level-esperto uppercase tracking-eyebrow mb-1">🇪🇺 Obiettivo ESCO</p>
                            <p className="text-[13px] text-ink-700">{area.esco_target}</p>
                          </div>
                        )}

                        {area.actions?.length > 0 && (
                          <div>
                            <p className="text-[11px] font-semibold text-ink-600 uppercase tracking-eyebrow mb-2">Azioni Concrete</p>
                            <div className="space-y-2">
                              {area.actions.map((action: string, aIdx: number) => (
                                <div key={aIdx} className="flex items-start gap-3 bg-paper-100 border border-paper-200 rounded-md px-4 py-3">
                                  <span className="text-[12px] font-bold text-ink-400 w-4 flex-shrink-0 mt-0.5">{aIdx + 1}</span>
                                  <p className="text-[13px] text-ink-700">{action}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {area.resources?.length > 0 && (
                          <div>
                            <p className="text-[11px] font-semibold text-ink-600 uppercase tracking-eyebrow mb-2">Risorse Consigliate</p>
                            <div className="flex flex-wrap gap-1.5">
                              {area.resources.map((r: string, rIdx: number) => (
                                <span key={rIdx} className="bg-paper-200 text-ink-700 text-[11px] px-2.5 py-1 rounded-sm border border-paper-300">{r}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Quick wins */}
              {qualitativeReport.development_plan?.quick_wins?.length > 0 && (
                <div className="bg-paper-100 border border-paper-200 rounded-md p-6">
                  <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-4">⚡ Quick Wins</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {qualitativeReport.development_plan.quick_wins.map((win: string, idx: number) => (
                      <div key={idx} className="bg-paper-50 border border-paper-200 rounded-md p-4 flex items-start gap-2">
                        <span className="text-[12px] font-bold text-level-avanzato flex-shrink-0">{idx + 1}</span>
                        <p className="text-[13px] text-ink-700">{win}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── CONDIVISIONE ──────────────────────────────────────────────── */}
        {userId && (
          <ShareSection assessmentId={assessmentId} userId={userId} />
        )}

        {/* ── FOOTER NAV ───────────────────────────────────────────────── */}
        <div className="flex justify-center pb-6">
          <Button variant="secondary" onClick={() => router.push('/dashboard')} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Torna alla Dashboard
          </Button>
        </div>

      </main>
    </div>
  )
}
