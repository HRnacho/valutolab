'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegenerateReportPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [assessmentId, setAssessmentId] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleRegenerate = async () => {
    if (!assessmentId.trim()) {
      setError('Inserisci un Assessment ID valido')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://valutolab-backend.onrender.com'
      
      const response = await fetch(`${apiUrl}/api/ai-reports/regenerate/${assessmentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMessage('✅ Report rigenerato con successo! Reindirizzamento...')
        setTimeout(() => {
          router.push(`/dashboard/results/${assessmentId}`)
        }, 2000)
      } else {
        setError(`❌ Errore: ${data.error || 'Impossibile rigenerare il report'}`)
      }
    } catch (err) {
      console.error('Error regenerating report:', err)
      setError('❌ Errore di connessione. Riprova.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🔄 Rigenera Report AI
          </h1>
          
          <p className="text-gray-600 mb-6">
            Usa questa pagina per rigenerare un report con il nuovo sistema weighted blend (70% Likert + 30% Situazionali).
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Come trovare l&apos;Assessment ID:</h3>
            <ol className="list-decimal list-inside text-blue-800 space-y-1 text-sm">
              <li>Vai su Dashboard → clicca su un assessment completato</li>
              <li>Nell&apos;URL vedrai: /dashboard/results/<strong>UUID-QUI</strong></li>
              <li>Copia solo l&apos;UUID e incollalo sotto</li>
            </ol>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assessment ID
              </label>
              <input
                type="text"
                value={assessmentId}
                onChange={(e) => setAssessmentId(e.target.value)}
                placeholder="edc3f7a0-91cb-460f-a970-ebc9324c2b94"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
                {message}
              </div>
            )}

            <button
              onClick={handleRegenerate}
              disabled={loading || !assessmentId.trim()}
              className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? '⏳ Rigenerazione in corso... (10-20 secondi)' : '🔄 Rigenera Report Weighted Blend'}
            </button>

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              ← Torna alla Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
