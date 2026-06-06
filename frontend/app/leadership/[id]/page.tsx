'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { api } from '@/lib/api'
import { Wordmark } from '@/components/ui/Wordmark'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'

interface Question {
  id: string
  dimension: string
  domanda: string
  opzioni: { A: string; B: string; C: string; D: string }
  pesi: { A: number; B: number; C: number; D: number }
}

const dimensionNames: Record<string, string> = {
  visione_strategica:      'Visione Strategica',
  people_management:       'People Management',
  decisionalita:           'Decisionalità',
  change_management:       'Change Management',
  influenza_persuasione:   'Influenza & Persuasione',
  orientamento_risultati:  'Orientamento ai Risultati'
}

export default function LeadershipAssessmentPage() {
  const router = useRouter()
  const params = useParams()
  const assessmentId = params.id as string
  const { user: authUser } = useAuth()

  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const init = async () => {
      const user = authUser
      if (!user) { router.push('/login'); return }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.valutolab.com'
        const response = await fetch(`${apiUrl}/api/leadership/questions`)
        const data = await response.json()
        if (data.success) setQuestions(data.data.questions)

        const responsesRes = await api.leadership.responses.list(assessmentId)
        const savedResponses = responsesRes.responses || []
        if (savedResponses.length > 0) {
          const answersMap: Record<string, string> = {}
          savedResponses.forEach((r: any) => { answersMap[r.question_id] = r.answer })
          setAnswers(answersMap)
        }
        setLoading(false)
      } catch {
        alert('Errore nel caricamento delle domande')
      }
    }
    init()
  }, [router, assessmentId, authUser])

  const handleAnswer = async (answer: string) => {
    const currentQuestion = questions[currentQuestionIndex]
    const score = currentQuestion.pesi[answer as keyof typeof currentQuestion.pesi]
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }))

    setSaving(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.valutolab.com'
      await fetch(`${apiUrl}/api/leadership/${assessmentId}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: currentQuestion.id, dimension: currentQuestion.dimension, answer, score })
      })
    } catch { /* fire and forget */ }
    finally { setSaving(false) }
  }

  const handleComplete = async () => {
    if (!questions.every(q => answers[q.id])) {
      alert('Rispondi a tutte le domande prima di completare')
      return
    }
    setSaving(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.valutolab.com'
      const response = await fetch(`${apiUrl}/api/leadership/${assessmentId}/calculate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      if (data.success) router.push(`/leadership/${assessmentId}/results`)
      else throw new Error(data.message)
    } catch {
      alert("Errore nel completamento dell'assessment")
    } finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper-100">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-ink-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 font-body text-[14px] text-ink-500">Caricamento assessment…</p>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper-100">
        <p className="font-body text-[14px] text-sienna-600">Errore nel caricamento delle domande</p>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const currentAnswer = answers[currentQuestion.id]
  const answeredCount = Object.keys(answers).length
  const progress = Math.round((answeredCount / questions.length) * 100)
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  return (
    <div className="min-h-screen bg-paper-100 font-body text-ink-900">

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className="bg-paper-50 border-b border-paper-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Wordmark size={18} />
              <span className="text-[10px] font-semibold uppercase tracking-eyebrow text-level-intermedio bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-sm">
                Leadership Deep Dive
              </span>
            </div>
            <span className="text-[12px] text-ink-400">
              {answeredCount}/{questions.length} completate
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="max-w-4xl mx-auto px-6 pb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-ink-500">Domanda {currentQuestionIndex + 1} di {questions.length}</span>
            <span className="text-[11px] font-medium text-level-intermedio">{progress}% completato</span>
          </div>
          <div className="w-full bg-paper-200 rounded-sm h-1.5">
            <div className="bg-ink-900 h-1.5 rounded-sm transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>

      {/* ── MAIN ───────────────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-4">

        {/* Question card */}
        <div className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink p-8">
          {/* Dimension badge */}
          <div className="mb-5">
            <span className="text-[10px] font-semibold uppercase tracking-eyebrow px-2.5 py-1 rounded-sm border text-level-intermedio bg-amber-50 border-amber-200">
              {dimensionNames[currentQuestion.dimension]}
            </span>
          </div>

          <h2 className="font-display text-[22px] text-ink-900 mb-8 leading-snug">
            {currentQuestion.domanda}
          </h2>

          <div className="space-y-3">
            {(['A', 'B', 'C', 'D'] as const).map(option => (
              <button key={option} onClick={() => handleAnswer(option)}
                className={`w-full text-left p-5 rounded-md border-2 transition-all ${
                  currentAnswer === option
                    ? 'border-ink-900 bg-ink-900 text-paper-50'
                    : 'border-paper-200 bg-paper-50 hover:border-ink-400 hover:bg-paper-100'
                }`}>
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-7 h-7 rounded-sm flex items-center justify-center text-[12px] font-bold ${
                    currentAnswer === option ? 'bg-ink-700 text-paper-50' : 'bg-paper-200 text-ink-600'
                  }`}>
                    {option}
                  </div>
                  <p className={`text-[14px] leading-relaxed ${currentAnswer === option ? 'text-paper-100' : 'text-ink-700'}`}>
                    {currentQuestion.opzioni[option]}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {saving && (
            <p className="mt-4 text-center text-[12px] text-ink-400">
              <span className="inline-block w-3 h-3 border border-ink-400 border-t-transparent rounded-full animate-spin mr-1.5 align-middle" />
              Salvataggio…
            </p>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button variant="secondary" onClick={() => setCurrentQuestionIndex(i => i - 1)}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Precedente
          </Button>

          {!isLastQuestion ? (
            <Button variant="primary" onClick={() => setCurrentQuestionIndex(i => i + 1)}
              disabled={!currentAnswer}
              className="flex items-center gap-2">
              Successiva <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button variant="primary" onClick={handleComplete}
              disabled={!currentAnswer || saving || answeredCount !== questions.length}
              className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {saving ? 'Elaborazione…' : 'Completa Assessment'}
            </Button>
          )}
        </div>

        {/* Progress grid */}
        <div className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink p-5">
          <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-3">Progresso Domande</p>
          <div className="grid grid-cols-10 gap-1.5">
            {questions.map((q, index) => (
              <button key={q.id} onClick={() => setCurrentQuestionIndex(index)}
                className={`aspect-square rounded-sm text-[11px] font-semibold transition ${
                  answers[q.id]
                    ? 'bg-ink-900 text-paper-50'
                    : index === currentQuestionIndex
                    ? 'bg-paper-200 text-ink-900 ring-2 ring-ink-900 ring-offset-1'
                    : 'bg-paper-200 text-ink-500 hover:bg-paper-300'
                }`}>
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
