'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { categoryLabels } from '@/data/questions'
import { User } from '@supabase/supabase-js'

export default function AssessmentIntroPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)
      setLoading(false)
    }

    checkUser()
  }, [router])

  const handleStartAssessment = async () => {
    if (!user) return

    try {
      // Create new assessment in database
      const { data, error } = await supabase
        .from('assessments')
        .insert({
          user_id: user.id,
          status: 'in_progress',
        })
        .select()
        .single()

      if (error) throw error

      // Redirect to first question
      router.push(`/assessment/${data.id}`)
    } catch (error) {
      console.error('Error creating assessment:', error)
      alert('Errore durante la creazione dell\'assessment. Riprova.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">ValutoLab</h1>
          <a href="/dashboard" className="text-purple-600 hover:text-purple-700 font-medium">
            ← Dashboard
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Assessment Soft Skills
          </h2>
          <p className="text-xl text-gray-600">
            Valuta le tue competenze trasversali in 15 minuti
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Come funziona</h3>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                1
              </div>
              <div className="ml-4">
                <p className="text-gray-700">
                  <strong>48 domande</strong> su 12 categorie di soft skills
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                2
              </div>
              <div className="ml-4">
                <p className="text-gray-700">
                  Rispondi usando la scala: <strong>Mai</strong>, <strong>Raramente</strong>, <strong>A volte</strong>, <strong>Spesso</strong>, <strong>Sempre</strong>
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                3
              </div>
              <div className="ml-4">
                <p className="text-gray-700">
                  Le tue risposte vengono <strong>salvate automaticamente</strong>
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                4
              </div>
              <div className="ml-4">
                <p className="text-gray-700">
                  Alla fine riceverai un <strong>report dettagliato</strong> con i tuoi risultati
                </p>
              </div>
            </div>
          </div>

          {/* Time estimate */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-8">
            <p className="text-center text-purple-900">
              ⏱️ <strong>Tempo stimato:</strong> 10-15 minuti
            </p>
          </div>

          {/* Categories */}
          <div className="mb-8">
            <h4 className="text-lg font-bold text-gray-900 mb-4">
              Categorie valutate (12):
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.values(categoryLabels).map((label) => (
                <div key={label} className="bg-gray-50 px-4 py-2 rounded-lg text-gray-700 text-sm">
                  ✓ {label}
                </div>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <div className="text-center">
            <button
              onClick={handleStartAssessment}
              className="bg-purple-600 text-white px-8 py-4 rounded-lg hover:bg-purple-700 transition font-bold text-lg"
            >
              Inizia Assessment →
            </button>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-bold text-gray-900 mb-3">💡 Consigli:</h4>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li>• Rispondi onestamente senza pensarci troppo</li>
            <li>• Non ci sono risposte giuste o sbagliate</li>
            <li>• Puoi mettere in pausa e riprendere quando vuoi</li>
            <li>• I risultati sono visibili solo a te</li>
          </ul>
        </div>
      </main>
    </div>
  )
}