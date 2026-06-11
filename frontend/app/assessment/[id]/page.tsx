'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { api } from '@/lib/api'
import { getQuestionsForSet, Question } from '@/data/questions'
import SituationalQuestion from '@/components/SituationalQuestion'
import { Wordmark } from '@/components/ui/Wordmark'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'

interface SituationalQuestionData {
  id: string
  primary_skill: string
  situation: string
  display_order: number
  options: Array<{
    label: string
    text: string
    skill_weights: Record<string, number>
  }>
}

const likertLabels: Record<number, string> = {
  1: "Per niente d'accordo",
  2: "Poco d'accordo",
  3: "Mediamente d'accordo",
  4: "Abbastanza d'accordo",
  5: "Pienamente d'accordo",
}

export default function AssessmentPage() {
  const router = useRouter()
  const params = useParams()
  const assessmentId = params.id as string
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [questionSet, setQuestionSet] = useState<'A' | 'B' | 'C'>('A')

  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [profilingAnswers, setProfilingAnswers] = useState<Record<string, string>>({})
  const [textareaValue, setTextareaValue] = useState('')

  const [showSituational, setShowSituational] = useState(false)
  const [situationalQuestions, setSituationalQuestions] = useState<SituationalQuestionData[]>([])
  const [currentSituationalIndex, setCurrentSituationalIndex] = useState(0)
  const [situationalAnswers, setSituationalAnswers] = useState<Record<string, string>>({})
  const [loadingSituational, setLoadingSituational] = useState(false)

  const [assessmentType, setAssessmentType] = useState<'base' | 'focus'>('base')
  const [targetSkills, setTargetSkills] = useState<string[]>([])

  const filteredQuestions = useMemo<Question[]>(() => {
    if (assessmentType === 'focus' && targetSkills.length > 0) {
      const all = [...getQuestionsForSet('A'), ...getQuestionsForSet('B'), ...getQuestionsForSet('C')]
      return all.filter(q => q.category !== 'profiling' && targetSkills.includes(q.category))
    }
    return getQuestionsForSet(questionSet).filter(q => {
      if (!q.conditionalKey) return true
      return profilingAnswers[q.conditionalKey] === q.conditionalValue
    })
  }, [profilingAnswers, questionSet, assessmentType, targetSkills])

  const likertQuestions = useMemo(() => {
    return filteredQuestions.filter(q => q.category !== 'profiling')
  }, [filteredQuestions])

  useEffect(() => {
    const checkAssessment = async () => {
      if (!user) { router.push('/login'); return }
      const assessmentRes = await api.assessments.get(assessmentId)
      const assessment = assessmentRes.assessment
      if (!assessment) { router.push('/dashboard'); return }
      if (assessment.status === 'completed') { router.push(`/dashboard/results/${assessmentId}`); return }
      if (assessment.question_set && ['A', 'B', 'C'].includes(assessment.question_set)) {
        setQuestionSet(assessment.question_set as 'A' | 'B' | 'C')
      }
      if (assessment.assessment_type === 'focus' && Array.isArray(assessment.target_skills)) {
        setAssessmentType('focus')
        setTargetSkills(assessment.target_skills)
      }
      const responsesRes = await api.assessments.responses.list(assessmentId)
      const existingAnswers = responsesRes.responses || []
      if (existingAnswers.length > 0) {
        const numericMap: Record<string, number> = {}
        const textMap: Record<string, string> = {}
        existingAnswers.forEach((ans: any) => {
          if (ans.answer_text != null) textMap[ans.question_id] = ans.answer_text
          else if (ans.answer_value != null) numericMap[ans.question_id] = ans.answer_value
        })
        setAnswers(numericMap)
        setProfilingAnswers(textMap)
      }
      setLoading(false)
    }
    checkAssessment()
  }, [assessmentId, router])

  useEffect(() => {
    const q = filteredQuestions[currentQuestionIndex]
    if (q?.type === 'textarea') setTextareaValue(profilingAnswers[String(q.id)] ?? '')
  }, [currentQuestionIndex, filteredQuestions])

  const saveProfilingResponse = (questionId: string, text: string) => {
    api.assessments.responses.upsert(assessmentId, {
      question_id: questionId, answer_text: text, answer_value: null, skill_category: 'profiling',
    }).catch(err => console.warn('Profiling save failed (non-blocking):', err))
  }

  const handleAnswer = async (value: number) => {
    const question = filteredQuestions[currentQuestionIndex]
    setAnswers(prev => ({ ...prev, [question.id]: value }))
    if (currentQuestionIndex < filteredQuestions.length - 1) setCurrentQuestionIndex(prev => prev + 1)
    api.assessments.responses.upsert(assessmentId, {
      question_id: String(question.id), answer_value: value, skill_category: question.category,
    }).catch(err => console.warn('Likert save failed:', err))
  }

  const handleSingleChoice = (option: string) => {
    const question = filteredQuestions[currentQuestionIndex]
    const qid = String(question.id)
    setProfilingAnswers(prev => ({ ...prev, [qid]: option }))
    if (currentQuestionIndex < filteredQuestions.length - 1) setCurrentQuestionIndex(prev => prev + 1)
    saveProfilingResponse(qid, option)
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex(prev => prev - 1)
  }

  const handleNext = () => {
    const question = filteredQuestions[currentQuestionIndex]
    if (question.type === 'textarea') {
      const qid = String(question.id)
      setProfilingAnswers(prev => ({ ...prev, [qid]: textareaValue }))
      saveProfilingResponse(qid, textareaValue)
    }
    if (currentQuestionIndex < filteredQuestions.length - 1) setCurrentQuestionIndex(prev => prev + 1)
  }

  const handleCompleteLikert = async () => {
    const currentQ = filteredQuestions[currentQuestionIndex]
    if (currentQ?.type === 'textarea') {
      const qid = String(currentQ.id)
      setProfilingAnswers(prev => ({ ...prev, [qid]: textareaValue }))
      saveProfilingResponse(qid, textareaValue)
    }
    const unanswered = likertQuestions.filter(q => answers[q.id] == null)
    if (unanswered.length > 0) {
      alert(`Per favore rispondi a tutte le domande. Mancano ${unanswered.length} risposte.`)
      const firstIdx = filteredQuestions.findIndex(q => q.id === unanswered[0].id)
      setCurrentQuestionIndex(firstIdx)
      return
    }
    await loadSituationalQuestions()
    setShowSituational(true)
  }

  const loadSituationalQuestions = async () => {
    setLoadingSituational(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.valutolab.com'
      if (assessmentType === 'focus' && targetSkills.length > 0) {
        const [resA, resB, resC] = await Promise.all([
          fetch(`${apiUrl}/api/situational-questions?set=A`).then(r => r.json()),
          fetch(`${apiUrl}/api/situational-questions?set=B`).then(r => r.json()),
          fetch(`${apiUrl}/api/situational-questions?set=C`).then(r => r.json()),
        ])
        const all = [...(resA.questions || []), ...(resB.questions || []), ...(resC.questions || [])]
          .filter((q: SituationalQuestionData) => targetSkills.includes(q.primary_skill))
        setSituationalQuestions(all)
      } else {
        const response = await fetch(`${apiUrl}/api/situational-questions?set=${questionSet}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.questions) setSituationalQuestions(data.questions)
        }
      }
    } catch (error) {
      console.error('Error loading situational questions:', error)
    } finally {
      setLoadingSituational(false)
    }
  }

  const handleSituationalAnswer = (option: string) => {
    const question = situationalQuestions[currentSituationalIndex]
    setSituationalAnswers(prev => ({ ...prev, [question.id]: option }))
  }

  const handleSituationalNext = () => {
    const currentQuestion = situationalQuestions[currentSituationalIndex]
    if (!situationalAnswers[currentQuestion.id]) { alert('Per favore seleziona una risposta prima di continuare.'); return }
    if (currentSituationalIndex < situationalQuestions.length - 1) setCurrentSituationalIndex(prev => prev + 1)
  }

  const handleSituationalPrevious = () => {
    if (currentSituationalIndex > 0) setCurrentSituationalIndex(prev => prev - 1)
  }

  const handleCompleteAssessment = async () => {
    const unansweredSituational = situationalQuestions.filter(q => !situationalAnswers[q.id])
    if (unansweredSituational.length > 0) {
      alert(`Per favore rispondi a tutte le domande situazionali. Mancano ${unansweredSituational.length} risposte.`)
      return
    }
    setSaving(true)
    try {
      if (!user) return
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.valutolab.com'
      const responsesPayload = situationalQuestions.map(q => ({
        questionId: q.id, selectedOption: situationalAnswers[q.id],
      }))
      const token = typeof window !== 'undefined' ? localStorage.getItem('jwt_access_token') : null
      const responseSituational = await fetch(`${apiUrl}/api/situational-responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ assessmentId, userId: user.id, responses: responsesPayload }),
      })
      if (!responseSituational.ok) throw new Error('Failed to save situational responses')

      const userContext = {
        employment_status: profilingAnswers['profiling_1'] ?? null,
        years_at_company: profilingAnswers['profiling_2'] ?? null,
        industry: profilingAnswers['profiling_3'] ?? null,
        assessment_motivation: profilingAnswers['profiling_4'] ?? null,
        development_goals: profilingAnswers['profiling_5'] ?? null,
      }
      api.assessments.saveUserContext(assessmentId, userContext)
        .catch(err => console.warn('saveUserContext failed (non-blocking):', err))

      const categoryScores: Record<string, { total: number; count: number }> = {}
      likertQuestions.forEach(question => {
        const answer = answers[question.id]
        if (answer !== undefined) {
          if (!categoryScores[question.category]) categoryScores[question.category] = { total: 0, count: 0 }
          categoryScores[question.category].total += answer
          categoryScores[question.category].count += 1
        }
      })
      const results = Object.entries(categoryScores).map(([category, data]) => ({
        skill_category: category, score: parseFloat((data.total / data.count).toFixed(2)),
        percentile: null, strengths: [], improvements: [],
      }))
      await api.assessments.results.upsert(assessmentId, results)
      const totalScore = results.reduce((sum, r) => sum + r.score, 0) / results.length
      await api.assessments.complete(assessmentId, parseFloat(totalScore.toFixed(2)))
      router.push(`/dashboard/results/${assessmentId}`)
    } catch (error) {
      console.error('Error completing assessment:', error)
      alert('Errore nel salvataggio. Riprova.')
    } finally {
      setSaving(false)
    }
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading || (showSituational && loadingSituational)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper-100">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-ink-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 font-body text-ink-500 text-[14px]">
            {loadingSituational ? 'Caricamento scenari situazionali…' : 'Caricamento assessment…'}
          </p>
        </div>
      </div>
    )
  }

  // ── FASE SITUAZIONALE ───────────────────────────────────────────────────────
  if (showSituational) {
    if (situationalQuestions.length === 0) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-paper-100">
          <p className="font-body text-[14px] text-ink-500">Errore nel caricamento delle domande situazionali.</p>
        </div>
      )
    }
    const currentQuestion = situationalQuestions[currentSituationalIndex]
    const sitProgress = ((currentSituationalIndex + 1) / situationalQuestions.length) * 100

    return (
      <div className="min-h-screen bg-paper-100 font-body text-ink-900">
        {/* Header */}
        <header className="bg-paper-50 border-b border-paper-200 sticky top-0 z-40">
          <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
            <Wordmark size={18} />
            <span className="text-[12px] text-ink-500 font-medium">Fase situazionale</span>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-[12px] text-ink-500 mb-1.5">
              <span>Scenario {currentSituationalIndex + 1} di {situationalQuestions.length}</span>
              <span>{Math.round(sitProgress)}%</span>
            </div>
            <div className="w-full bg-paper-200 rounded-sm h-1.5">
              <div className="bg-ink-900 h-1.5 rounded-sm transition-all" style={{ width: `${sitProgress}%` }} />
            </div>
          </div>

          {/* Question card */}
          <SituationalQuestion
            situation={currentQuestion.situation}
            options={currentQuestion.options}
            selectedOption={situationalAnswers[currentQuestion.id] || null}
            onSelect={handleSituationalAnswer}
            questionNumber={currentSituationalIndex + 1}
            totalQuestions={situationalQuestions.length}
          />

          {/* Nav */}
          <div className="flex justify-between items-center">
            <Button variant="secondary" onClick={handleSituationalPrevious} disabled={currentSituationalIndex === 0}
              className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Precedente
            </Button>
            {currentSituationalIndex < situationalQuestions.length - 1 ? (
              <Button variant="primary" onClick={handleSituationalNext}
                disabled={!situationalAnswers[currentQuestion.id]}
                className="flex items-center gap-2">
                Successiva <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button variant="accent" onClick={handleCompleteAssessment}
                disabled={saving || !situationalAnswers[currentQuestion.id]}
                className="flex items-center gap-2">
                {saving ? 'Salvataggio…' : <><CheckCircle className="w-4 h-4" /> Completa Assessment</>}
              </Button>
            )}
          </div>
        </main>
      </div>
    )
  }

  // ── FASE LIKERT / PROFILING ─────────────────────────────────────────────────
  const currentQuestion = filteredQuestions[currentQuestionIndex]
  if (!currentQuestion) return null

  const isLastQuestion = currentQuestionIndex === filteredQuestions.length - 1
  const isProfiling = currentQuestion.category === 'profiling'
  const answeredLikert = Object.keys(answers).length
  const progress = likertQuestions.length > 0 ? (answeredLikert / likertQuestions.length) * 100 : 0

  // Numero di domanda "visibile" (solo Likert, non profiling)
  const likertIndex = likertQuestions.findIndex(q => q.id === currentQuestion.id)

  return (
    <div className="min-h-screen bg-paper-100 font-body text-ink-900">
      {/* Header */}
      <header className="bg-paper-50 border-b border-paper-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Wordmark size={18} />
          <span className="text-[12px] text-ink-500 font-medium">
            {assessmentType === 'focus'
              ? `Focus — Domanda ${likertIndex + 1} / ${likertQuestions.length}`
              : isProfiling ? 'Profilazione' : `Domanda ${likertIndex + 1} / ${likertQuestions.length}`}
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Progress bar — solo Likert */}
        {!isProfiling && (
          <div>
            <div className="flex justify-between text-[12px] text-ink-500 mb-1.5">
              <span>Progresso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-paper-200 rounded-sm h-1.5">
              <div className="bg-ink-900 h-1.5 rounded-sm transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Question card */}
        <div className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink p-8">
          {isProfiling && (
            <span className="inline-block mb-4 text-[10px] font-semibold uppercase tracking-eyebrow text-sienna-600 bg-sienna-50 border border-sienna-300 px-3 py-1 rounded-sm">
              Domanda di profilazione
            </span>
          )}
          <h2 className="font-display text-[20px] font-medium text-ink-900 mb-8 leading-snug">
            {currentQuestion.question}
          </h2>

          {/* ── LIKERT ─────────────────────────────────────────────────────── */}
          {currentQuestion.type === 'likert' && (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(value => (
                <button
                  key={value}
                  onClick={() => handleAnswer(value)}
                  className={`w-full px-5 py-3.5 rounded-sm border text-left transition-all font-body text-[14px] ${
                    answers[currentQuestion.id] === value
                      ? 'border-ink-900 bg-ink-900 text-paper-50 font-medium'
                      : 'border-paper-200 bg-paper-50 text-ink-800 hover:border-ink-500 hover:bg-paper-100'
                  }`}
                >
                  <span className="text-[11px] font-bold mr-3 opacity-50">{value}</span>
                  {likertLabels[value]}
                </button>
              ))}
            </div>
          )}

          {/* ── SINGLE CHOICE ──────────────────────────────────────────────── */}
          {currentQuestion.type === 'single_choice' && (
            <div className="space-y-2">
              {currentQuestion.options?.map(option => (
                <button
                  key={option}
                  onClick={() => handleSingleChoice(option)}
                  className={`w-full px-5 py-3.5 rounded-sm border text-left transition-all font-body text-[14px] ${
                    profilingAnswers[String(currentQuestion.id)] === option
                      ? 'border-sienna-600 bg-sienna-50 text-sienna-900 font-medium'
                      : 'border-paper-200 bg-paper-50 text-ink-800 hover:border-sienna-400 hover:bg-paper-100'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {/* ── TEXTAREA ───────────────────────────────────────────────────── */}
          {currentQuestion.type === 'textarea' && (
            <div className="space-y-2">
              <textarea
                rows={5}
                value={textareaValue}
                onChange={e => setTextareaValue(e.target.value)}
                placeholder="Scrivi qui la tua risposta (facoltativo)…"
                className="w-full px-4 py-3 rounded-sm border border-paper-200 bg-paper-100 focus:border-ink-600 focus:outline-none resize-none font-body text-[14px] text-ink-900 placeholder-ink-400"
              />
              <p className="text-[11px] text-ink-400">Campo facoltativo — puoi lasciarlo vuoto</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button variant="secondary" onClick={handlePrevious} disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Precedente
          </Button>

          {isLastQuestion ? (
            <Button variant="accent" onClick={handleCompleteLikert} className="flex items-center gap-2">
              Continua <ArrowRight className="w-4 h-4" />
            </Button>
          ) : currentQuestion.type === 'textarea' ? (
            <Button variant="primary" onClick={handleNext} className="flex items-center gap-2">
              Successiva <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            // Likert e single_choice avanzano automaticamente al click — bottone disabilitato come navigazione manuale
            <Button variant="ghost" onClick={handleNext}
              disabled={currentQuestion.type === 'likert' && answers[currentQuestion.id] == null}
              className="flex items-center gap-2 text-ink-600">
              Successiva <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}
