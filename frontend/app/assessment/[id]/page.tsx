'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { questions, likertScale } from '@/data/questions'
import { User } from '@supabase/supabase-js'

export default function AssessmentQuestionPage() {
  const router = useRouter()
  const params = useParams()
  const assessmentId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [saving, setSaving] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  useEffect(() => {
    const init = async () => {
      // Check user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // Load existing answers
      const { data: responses } = await supabase
        .from('assessment_responses')
        .select('question_id, answer')
        .eq('assessment_id', assessmentId)

      if (responses) {
        const answersMap: Record<number, number> = {}
        responses.forEach((r) => {
          answersMap[r.question_id] = r.answer
        })
        setAnswers(answersMap)
      }

      setLoading(false)
    }

    init()
  }, [assessmentId, router])

  const saveAnswer = async (questionId: number, answer: number) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('assessment_responses')
        .upsert({
          assessment_id: assessmentId,
          question_id: questionId,
          answer: answer,
        }, {
          onConflict: 'assessment_id,question_id'
        })

      if (error) throw error

      // Update local state
      setAnswers((prev) => ({ ...prev, [questionId]: answer }))
    } catch (error) {
      console.error('Error saving answer:', error)
      alert('Errore nel salvataggio. Riprova.')
    } finally {
      setSaving(false)
    }
  }

  const handleAnswer = async (value: number) => {
    await saveAnswer(currentQuestion.id, value)
    
    // Auto-advance to next question after 300ms
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      }
    }, 300)
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

 const handleComplete = async () => {
    // Check all questions answered
    const allAnswered = questions.every((q) => answers[q.id] !== undefined)
    
    if (!allAnswered) {
      alert('Rispondi a tutte le domande prima di completare l\'assessment!')
      return
    }

    try {
      // Call backend to calculate scores
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://valutolab-backend.onrender.com'}/api/assessments/${assessmentId}/calculate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to calculate scores')
      }

      const result = await response.json()
      console.log('Assessment completed:', result)

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Error completing assessment:', error)
      alert('Errore nel completamento. Riprova.')
    }
  }

  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const currentAnswer = answers[currentQuestion.id]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">Assessment Soft Skills</h1>
            <div className="text-sm text-gray-600">
              Domanda {currentQuestionIndex + 1} di {questions.length}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Category Badge */}
          <div className="mb-6">
            <span className="inline-block bg-purple-100 text-purple-800 px-4 py-1 rounded-full text-sm font-semibold">
              {currentQuestion.categoryLabel}
            </span>
          </div>

          {/* Question */}
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            {currentQuestion.question}
          </h2>

          {/* Likert Scale */}
          <div className="space-y-3 mb-8">
            {likertScale.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(option.value)}
                disabled={saving}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  currentAnswer === option.value
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">{option.label}</span>
                  <div className={`w-6 h-6 rounded-full border-2 ${
                    currentAnswer === option.value
                      ? 'border-purple-600 bg-purple-600'
                      : 'border-gray-300'
                  }`}>
                    {currentAnswer === option.value && (
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-6 border-t">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-gray-700"
            >
              ← Indietro
            </button>

            {saving && (
              <span className="text-sm text-gray-500">Salvataggio...</span>
            )}

            {!isLastQuestion ? (
              <button
                onClick={handleNext}
                disabled={!currentAnswer}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                Avanti →
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={!currentAnswer}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                Completa Assessment ✓
              </button>
            )}
          </div>
        </div>

        {/* Progress Info */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Risposte completate: {Object.keys(answers).length} / {questions.length}
        </div>
      </main>
    </div>
  )
}