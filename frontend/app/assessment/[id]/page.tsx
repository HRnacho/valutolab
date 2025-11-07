'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { questions } from '@/data/questions'
import SituationalQuestion from '@/components/SituationalQuestion'

interface Question {
  id: string
  question: string
  category: string
}

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

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  
  const [showSituational, setShowSituational] = useState(false)
  const [situationalQuestions, setSituationalQuestions] = useState<SituationalQuestionData[]>([])
  const [currentSituationalIndex, setCurrentSituationalIndex] = useState(0)
  const [situationalAnswers, setSituationalAnswers] = useState<Record<string, string>>({})
  const [loadingSituational, setLoadingSituational] = useState(false)

  useEffect(() => {
    const checkAssessment = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: assessment } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .single()

      if (!assessment) {
        router.push('/dashboard')
        return
      }

      if (assessment.status === 'completed') {
        router.push(`/dashboard/results/${assessmentId}`)
        return
      }

      const { data: existingAnswers } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('assessment_id', assessmentId)

      if (existingAnswers && existingAnswers.length > 0) {
        const answersMap: Record<string, number> = {}
        existingAnswers.forEach((ans) => {
          answersMap[ans.question_id] = ans.answer_value
        })
        setAnswers(answersMap)
        
        const lastAnsweredIndex = questions.findIndex(q => !answersMap[q.id])
        if (lastAnsweredIndex !== -1) {
          setCurrentQuestionIndex(lastAnsweredIndex)
        } else {
          setCurrentQuestionIndex(questions.length - 1)
        }
      }

      setLoading(false)
    }

    checkAssessment()
  }, [assessmentId, router])

  const loadSituationalQuestions = async () => {
    setLoadingSituational(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://valutolab-backend.onrender.com'
      const response = await fetch(`${apiUrl}/api/situational-questions`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.questions) {
          setSituationalQuestions(data.questions)
        }
      }
    } catch (error) {
      console.error('Error loading situational questions:', error)
    } finally {
      setLoadingSituational(false)
    }
  }

  const handleAnswer = async (value: number) => {
    const question = questions[currentQuestionIndex]
    const newAnswers = { ...answers, [question.id]: value }
    setAnswers(newAnswers)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('assessment_responses')
      .upsert({
        assessment_id: assessmentId,
        user_id: user.id,
        question_id: question.id,
        answer_value: value,
        skill_category: question.category
      }, {
        onConflict: 'assessment_id,question_id'
      })

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleCompleteLikert = async () => {
    const unanswered = questions.filter(q => !answers[q.id])
    
    if (unanswered.length > 0) {
      alert(`Per favore rispondi a tutte le domande. Mancano ${unanswered.length} risposte.`)
      const firstUnansweredIndex = questions.findIndex(q => !answers[q.id])
      setCurrentQuestionIndex(firstUnansweredIndex)
      return
    }

    await loadSituationalQuestions()
    setShowSituational(true)
  }

  const handleSituationalAnswer = (option: string) => {
    const question = situationalQuestions[currentSituationalIndex]
    setSituationalAnswers({
      ...situationalAnswers,
      [question.id]: option
    })
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
    if (currentSituationalIndex > 0) {
      setCurrentSituationalIndex(currentSituationalIndex - 1)
    }
  }

  const handleCompleteAssessment = async () => {
    const unansweredSituational = situationalQuestions.filter(q => !situationalAnswers[q.id])
    
    if (unansweredSituational.length > 0) {
      alert(`Per favore rispondi a tutte le domande situazionali. Mancano ${unansweredSituational.length} risposte.`)
      return
    }

    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://valutolab-backend.onrender.com'
      
      const responsesPayload = situationalQuestions.map(q => ({
        questionId: q.id,
        selectedOption: situationalAnswers[q.id]
      }))

      const responseSituational = await fetch(`${apiUrl}/api/situational-responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentId,
          userId: user.id,
          responses: responsesPayload
        })
      })

      if (!responseSituational.ok) {
        throw new Error('Failed to save situational responses')
      }

      const categoryScores: Record<string, { total: number; count: number }> = {}
      questions.forEach((question) => {
        const answer = answers[question.id]
        if (answer !== undefined) {
          if (!categoryScores[question.category]) {
            categoryScores[question.category] = { total: 0, count: 0 }
          }
          categoryScores[question.category].total += answer
          categoryScores[question.category].count += 1
        }
      })

      const results = Object.entries(categoryScores).map(([category, data]) => ({
        assessment_id: assessmentId,
        user_id: user.id,
        skill_category: category,
        score: parseFloat((data.total / data.count).toFixed(2)),
        percentile: null,
        strengths: [],
        improvements: []
      }))

      const { error: resultsError } = await supabase
        .from('assessment_results')
        .upsert(results, {
          onConflict: 'assessment_id,skill_category'
        })

      if (resultsError) throw resultsError

      const totalScore = results.reduce((sum, r) => sum + r.score, 0) / results.length

      const { error: updateError } = await supabase
        .from('assessments')
        .update({
          status: 'completed',
          total_score: parseFloat(totalScore.toFixed(2)),
          completed_at: new Date().toISOString()
        })
        .eq('id', assessmentId)

      if (updateError) throw updateError

      router.push(`/dashboard/results/${assessmentId}`)
    } catch (error) {
      console.error('Error completing assessment:', error)
      alert('Errore nel salvataggio. Riprova.')
    } finally {
      setSaving(false)
    }
  }

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
          <div className="text-center">
            <p className="text-gray-600">Errore nel caricamento delle domande situazionali.</p>
          </div>
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

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Assessment Soft Skills</h1>
          <p className="text-sm text-gray-600 mt-1">
            Domanda {currentQuestionIndex + 1} di {questions.length}
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progresso</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-purple-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-8">
            {currentQuestion.question}
          </h2>

          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => handleAnswer(value)}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  answers[currentQuestion.id] === value
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">
                    {value === 1 && 'Mai'}
                    {value === 2 && 'Raramente'}
                    {value === 3 && 'A volte'}
                    {value === 4 && 'Spesso'}
                    {value === 5 && 'Sempre'}
                  </span>
                  <span className="text-2xl">
                    {'⭐'.repeat(value)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            ← Precedente
          </button>

          {currentQuestionIndex === questions.length - 1 ? (
            <button
              onClick={handleCompleteLikert}
              disabled={!answers[currentQuestion.id]}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
            >
              Continua con Domande Situazionali →
            </button>
          ) : null}
        </div>
      </main>
    </div>
  )
}
