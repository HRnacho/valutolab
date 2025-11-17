'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

interface Question {
  id: string
  dimension: string
  domanda: string
  opzioni: {
    A: string
    B: string
    C: string
    D: string
  }
  pesi: {
    A: number
    B: number
    C: number
    D: number
  }
}

export default function LeadershipAssessmentPage() {
  const router = useRouter()
  const params = useParams()
  const assessmentId = params.id as string

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const init = async () => {
      // Verifica utente
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser(user)

      // Carica domande
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://valutolab-backend.onrender.com'
        const response = await fetch(`${apiUrl}/api/leadership/questions`)
        const data = await response.json()

        if (data.success) {
          setQuestions(data.data.questions)
        }

        // Carica risposte salvate
        const { data: savedResponses } = await supabase
          .from('leadership_responses')
          .select('question_id, answer')
          .eq('assessment_id', assessmentId)

        if (savedResponses) {
          const answersMap: Record<string, string> = {}
          savedResponses.forEach(r => {
            answersMap[r.question_id] = r.answer
          })
          setAnswers(answersMap)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error loading questions:', error)
        alert('Errore nel caricamento delle domande')
      }
    }

    init()
  }, [router, assessmentId])

  const handleAnswer = async (answer: string) => {
    const currentQuestion = questions[currentQuestionIndex]
    const score = currentQuestion.pesi[answer as keyof typeof currentQuestion.pesi]

    // Salva risposta localmente
    setAnswers({
      ...answers,
      [currentQuestion.id]: answer
    })

    // Salva su backend
    setSaving(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://valutolab-backend.onrender.com'
      
      await fetch(`${apiUrl}/api/leadership/${assessmentId}/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          dimension: currentQuestion.dimension,
          answer: answer,
          score: score
        })
      })
    } catch (error) {
      console.error('Error saving answer:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleComplete = async () => {
    // Verifica che tutte le domande abbiano risposta
    const allAnswered = questions.every(q => answers[q.id])

    if (!allAnswered) {
      alert('Rispondi a tutte le domande prima di completare')
      return
    }

    setSaving(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://valutolab-backend.onrender.com'
      
      const response = await fetch(`${apiUrl}/api/leadership/${assessmentId}/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (data.success) {
        router.push(`/leadership/${assessmentId}/results`)
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      console.error('Error completing assessment:', error)
      alert('Errore nel completamento dell\'assessment')
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

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">Errore nel caricamento delle domande</p>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const currentAnswer = answers[currentQuestion.id]
  const progress = Math.round((Object.keys(answers).length / questions.length) * 100)
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  const dimensionNames: Record<string, string> = {
    visione_strategica: 'Visione Strategica',
    people_management: 'People Management',
    decisionalita: 'Decisionalità',
    change_management: 'Change Management',
    influenza_persuasione: 'Influenza & Persuasione',
    orientamento_risultati: 'Orientamento ai Risultati'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              Leadership Deep Dive
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {Object.keys(answers).length}/{questions.length} completate
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">
              Domanda {currentQuestionIndex + 1} di {questions.length}
            </span>
            <span className="text-sm font-semibold text-yellow-600">
              {progress}% completato
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-yellow-500 to-orange-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          {/* Dimensione Badge */}
          <div className="mb-6">
            <span className="inline-block bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-semibold">
              📊 {dimensionNames[currentQuestion.dimension]}
            </span>
          </div>

          {/* Domanda */}
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            {currentQuestion.domanda}
          </h2>

          {/* Opzioni */}
          <div className="space-y-4">
            {(['A', 'B', 'C', 'D'] as const).map((option) => (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                className={`w-full text-left p-6 rounded-xl border-2 transition-all ${
                  currentAnswer === option
                    ? 'border-yellow-500 bg-yellow-50 shadow-lg'
                    : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50/50'
                }`}
              >
                <div className="flex items-start">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4 ${
                    currentAnswer === option
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {option}
                  </div>
                  <p className="text-gray-700 flex-1">
                    {currentQuestion.opzioni[option]}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Auto-save indicator */}
          {saving && (
            <div className="mt-4 text-center text-sm text-gray-500">
              💾 Salvataggio in corso...
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            ← Precedente
          </button>

          {!isLastQuestion ? (
            <button
              onClick={handleNext}
              disabled={!currentAnswer}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
            >
              Successiva →
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={!currentAnswer || saving || Object.keys(answers).length !== questions.length}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
            >
              {saving ? 'Elaborazione...' : 'Completa Assessment ✓'}
            </button>
          )}
        </div>

        {/* Progress Grid */}
        <div className="mt-8 bg-white rounded-xl p-6 shadow-lg">
          <h3 className="font-semibold text-gray-900 mb-4">Progresso Domande</h3>
          <div className="grid grid-cols-10 gap-2">
            {questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`aspect-square rounded-lg text-sm font-semibold transition ${
                  answers[q.id]
                    ? 'bg-yellow-500 text-white'
                    : index === currentQuestionIndex
                    ? 'bg-yellow-200 text-yellow-900 ring-2 ring-yellow-500'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
