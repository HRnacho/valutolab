'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { api } from '@/lib/api'
import { questions, Question } from '@/data/questions'
import SituationalQuestion from '@/components/SituationalQuestion'

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

export default function AssessmentPage() {
  const router = useRouter()
  const params = useParams()
  const assessmentId = params.id as string
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  // Risposte Likert (numerico 1-5)
  const [answers, setAnswers] = useState<Record<string, number>>({})

  // Risposte profiling (testo)
  const [profilingAnswers, setProfilingAnswers] = useState<Record<string, string>>({})
  // Testo corrente per textarea in editing
  const [textareaValue, setTextareaValue] = useState('')

  // Situational
  const [showSituational, setShowSituational] = useState(false)
  const [situationalQuestions, setSituationalQuestions] = useState<SituationalQuestionData[]>([])
  const [currentSituationalIndex, setCurrentSituationalIndex] = useState(0)
  const [situationalAnswers, setSituationalAnswers] = useState<Record<string, string>>({})
  const [loadingSituational, setLoadingSituational] = useState(false)

  // Lista domande filtrata (considera condizionali)
  const filteredQuestions = useMemo<Question[]>(() => {
    return questions.filter(q => {
      if (!q.conditionalKey) return true
      return profilingAnswers[q.conditionalKey] === q.conditionalValue
    })
  }, [profilingAnswers])

  // Lista domande SOLO Likert (per scoring e completeness check)
  const likertQuestions = useMemo(() => {
    return filteredQuestions.filter(q => q.category !== 'profiling')
  }, [filteredQuestions])

  useEffect(() => {
    const checkAssessment = async () => {
      if (!user) {
        router.push('/login')
        return
      }

      const assessmentRes = await api.assessments.get(assessmentId)
      const assessment = assessmentRes.assessment
      if (!assessment) { router.push('/dashboard'); return }
      if (assessment.status === 'completed') { router.push(`/dashboard/results/${assessmentId}`); return }

      const responsesRes = await api.assessments.responses.list(assessmentId)
      const existingAnswers = responsesRes.responses || []

      if (existingAnswers.length > 0) {
        const numericMap: Record<string, number> = {}
        const textMap: Record<string, string> = {}
        existingAnswers.forEach((ans: any) => {
          if (ans.answer_text != null) {
            textMap[ans.question_id] = ans.answer_text
          } else if (ans.answer_value != null) {
            numericMap[ans.question_id] = ans.answer_value
          }
        })
        setAnswers(numericMap)
        setProfilingAnswers(textMap)
      }

      setLoading(false)
    }
    checkAssessment()
  }, [assessmentId, router])

  // Sync textarea value when navigating to a textarea question
  useEffect(() => {
    const q = filteredQuestions[currentQuestionIndex]
    if (q?.type === 'textarea') {
      setTextareaValue(profilingAnswers[String(q.id)] ?? '')
    }
  }, [currentQuestionIndex, filteredQuestions])

  const saveProfilingResponse = async (questionId: string, text: string) => {
    await api.assessments.responses.upsert(assessmentId, {
      question_id: questionId,
      answer_text: text,
      answer_value: null,
      skill_category: 'profiling',
    })
  }

  // ── Likert answer ───────────────────────────────────────────────────────────
  const handleAnswer = async (value: number) => {
    const question = filteredQuestions[currentQuestionIndex]
    const newAnswers = { ...answers, [question.id]: value }
    setAnswers(newAnswers)
    await api.assessments.responses.upsert(assessmentId, {
      question_id: String(question.id),
      answer_value: value,
      skill_category: question.category,
    })
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  // ── Single-choice profiling answer ─────────────────────────────────────────
  const handleSingleChoice = async (option: string) => {
    const question = filteredQuestions[currentQuestionIndex]
    const qid = String(question.id)
    setProfilingAnswers(prev => ({ ...prev, [qid]: option }))
    await saveProfilingResponse(qid, option)
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex(currentQuestionIndex - 1)
  }

  const handleNext = async () => {
    const question = filteredQuestions[currentQuestionIndex]
    if (question.type === 'textarea') {
      const qid = String(question.id)
      setProfilingAnswers(prev => ({ ...prev, [qid]: textareaValue }))
      await saveProfilingResponse(qid, textareaValue)
    }
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  // ── Complete Likert phase ───────────────────────────────────────────────────
  const handleCompleteLikert = async () => {
    // Save textarea if we are currently on one
    const currentQ = filteredQuestions[currentQuestionIndex]
    if (currentQ?.type === 'textarea') {
      const qid = String(currentQ.id)
      setProfilingAnswers(prev => ({ ...prev, [qid]: textareaValue }))
      await saveProfilingResponse(qid, textareaValue)
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://valutolab-backend.onrender.com'
      const response = await fetch(`${apiUrl}/api/situational-questions`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.questions) setSituationalQuestions(data.questions)
      }
    } catch (error) {
      console.error('Error loading situational questions:', error)
    } finally {
      setLoadingSituational(false)
    }
  }

  // ── Situational ─────────────────────────────────────────────────────────────
  const handleSituationalAnswer = (option: string) => {
    const question = situationalQuestions[currentSituationalIndex]
    setSituationalAnswers({ ...situationalAnswers, [question.id]: option })
  }

  const handleSituationalNext = () => {
    const currentQuestion = situationalQuestions[currentSituationalIndex]
    if (!situationalAnswers[currentQuestion.id]) {
      alert('Per favore seleziona una risposta prima di continuare.')
      return
    }
    if (currentSituationalIndex < situationalQuestions.length - 1) {
      setCurrentSituationalIndex(currentSituationalIndex + 1)
    }
  }

  const handleSituationalPrevious = () => {
    if (currentSituationalIndex > 0) setCurrentSituationalIndex(currentSituationalIndex - 1)
  }

  // ── Complete assessment ─────────────────────────────────────────────────────
  const handleCompleteAssessment = async () => {
    const unansweredSituational = situationalQuestions.filter(q => !situationalAnswers[q.id])
    if (unansweredSituational.length > 0) {
      alert(`Per favore rispondi a tutte le domande situazionali. Mancano ${unansweredSituational.length} risposte.`)
      return
    }

    setSaving(true)
    try {
      if (!user) return
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://valutolab-backend.onrender.com'

      // Save situational responses
      const responsesPayload = situationalQuestions.map(q => ({
        questionId: q.id,
        selectedOption: situationalAnswers[q.id],
      }))
      const responseSituational = await fetch(`${apiUrl}/api/situational-responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId, userId: user.id, responses: responsesPayload }),
      })
      if (!responseSituational.ok) throw new Error('Failed to save situational responses')

      // Build user_context from profiling answers and save
      const userContext = {
        employment_status: profilingAnswers['profiling_1'] ?? null,
        years_at_company: profilingAnswers['profiling_2'] ?? null,
        industry: profilingAnswers['profiling_3'] ?? null,
        assessment_motivation: profilingAnswers['profiling_4'] ?? null,
        development_goals: profilingAnswers['profiling_5'] ?? null,
      }
      await api.assessments.saveUserContext(assessmentId, userContext)

      // Calculate Likert category scores (excludes profiling)
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
        skill_category: category,
        score: parseFloat((data.total / data.count).toFixed(2)),
        percentile: null,
        strengths: [],
        improvements: [],
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

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento assessment...</p>
        </div>
      </div>
    )
  }

  if (showSituational) {
    if (loadingSituational) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Caricamento domande situazionali...</p>
          </div>
        </div>
      )
    }
    if (situationalQuestions.length === 0) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-gray-600">Errore nel caricamento delle domande situazionali.</p>
        </div>
      )
    }

    const currentQuestion = situationalQuestions[currentSituationalIndex]
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900">Assessment Situazionale</h1>
            <p className="text-sm text-gray-600 mt-1">
              Leggi ogni situazione e scegli l&apos;opzione che meglio rappresenta come agiresti
            </p>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <SituationalQuestion
            situation={currentQuestion.situation}
            options={currentQuestion.options}
            selectedOption={situationalAnswers[currentQuestion.id] || null}
            onSelect={handleSituationalAnswer}
            questionNumber={currentSituationalIndex + 1}
            totalQuestions={situationalQuestions.length}
          />
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={handleSituationalPrevious}
              disabled={currentSituationalIndex === 0}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              ← Precedente
            </button>
            {currentSituationalIndex < situationalQuestions.length - 1 ? (
              <button
                onClick={handleSituationalNext}
                disabled={!situationalAnswers[currentQuestion.id]}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Successiva →
              </button>
            ) : (
              <button
                onClick={handleCompleteAssessment}
                disabled={saving || !situationalAnswers[currentQuestion.id]}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
              >
                {saving ? 'Salvataggio...' : 'Completa Assessment ✓'}
              </button>
            )}
          </div>
        </main>
      </div>
    )
  }

  const currentQuestion = filteredQuestions[currentQuestionIndex]
  if (!currentQuestion) return null

  const isLastQuestion = currentQuestionIndex === filteredQuestions.length - 1
  const isProfiling = currentQuestion.category === 'profiling'

  // Progress: count only Likert answers for the progress bar
  const answeredLikert = Object.keys(answers).length
  const progress = likertQuestions.length > 0
    ? (answeredLikert / likertQuestions.length) * 100
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Assessment Soft Skills</h1>
          <p className="text-sm text-gray-600 mt-1">
            {isProfiling
              ? 'Domanda di profilazione'
              : `Domanda ${currentQuestionIndex + 1} di ${filteredQuestions.length}`}
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progresso</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-purple-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          {isProfiling && (
            <span className="inline-block mb-3 text-xs font-semibold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
              Domanda di profilazione
            </span>
          )}
          <h2 className="text-xl font-semibold text-gray-900 mb-8">
            {currentQuestion.question}
          </h2>

          {/* ── LIKERT ──────────────────────────────────────────────────── */}
          {currentQuestion.type === 'likert' && (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(value => (
                <button
                  key={value}
                  onClick={() => handleAnswer(value)}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    answers[currentQuestion.id] === value
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium text-gray-900">
                    {value === 1 && "Per niente d'accordo"}
                    {value === 2 && "Poco d'accordo"}
                    {value === 3 && "Mediamente d'accordo"}
                    {value === 4 && "Abbastanza d'accordo"}
                    {value === 5 && "Pienamente d'accordo"}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* ── SINGLE CHOICE ────────────────────────────────────────────── */}
          {currentQuestion.type === 'single_choice' && (
            <div className="space-y-3">
              {currentQuestion.options?.map(option => (
                <button
                  key={option}
                  onClick={() => handleSingleChoice(option)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    profilingAnswers[String(currentQuestion.id)] === option
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium text-gray-900">{option}</span>
                </button>
              ))}
            </div>
          )}

          {/* ── TEXTAREA ─────────────────────────────────────────────────── */}
          {currentQuestion.type === 'textarea' && (
            <div>
              <textarea
                rows={5}
                value={textareaValue}
                onChange={e => setTextareaValue(e.target.value)}
                placeholder="Scrivi qui la tua risposta (facoltativo)..."
                className="w-full p-4 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:outline-none resize-none text-gray-900 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">Campo facoltativo — puoi lasciarlo vuoto</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            ← Precedente
          </button>

          {isLastQuestion ? (
            <button
              onClick={handleCompleteLikert}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
            >
              Continua con Domande Situazionali →
            </button>
          ) : currentQuestion.type === 'textarea' ? (
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Successiva →
            </button>
          ) : null}
        </div>
      </main>
    </div>
  )
}
