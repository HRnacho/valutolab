'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { Wordmark } from '@/components/ui/Wordmark'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Printer, RefreshCw, Zap, Users, Target, MessageSquare, Trophy, Award } from 'lucide-react'

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

const dimensionIcons: Record<string, React.ReactNode> = {
  visione_strategica:     <Target      className="w-5 h-5 text-sienna-600" />,
  people_management:      <Users       className="w-5 h-5 text-sienna-600" />,
  decisionalita:          <Zap         className="w-5 h-5 text-sienna-600" />,
  change_management:      <RefreshCw   className="w-5 h-5 text-sienna-600" />,
  influenza_persuasione:  <MessageSquare className="w-5 h-5 text-sienna-600" />,
  orientamento_risultati: <Trophy      className="w-5 h-5 text-sienna-600" />,
}

const parseMd = (text: string) =>
  text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

export default function LeadershipResultsPage() {
  const router = useRouter()
  const params = useParams()
  const assessmentId = params.id as string
  const { user: authUser } = useAuth()

  const [loading, setLoading] = useState(true)
  const [assessment, setAssessment] = useState<any>(null)
  const [results, setResults] = useState<DimensionResult[]>([])
  const [aiReport, setAIReport] = useState<AIReport | null>(null)

  useEffect(() => {
    const init = async () => {
      if (!authUser) { router.push('/login'); return }
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.valutolab.com'
        const response = await fetch(`${apiUrl}/api/leadership/${assessmentId}/results`)
        const data = await response.json()
        if (data.success) {
          setAssessment(data.data.assessment)
          setResults(data.data.results)
          setAIReport(data.data.aiReport)
        } else throw new Error(data.message)
        setLoading(false)
      } catch {
        alert('Errore nel caricamento dei risultati')
        router.push('/dashboard')
      }
    }
    init()
  }, [router, assessmentId, authUser])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper-100">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-ink-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 font-body text-[14px] text-ink-500">Caricamento risultati…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper-100 font-body text-ink-900">

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className="bg-paper-50 border-b border-paper-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Wordmark size={20} />
              <span className="text-[10px] font-semibold uppercase tracking-eyebrow text-level-intermedio bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-sm">
                Leadership Deep Dive
              </span>
            </div>
            <button onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1.5 text-[13px] text-ink-500 hover:text-ink-900 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 lg:px-8 py-8 space-y-5">

        {/* ── HERO SCORE ─────────────────────────────────────────────── */}
        <div className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink p-8">
          <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-1">Leadership Deep Dive</p>
          <h1 className="font-display text-display-2 text-ink-900 mb-8">Risultati</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-ink-900 rounded-md p-6 flex items-center gap-5">
              <div className="w-16 h-16 rounded-md bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <Award className="w-8 h-8 text-sienna-600" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-1">Punteggio</p>
                <p className="font-display text-[36px] leading-none text-paper-50">
                  {Number(assessment?.total_score).toFixed(1)}<span className="text-[18px] text-ink-400">/5,0</span>
                </p>
              </div>
            </div>

            <div className="bg-ink-900 rounded-md p-6">
              <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-2">Completato il</p>
              <p className="font-display text-[20px] text-paper-50">
                {new Date(assessment?.completed_at || '').toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            <div className="bg-ink-900 rounded-md p-6">
              <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-2">Dimensioni Valutate</p>
              <p className="font-display text-[48px] leading-none text-paper-50">
                {results.length}<span className="text-[24px] text-ink-400">/6</span>
              </p>
            </div>
          </div>
        </div>

        {/* ── STILE DI LEADERSHIP ────────────────────────────────────── */}
        {aiReport && (
          <div className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink p-8">
            <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-1">Analisi AI</p>
            <h2 className="font-display text-display-3 text-ink-900 mb-6">Il Tuo Stile di Leadership</h2>

            <div className="bg-ink-900 rounded-md p-6 mb-4">
              <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-2">Stile Identificato</p>
              <p className="font-display text-[22px] text-amber-400 mb-4">{aiReport.leadership_style}</p>
              <p className="font-body text-[14px] text-paper-100 leading-relaxed whitespace-pre-line">{aiReport.style_description}</p>
            </div>
          </div>
        )}

        {/* ── PUNTEGGI PER DIMENSIONE ────────────────────────────────── */}
        <div className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink p-8">
          <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-1">Dettaglio</p>
          <h2 className="font-display text-display-3 text-ink-900 mb-6">Punteggi per Dimensione</h2>

          <div className="space-y-5">
            {results.map(result => {
              const score = parseFloat(result.score)
              const pct = (score / 5) * 100
              return (
                <div key={result.dimension}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="flex-shrink-0">{dimensionIcons[result.dimension]}</span>
                      <span className="font-medium text-[14px] text-ink-900">{result.dimension_name}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-[20px] text-level-intermedio">{Number(score).toFixed(1)}</span>
                      <span className="text-[12px] text-ink-400">/5,0</span>
                    </div>
                  </div>
                  <div className="w-full bg-paper-200 rounded-sm h-1.5">
                    <div className="bg-ink-900 h-1.5 rounded-sm transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── FORZA & SVILUPPO ───────────────────────────────────────── */}
        {aiReport && (
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink p-6">
              <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-1">Analisi AI</p>
              <h3 className="font-display text-[20px] text-ink-900 mb-4">Punti di Forza</h3>
              <div className="bg-paper-100 border border-paper-200 rounded-md p-5">
                <p className="font-body text-[14px] text-ink-700 leading-relaxed whitespace-pre-line" dangerouslySetInnerHTML={{ __html: parseMd(aiReport.key_strengths) }} />
              </div>
            </div>
            <div className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink p-6">
              <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-1">Analisi AI</p>
              <h3 className="font-display text-[20px] text-ink-900 mb-4">Aree di Sviluppo</h3>
              <div className="bg-paper-100 border border-paper-200 rounded-md p-5">
                <p className="font-body text-[14px] text-ink-700 leading-relaxed whitespace-pre-line" dangerouslySetInnerHTML={{ __html: parseMd(aiReport.development_areas) }} />
              </div>
            </div>
          </div>
        )}

        {/* ── PIANO D'AZIONE ─────────────────────────────────────────── */}
        {aiReport?.action_plan && (
          <div className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink p-8">
            <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-1">Piano Personalizzato</p>
            <h2 className="font-display text-display-3 text-ink-900 mb-6">Piano d'Azione</h2>

            <div className="grid md:grid-cols-2 gap-5 mb-5">
              {/* Azioni immediate */}
              <div>
                <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-3">Azioni Immediate (1 mese)</p>
                <div className="space-y-2">
                  {aiReport.action_plan.immediate_actions.map((action, idx) => (
                    <div key={idx} className="bg-paper-100 border border-paper-200 rounded-md p-4 flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-ink-900 text-paper-50 rounded-sm flex items-center justify-center text-[11px] font-bold">
                        {idx + 1}
                      </span>
                      <p className="font-body text-[13px] text-ink-700">{action}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Obiettivi medio termine */}
              <div>
                <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-3">Obiettivi Medio Termine (3–6 mesi)</p>
                <div className="space-y-2">
                  {aiReport.action_plan.medium_term_goals.map((goal, idx) => (
                    <div key={idx} className="bg-paper-100 border border-paper-200 rounded-md p-4 flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-level-intermedio text-paper-50 rounded-sm flex items-center justify-center text-[11px] font-bold">
                        {idx + 1}
                      </span>
                      <p className="font-body text-[13px] text-ink-700">{goal}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Risorse */}
            <div>
              <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-3">Risorse Consigliate</p>
              <div className="space-y-2">
                {aiReport.action_plan.recommended_resources.map((resource, idx) => (
                  <div key={idx} className="bg-paper-100 border border-paper-200 rounded-md p-4 flex items-center gap-3">
                    <span className="text-[16px]">📖</span>
                    <p className="font-body text-[13px] text-ink-700">{resource}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ACTIONS ────────────────────────────────────────────────── */}
        <div className="flex gap-3">
          <Button variant="primary" className="flex-1 justify-center" onClick={() => router.push('/dashboard')}>
            Torna alla Dashboard
          </Button>
          <Button variant="secondary" className="flex items-center gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Stampa
          </Button>
        </div>
      </main>
    </div>
  )
}
