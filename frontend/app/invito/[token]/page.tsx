'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function InvitoPublicPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string
  
  const [loading, setLoading] = useState(true)
  const [invite, setInvite] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    validateInvite()
  }, [token])

  const validateInvite = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://valutolab-backend.onrender.com'
      const response = await fetch(`${apiUrl}/api/organizations/invite/${token}/validate`)
      const data = await response.json()

      if (data.success && data.invite.valid) {
        setInvite(data.invite)
      } else if (data.invite.expired) {
        setError('Questo invito è scaduto')
      } else if (data.invite.completed) {
        setError('Hai già completato questo assessment')
      } else {
        setError('Invito non valido')
      }

    } catch (error) {
      console.error('Error validating invite:', error)
      setError('Errore nel caricamento dell\'invito')
    } finally {
      setLoading(false)
    }
  }

  const handleStartAssessment = () => {
    // Salva il token in localStorage per tracciare l'invito durante l'assessment
    localStorage.setItem('invite_token', token)
    router.push('/assessment')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Verifica invito in corso...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invito Non Valido</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition"
          >
            Torna alla Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-xl font-black text-white">V</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                ValutoLab
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-white text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✉️</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">Sei Stato Invitato!</h1>
            <p className="text-xl text-white/90">
              da <strong>{invite?.organization_name}</strong>
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Completa l'Assessment delle Soft Skills
              </h2>
              <p className="text-lg text-gray-600 mb-2">
                Ciao <strong>{invite?.candidate_name}</strong>! 👋
              </p>
              <p className="text-gray-600">
                Sei stato invitato a completare un assessment professionale delle competenze trasversali.
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 mb-8">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">ℹ️</span>
                Cosa ti aspetta
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-purple-600 text-xl mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">60 domande di autovalutazione</p>
                    <p className="text-sm text-gray-600">Valuta 12 competenze trasversali fondamentali</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-purple-600 text-xl mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">Tempo stimato: 15 minuti</p>
                    <p className="text-sm text-gray-600">Puoi completarlo in una sessione</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-purple-600 text-xl mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">Report personalizzato</p>
                    <p className="text-sm text-gray-600">Riceverai un'analisi dettagliata delle tue competenze</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-purple-600 text-xl mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">Condivisione con l'azienda</p>
                    <p className="text-sm text-gray-600">I risultati saranno visibili a {invite?.organization_name}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy Note */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8 text-sm text-gray-600">
              <p>
                🔒 <strong>Privacy:</strong> I tuoi dati sono protetti e utilizzati esclusivamente per questo assessment. 
                Completando il test, acconsenti alla condivisione dei risultati con {invite?.organization_name}.
              </p>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleStartAssessment}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all"
            >
              Inizia l'Assessment →
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              Rispondendo in modo sincero otterrai un profilo più accurato
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-8 text-gray-600">
          <p className="text-sm">
            Powered by <strong className="text-purple-600">ValutoLab</strong> - 
            Assessment Professionale delle Soft Skills
          </p>
        </div>
      </main>
    </div>
  )
}
