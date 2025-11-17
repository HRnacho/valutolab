'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ServiziPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

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

  const handleStartBaseAssessment = async () => {
    try {
      // Crea nuovo assessment base
      const { data: newAssessment, error } = await supabase
        .from('assessments')
        .insert({
          user_id: user.id,
          status: 'in_progress'
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/assessment/${newAssessment.id}`)
    } catch (error) {
      console.error('Error starting base assessment:', error)
      alert('Errore nell\'avvio dell\'assessment base')
    }
  }

  const handleStartLeadershipAssessment = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://valutolab-backend.onrender.com'
      
      // Crea nuovo leadership assessment
      const response = await fetch(`${apiUrl}/api/leadership/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user.id })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message)
      }

      // Redirect a pagina leadership assessment
      router.push(`/leadership/${data.assessment.id}`)
    } catch (error) {
      console.error('Error starting leadership assessment:', error)
      alert('Errore nell\'avvio del Leadership Assessment')
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">ValutoLab</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Scegli il Tuo Assessment</h2>
          <p className="text-xl text-gray-600">Seleziona il percorso di valutazione più adatto alle tue esigenze</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          
          {/* ASSESSMENT BASE */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow">
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-8 text-white">
              <div className="text-center mb-4">
                <div className="inline-block bg-white/20 rounded-full p-4 mb-4">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold mb-2">Assessment Base</h3>
                <p className="text-purple-100">Valutazione completa delle soft skills</p>
              </div>
              
              <div className="text-center py-6 border-t border-b border-white/20 my-6">
                <div className="text-5xl font-bold mb-2">€49</div>
                <div className="text-purple-100">Pagamento unico</div>
              </div>
            </div>

            <div className="p-8">
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700"><strong>48 domande</strong> su 12 categorie di soft skills</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700"><strong>Report AI personalizzato</strong> con profilo professionale</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700"><strong>Certificato PDF</strong> scaricabile e condivisibile</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700"><strong>Badge LinkedIn</strong> professionale</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700"><strong>Profilo pubblico</strong> con QR code</span>
                </li>
              </ul>

              <button
                onClick={handleStartBaseAssessment}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition shadow-lg"
              >
                Inizia Assessment Base
              </button>
            </div>
          </div>

          {/* LEADERSHIP DEEP DIVE */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow border-4 border-yellow-400 relative">
            <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full font-bold text-sm">
              🏆 PREMIUM
            </div>
            
            <div className="bg-gradient-to-br from-yellow-500 to-orange-600 p-8 text-white">
              <div className="text-center mb-4">
                <div className="inline-block bg-white/20 rounded-full p-4 mb-4">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold mb-2">Leadership Deep Dive</h3>
                <p className="text-yellow-100">Analisi avanzata delle competenze di leadership</p>
              </div>
              
              <div className="text-center py-6 border-t border-b border-white/20 my-6">
                <div className="text-5xl font-bold mb-2">€79</div>
                <div className="text-yellow-100">Pagamento unico</div>
              </div>
            </div>

            <div className="p-8">
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700"><strong>30 scenari situazionali</strong> specifici per leader</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700"><strong>6 dimensioni leadership:</strong> Visione, People Mgmt, Decisionalità, Change, Influenza, Risultati</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700"><strong>Identificazione stile di leadership</strong> (Trasformazionale, Servant, ecc.)</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700"><strong>Piano d'azione personalizzato</strong> con azioni concrete</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700"><strong>Report AI avanzato</strong> con benchmark e insights</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700"><strong>Risorse consigliate</strong> (libri, corsi)</span>
                </li>
              </ul>

              <button
                onClick={handleStartLeadershipAssessment}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-4 rounded-lg font-bold text-lg hover:from-yellow-600 hover:to-orange-700 transition shadow-lg"
              >
                Inizia Leadership Assessment
              </button>
              
              <p className="text-center text-sm text-gray-500 mt-4">
                💳 Pagamento sicuro con Stripe (prossimamente)
              </p>
            </div>
          </div>

        </div>

        {/* Bundle Offer */}
        <div className="mt-12 max-w-3xl mx-auto bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-2xl p-8 text-white">
          <div className="text-center">
            <h3 className="text-3xl font-bold mb-4">💎 Bundle Completo</h3>
            <p className="text-xl mb-6">Assessment Base + Leadership Deep Dive</p>
            
            <div className="flex items-center justify-center gap-4 mb-6">
              <span className="text-2xl line-through opacity-75">€128</span>
              <span className="text-5xl font-bold">€99</span>
              <span className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full font-bold">
                Risparmia €29
              </span>
            </div>

            <button
              onClick={() => alert('Bundle in arrivo prossimamente!')}
              className="bg-white text-purple-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition shadow-lg"
            >
              Acquista Bundle (Presto Disponibile)
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
