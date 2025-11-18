'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AziendeCreatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [formData, setFormData] = useState({
    ragioneSociale: '',
    partitaIva: '',
    nomeReferente: '',
    ruoloReferente: '',
    email: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // Verifica se l'utente è loggato
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setMessage({ type: 'error', text: 'Devi effettuare il login per creare un\'organizzazione' })
        setTimeout(() => router.push('/login'), 2000)
        return
      }

      // Validazione email personale (no info@, admin@, etc)
      const emailLowercase = formData.email.toLowerCase()
      const forbiddenPrefixes = ['info@', 'admin@', 'contact@', 'sales@', 'support@']
      
      if (forbiddenPrefixes.some(prefix => emailLowercase.startsWith(prefix))) {
        setMessage({ type: 'error', text: 'Utilizza un indirizzo email personale, non generico aziendale' })
        setLoading(false)
        return
      }

      // Chiama API per creare organizzazione
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://valutolab-backend.onrender.com'
      
      const response = await fetch(`${apiUrl}/api/organizations/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: formData.ragioneSociale,
          partitaIva: formData.partitaIva,
          referentName: formData.nomeReferente,
          referentRole: formData.ruoloReferente,
          contactEmail: formData.email
        })
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Organizzazione creata con successo!' })
        setTimeout(() => router.push('/aziende/dashboard'), 1500)
      } else {
        throw new Error(data.message)
      }

    } catch (error: any) {
      console.error('Error creating organization:', error)
      setMessage({ type: 'error', text: error.message || 'Errore nella creazione dell\'organizzazione' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl flex items-center justify-center">
                <span className="text-xl font-black text-white">V</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent">
                ValutoLab Aziende
              </span>
            </button>
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Torna alla Home
            </button>
          </div>
        </div>
      </header>

      {message && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white font-semibold`}>
          {message.text}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            ValutoLab per <span className="bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent">Aziende</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Valuta le competenze del tuo team, semplifica il recruiting e prendi decisioni basate su dati oggettivi
          </p>
        </div>

        {/* Benefici */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-pink-600 rounded-lg flex items-center justify-center mb-4">
              <span className="text-3xl">👥</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Valutazione Team</h3>
            <p className="text-gray-600">
              Invita dipendenti e candidati a completare l'assessment. Confronta risultati e identifica gap di competenze.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-pink-600 rounded-lg flex items-center justify-center mb-4">
              <span className="text-3xl">📊</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Dashboard Centralizzata</h3>
            <p className="text-gray-600">
              Visualizza tutti gli assessment in un'unica dashboard. Export report, gestione permessi e analytics.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-pink-600 rounded-lg flex items-center justify-center mb-4">
              <span className="text-3xl">⚡</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Risultati Immediati</h3>
            <p className="text-gray-600">
              Ogni assessment completato genera un report istantaneo. Prendi decisioni di hiring più velocemente.
            </p>
          </div>
        </div>

        {/* Use Cases */}
        <div className="bg-white rounded-2xl p-8 mb-16 shadow-xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Come Utilizzare ValutoLab</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-bold text-lg">1</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2 text-lg">Onboarding Dipendenti</h4>
                <p className="text-gray-600">
                  Valuta le soft skills di nuovi assunti per creare piani di formazione personalizzati e integrazione efficace nel team.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-bold text-lg">2</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2 text-lg">Screening Candidati</h4>
                <p className="text-gray-600">
                  Invia assessment a candidati durante il processo di selezione per valutare fit culturale e competenze trasversali.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-bold text-lg">3</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2 text-lg">Sviluppo Leadership</h4>
                <p className="text-gray-600">
                  Identifica potenziali leader nel team e crea percorsi di crescita basati su analisi oggettive delle competenze manageriali.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-bold text-lg">4</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2 text-lg">Team Building</h4>
                <p className="text-gray-600">
                  Componi team bilanciati analizzando le competenze complementari e ottimizzando la collaborazione.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cosa Include */}
        <div className="bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Cosa Include</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-orange-600 text-2xl">✓</span>
                <div>
                  <p className="font-semibold text-gray-900">Dashboard centralizzata</p>
                  <p className="text-gray-600 text-sm">Gestisci tutti gli assessment in un'unica interfaccia</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-orange-600 text-2xl">✓</span>
                <div>
                  <p className="font-semibold text-gray-900">Inviti illimitati</p>
                  <p className="text-gray-600 text-sm">Invia assessment a dipendenti e candidati via email</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-orange-600 text-2xl">✓</span>
                <div>
                  <p className="font-semibold text-gray-900">Comparazione candidati</p>
                  <p className="text-gray-600 text-sm">Confronta risultati side-by-side per decisioni informate</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-orange-600 text-2xl">✓</span>
                <div>
                  <p className="font-semibold text-gray-900">Export report</p>
                  <p className="text-gray-600 text-sm">Scarica report in PDF e CSV per analisi approfondite</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-orange-600 text-2xl">✓</span>
                <div>
                  <p className="font-semibold text-gray-900">Gestione team</p>
                  <p className="text-gray-600 text-sm">Aggiungi membri del team con permessi personalizzati</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-orange-600 text-2xl">✓</span>
                <div>
                  <p className="font-semibold text-gray-900">Supporto dedicato</p>
                  <p className="text-gray-600 text-sm">Assistenza prioritaria per configurazione e utilizzo</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-8 pt-8 border-t border-orange-200">
            <p className="text-gray-700 mb-2">
              <strong>Vuoi conoscere i nostri piani?</strong>
            </p>
            <p className="text-gray-600 mb-4">
              Contattaci per un preventivo personalizzato basato sulle tue esigenze
            </p>
            <a 
              href="mailto:info@valutolab.com" 
              className="inline-block bg-white text-orange-600 px-8 py-3 rounded-lg font-bold hover:shadow-lg transition border-2 border-orange-600"
            >
              Richiedi Informazioni
            </a>
          </div>
        </div>

        {/* Form Creazione Organizzazione */}
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Crea la Tua Organizzazione</h2>
            <p className="text-gray-600">Compila il form per iniziare</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ragione Sociale *
              </label>
              <input
                type="text"
                required
                value={formData.ragioneSociale}
                onChange={(e) => setFormData({ ...formData, ragioneSociale: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                placeholder="Es. Acme S.r.l."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Partita IVA *
              </label>
              <input
                type="text"
                required
                value={formData.partitaIva}
                onChange={(e) => setFormData({ ...formData, partitaIva: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                placeholder="IT12345678901"
                maxLength={16}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nome Referente *
              </label>
              <input
                type="text"
                required
                value={formData.nomeReferente}
                onChange={(e) => setFormData({ ...formData, nomeReferente: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                placeholder="Mario Rossi"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ruolo Referente *
              </label>
              <input
                type="text"
                required
                value={formData.ruoloReferente}
                onChange={(e) => setFormData({ ...formData, ruoloReferente: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                placeholder="Es. HR Manager, CEO, Responsabile Risorse Umane"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                placeholder="mario.rossi@azienda.it"
              />
              <p className="text-sm text-gray-500 mt-1">
                ⚠️ Utilizza un indirizzo email personale (non info@, admin@, etc.)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-600 text-white py-4 rounded-lg font-bold text-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creazione in corso...' : 'Crea Organizzazione'}
            </button>

            <p className="text-center text-sm text-gray-600">
              Creando un'organizzazione accetti i nostri{' '}
              <a href="/terms" className="text-orange-600 hover:underline">Termini e Condizioni</a>
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}
