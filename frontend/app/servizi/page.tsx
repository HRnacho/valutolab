'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { api } from '@/lib/api'
import { Wordmark } from '@/components/ui/Wordmark'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, CheckCircle, Star } from 'lucide-react'

export default function ServiziPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => { router.replace('/') }, [router])

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  const handleStartBaseAssessment = async () => {
    try {
      const res = await api.assessments.create()
      router.push(`/assessment/${res.assessment.id}`)
    } catch {
      alert("Errore nell'avvio dell'assessment base")
    }
  }

  const handleStartLeadershipAssessment = async () => {
    if (!user) { router.push('/login'); return }
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.valutolab.com'
      const response = await fetch(`${apiUrl}/api/leadership/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.message)
      router.push(`/leadership/${data.assessment.id}`)
    } catch {
      alert("Errore nell'avvio del Leadership Assessment")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper-100">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-ink-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 font-body text-[14px] text-ink-500">Caricamento…</p>
        </div>
      </div>
    )
  }

  const baseFeatures = [
    '48 domande su 12 categorie di soft skills',
    'Report AI personalizzato con profilo professionale',
    'Certificato PDF scaricabile e condivisibile',
    'Badge LinkedIn professionale',
    'Profilo pubblico con QR code',
  ]

  const leadershipFeatures = [
    '30 scenari situazionali specifici per leader',
    '6 dimensioni leadership: Visione, People Mgmt, Decisionalità, Change, Influenza, Risultati',
    'Identificazione stile di leadership (Trasformazionale, Servant, ecc.)',
    'Piano d\'azione personalizzato con azioni concrete',
    'Report AI avanzato con benchmark e insights',
    'Risorse consigliate (libri, corsi)',
  ]

  return (
    <div className="min-h-screen bg-paper-100 font-body text-ink-900">

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className="bg-paper-50 border-b border-paper-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Wordmark size={20} />
            <button onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1.5 text-[13px] text-ink-500 hover:text-ink-900 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 lg:px-8 py-12 space-y-10">

        {/* ── TITLE ──────────────────────────────────────────────────── */}
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-2">Percorsi di Valutazione</p>
          <h1 className="font-display text-display-2 text-ink-900 mb-3">Scegli il Tuo Assessment</h1>
          <p className="text-[16px] text-ink-600">Seleziona il percorso di valutazione più adatto alle tue esigenze</p>
        </div>

        {/* ── CARDS ──────────────────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">

          {/* Assessment Base */}
          <div className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink overflow-hidden flex flex-col">
            <div className="bg-ink-900 p-8">
              <div className="w-12 h-12 bg-ink-800 rounded-md flex items-center justify-center mb-5">
                <CheckCircle className="w-6 h-6 text-paper-300" />
              </div>
              <h2 className="font-display text-[26px] text-paper-50 mb-1">Assessment Base</h2>
              <p className="text-[13px] text-ink-400 mb-6">Valutazione completa delle soft skills</p>
              <div className="border-t border-ink-700 pt-6">
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-[42px] leading-none text-paper-50">€49</span>
                  <span className="text-[13px] text-ink-400">pagamento unico</span>
                </div>
              </div>
            </div>

            <div className="p-8 flex flex-col flex-1">
              <ul className="space-y-3 mb-8 flex-1">
                {baseFeatures.map(f => (
                  <li key={f} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-level-avanzato flex-shrink-0 mt-0.5" />
                    <span className="text-[13px] text-ink-700" dangerouslySetInnerHTML={{ __html: f.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  </li>
                ))}
              </ul>
              <Button variant="primary" className="w-full justify-center" onClick={handleStartBaseAssessment}>
                Inizia Assessment Base
              </Button>
            </div>
          </div>

          {/* Leadership Deep Dive */}
          <div className="bg-paper-50 border-2 border-level-intermedio rounded-md shadow-md-ink overflow-hidden flex flex-col relative">
            <div className="absolute top-4 right-4">
              <span className="text-[10px] font-semibold uppercase tracking-eyebrow px-2.5 py-1 rounded-sm border text-level-intermedio bg-amber-50 border-amber-300 flex items-center gap-1">
                <Star className="w-3 h-3" /> Premium
              </span>
            </div>

            <div className="bg-ink-900 p-8 pt-12">
              <div className="w-12 h-12 bg-ink-800 rounded-md flex items-center justify-center mb-5">
                <Star className="w-6 h-6 text-amber-400" />
              </div>
              <h2 className="font-display text-[26px] text-paper-50 mb-1">Leadership Deep Dive</h2>
              <p className="text-[13px] text-ink-400 mb-6">Analisi avanzata delle competenze di leadership</p>
              <div className="border-t border-ink-700 pt-6">
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-[42px] leading-none text-paper-50">€79</span>
                  <span className="text-[13px] text-ink-400">pagamento unico</span>
                </div>
              </div>
            </div>

            <div className="p-8 flex flex-col flex-1">
              <ul className="space-y-3 mb-8 flex-1">
                {leadershipFeatures.map(f => (
                  <li key={f} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-level-avanzato flex-shrink-0 mt-0.5" />
                    <span className="text-[13px] text-ink-700">{f}</span>
                  </li>
                ))}
              </ul>
              <Button variant="accent" className="w-full justify-center" onClick={handleStartLeadershipAssessment}>
                Inizia Leadership Assessment
              </Button>
              <p className="text-center text-[11px] text-ink-400 mt-3">💳 Pagamento sicuro con Stripe (prossimamente)</p>
            </div>
          </div>
        </div>

        {/* ── BUNDLE ─────────────────────────────────────────────────── */}
        <div className="max-w-3xl mx-auto bg-ink-900 rounded-md p-8 text-center">
          <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-3">Offerta Bundle</p>
          <h3 className="font-display text-display-3 text-paper-50 mb-2">Bundle Completo</h3>
          <p className="text-[14px] text-ink-400 mb-6">Assessment Base + Leadership Deep Dive</p>
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="font-body text-[18px] line-through text-ink-500">€128</span>
            <span className="font-display text-[48px] leading-none text-paper-50">€99</span>
            <span className="text-[10px] font-semibold uppercase tracking-eyebrow px-2.5 py-1 rounded-sm border text-level-intermedio bg-amber-900/30 border-amber-700">
              Risparmia €29
            </span>
          </div>
          <button onClick={() => alert('Bundle in arrivo prossimamente!')}
            className="bg-paper-50 text-ink-900 font-medium text-[14px] px-8 py-3 rounded-sm hover:bg-paper-200 transition-colors">
            Acquista Bundle (Presto Disponibile)
          </button>
        </div>

      </main>
    </div>
  )
}
