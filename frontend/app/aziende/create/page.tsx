'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { Wordmark } from '@/components/ui/Wordmark'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Users, BarChart3, Zap, CheckCircle } from 'lucide-react'

export default function AziendeCreatePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    ragioneSociale: '', partitaIva: '', nomeReferente: '', ruoloReferente: '', email: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setMessage(null)
    try {
      if (!user) {
        setMessage({ type: 'error', text: "Devi effettuare il login per creare un'organizzazione" })
        setTimeout(() => router.push('/login'), 2000); return
      }
      const emailLowercase = formData.email.toLowerCase()
      const forbiddenPrefixes = ['info@', 'admin@', 'contact@', 'sales@', 'support@']
      if (forbiddenPrefixes.some(p => emailLowercase.startsWith(p))) {
        setMessage({ type: 'error', text: 'Utilizza un indirizzo email personale, non generico aziendale' })
        setLoading(false); return
      }
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.valutolab.com'
      const response = await fetch(`${apiUrl}/api/organizations/create`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id, name: formData.ragioneSociale, partitaIva: formData.partitaIva,
          referentName: formData.nomeReferente, referentRole: formData.ruoloReferente, contactEmail: formData.email
        })
      })
      const data = await response.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Organizzazione creata con successo!' })
        setTimeout(() => router.push('/aziende/dashboard'), 1500)
      } else throw new Error(data.message)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || "Errore nella creazione dell'organizzazione" })
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-4 py-2.5 border border-paper-300 rounded-sm bg-paper-100 focus:border-ink-600 focus:outline-none font-body text-[14px] text-ink-900 placeholder-ink-400'
  const labelCls = 'block text-[12px] font-medium text-ink-600 mb-1.5'

  const benefits = [
    { icon: Users,       title: 'Valutazione Team',          desc: 'Invita dipendenti e candidati a completare l\'assessment. Confronta risultati e identifica gap di competenze.' },
    { icon: BarChart3,   title: 'Dashboard Centralizzata',   desc: 'Visualizza tutti gli assessment in un\'unica dashboard. Export report, gestione permessi e analytics.' },
    { icon: Zap,         title: 'Risultati Immediati',       desc: 'Ogni assessment completato genera un report istantaneo. Prendi decisioni di hiring più velocemente.' },
  ]

  const useCases = [
    { n: 1, title: 'Onboarding Dipendenti',   desc: 'Valuta le soft skills di nuovi assunti per creare piani di formazione personalizzati e integrazione efficace nel team.' },
    { n: 2, title: 'Screening Candidati',     desc: 'Invia assessment a candidati durante il processo di selezione per valutare fit culturale e competenze trasversali.' },
    { n: 3, title: 'Sviluppo Leadership',     desc: 'Identifica potenziali leader nel team e crea percorsi di crescita basati su analisi oggettive delle competenze manageriali.' },
    { n: 4, title: 'Team Building',           desc: 'Componi team bilanciati analizzando le competenze complementari e ottimizzando la collaborazione.' },
  ]

  const includes = [
    ['Dashboard centralizzata', 'Gestisci tutti gli assessment in un\'unica interfaccia'],
    ['Inviti illimitati', 'Invia assessment a dipendenti e candidati via email'],
    ['Comparazione candidati', 'Confronta risultati side-by-side per decisioni informate'],
    ['Export report', 'Scarica report in PDF e CSV per analisi approfondite'],
    ['Gestione team', 'Aggiungi membri del team con permessi personalizzati'],
    ['Supporto dedicato', 'Assistenza prioritaria per configurazione e utilizzo'],
  ]

  return (
    <div className="min-h-screen bg-paper-100 font-body text-ink-900">

      {/* Toast */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-sm shadow-lg-ink text-[14px] font-medium text-paper-50 ${message.type === 'success' ? 'bg-ink-900' : 'bg-sienna-600'}`}>
          {message.text}
        </div>
      )}

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className="bg-paper-50 border-b border-paper-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Wordmark size={20} />
            <button onClick={() => router.push('/')}
              className="flex items-center gap-1.5 text-[13px] text-ink-500 hover:text-ink-900 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Torna alla Home
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12 space-y-16">

        {/* ── HERO ─────────────────────────────────────────────────── */}
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-2">Per le Aziende</p>
          <h1 className="font-display text-display-1 text-ink-900 mb-4">
            ValutoLab per <span className="text-sienna-600">Aziende</span>
          </h1>
          <p className="text-[16px] text-ink-600 leading-relaxed">
            Valuta le competenze del tuo team, semplifica il recruiting e prendi decisioni basate su dati oggettivi.
          </p>
        </div>

        {/* ── BENEFICI ─────────────────────────────────────────────── */}
        <div className="grid md:grid-cols-3 gap-4">
          {benefits.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink p-6">
              <div className="w-10 h-10 bg-ink-900 rounded-md flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-paper-50" />
              </div>
              <h3 className="font-display text-[16px] font-medium text-ink-900 mb-2">{title}</h3>
              <p className="text-[13px] text-ink-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* ── USE CASES ────────────────────────────────────────────── */}
        <div className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink p-8">
          <h2 className="font-display text-[24px] font-medium text-ink-900 mb-6 text-center">Come Utilizzare ValutoLab</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {useCases.map(({ n, title, desc }) => (
              <div key={n} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-ink-900 rounded-sm flex items-center justify-center text-[12px] font-bold text-paper-50">
                  {n}
                </div>
                <div>
                  <h4 className="font-display text-[15px] font-medium text-ink-900 mb-1">{title}</h4>
                  <p className="text-[13px] text-ink-600 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── COSA INCLUDE ─────────────────────────────────────────── */}
        <div className="bg-paper-100 border border-paper-200 rounded-md p-8">
          <h2 className="font-display text-[24px] font-medium text-ink-900 mb-6 text-center">Cosa Include</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {includes.map(([title, sub]) => (
              <div key={title} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-level-avanzato flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[14px] font-medium text-ink-900">{title}</p>
                  <p className="text-[12px] text-ink-500 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-paper-200 pt-6 text-center">
            <p className="text-[14px] text-ink-700 mb-1 font-medium">Vuoi conoscere i nostri piani?</p>
            <p className="text-[13px] text-ink-500 mb-4">Contattaci per un preventivo personalizzato basato sulle tue esigenze</p>
            <a href="mailto:info@valutolab.com"
              className="inline-block border border-ink-900 text-ink-900 px-6 py-2.5 rounded-sm text-[14px] font-medium hover:bg-ink-900 hover:text-paper-50 transition-colors">
              Richiedi Informazioni
            </a>
          </div>
        </div>

        {/* ── FORM CREAZIONE ───────────────────────────────────────── */}
        <div className="max-w-lg mx-auto bg-paper-50 border border-paper-200 rounded-md shadow-md-ink p-8">
          <h2 className="font-display text-[24px] font-medium text-ink-900 mb-1 text-center">Crea la Tua Organizzazione</h2>
          <p className="text-[13px] text-ink-500 mb-6 text-center">Compila il form per iniziare</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelCls}>Ragione Sociale *</label>
              <input type="text" required value={formData.ragioneSociale}
                onChange={e => setFormData({ ...formData, ragioneSociale: e.target.value })}
                className={inputCls} placeholder="Es. Acme S.r.l." />
            </div>
            <div>
              <label className={labelCls}>Partita IVA *</label>
              <input type="text" required value={formData.partitaIva} maxLength={16}
                onChange={e => setFormData({ ...formData, partitaIva: e.target.value })}
                className={inputCls} placeholder="IT12345678901" />
            </div>
            <div>
              <label className={labelCls}>Nome Referente *</label>
              <input type="text" required value={formData.nomeReferente}
                onChange={e => setFormData({ ...formData, nomeReferente: e.target.value })}
                className={inputCls} placeholder="Mario Rossi" />
            </div>
            <div>
              <label className={labelCls}>Ruolo Referente *</label>
              <input type="text" required value={formData.ruoloReferente}
                onChange={e => setFormData({ ...formData, ruoloReferente: e.target.value })}
                className={inputCls} placeholder="Es. HR Manager, CEO, Responsabile Risorse Umane" />
            </div>
            <div>
              <label className={labelCls}>Email *</label>
              <input type="email" required value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className={inputCls} placeholder="mario.rossi@azienda.it" />
              <p className="text-[11px] text-ink-400 mt-1">Utilizza un indirizzo email personale (non info@, admin@, etc.)</p>
            </div>

            <Button type="submit" variant="primary" disabled={loading} className="w-full justify-center mt-2">
              {loading ? 'Creazione in corso…' : 'Crea Organizzazione'}
            </Button>

            <p className="text-center text-[11px] text-ink-400">
              Creando un&apos;organizzazione accetti i nostri{' '}
              <a href="/terms" className="underline hover:text-ink-700">Termini e Condizioni</a>
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}
