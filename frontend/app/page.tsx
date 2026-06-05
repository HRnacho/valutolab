'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { Wordmark } from '@/components/ui/Wordmark'
import { Button } from '@/components/ui/Button'
import { EscoChip } from '@/components/ui/EscoChip'
import { LevelTrack } from '@/components/ui/LevelTrack'
import {
  BarChart3, FileText, Users, Building2, Award,
  Check, ChevronRight, ArrowRight
} from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isAziendaReferente, setIsAziendaReferente] = useState(false)

  useEffect(() => {
    if (loading || !user) return
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.valutolab.com'
    fetch(`${apiUrl}/api/v1/trial/check-referente/${user.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setIsAziendaReferente(data.isReferente === true) })
      .catch(() => {})
  }, [user, loading])

  return (
    <div className="min-h-screen bg-paper-100 text-ink-900">

      {/* ── HEADER ───────────────────────────────────────────────── */}
      <header className="bg-paper-50 border-b border-paper-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Wordmark size={22} />

            <nav className="hidden md:flex items-center gap-8">
              {['Servizi', 'Metodologia', 'Aziende'].map(label => (
                <a
                  key={label}
                  href={`#${label.toLowerCase()}`}
                  className="font-body text-[14px] text-ink-600 hover:text-sienna-600 transition-colors"
                >
                  {label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Button variant="primary" onClick={() => router.push('/dashboard')}>
                    Dashboard
                  </Button>
                  {isAziendaReferente && (
                    <Button variant="secondary" onClick={() => router.push('/aziende/dashboard')}>
                      Dashboard Azienda
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => router.push('/login')}>
                    Accedi
                  </Button>
                  <Button variant="secondary" onClick={() => router.push('/register')}>
                    Registrati
                  </Button>
                  <Button variant="accent" onClick={() => router.push('/servizi')}>
                    Inizia l'assessment
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="py-24 lg:py-36 border-b border-paper-200">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <p className="font-mono text-eyebrow text-ink-500 uppercase tracking-eyebrow mb-8">
            § 01 — Assessment professionale
          </p>
          <h1 className="font-display text-display-1 text-ink-900 mb-8 max-w-3xl">
            Dodici competenze.<br />
            Uno standard <em>europeo</em>.
          </h1>
          <p className="font-body text-lede text-ink-600 max-w-2xl mb-10">
            Un assessment delle tue competenze trasversali mappato sullo standard ESCO v1.2
            della Commissione Europea. Quaranta minuti, una lettura che resta.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="accent" className="text-[16px] px-8 py-4" onClick={() => router.push('/servizi')}>
              Inizia l'assessment
              <ArrowRight className="inline ml-2 w-4 h-4" strokeWidth={1.5} />
            </Button>
            <Button variant="secondary" onClick={() => router.push('/aziende/create')}>
              Soluzioni per aziende
            </Button>
          </div>
          <div className="mt-10">
            <EscoChip label="Competenze trasversali · 12 skill" />
          </div>
        </div>
      </section>

      {/* ── TRE COSE VERE ────────────────────────────────────────── */}
      <section className="py-24 border-b border-paper-200">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <p className="font-mono text-eyebrow text-ink-500 uppercase tracking-eyebrow mb-12">
            § 02 — Perché ValutoLab
          </p>
          <div className="grid md:grid-cols-3 gap-px bg-paper-200">
            {[
              {
                icon: <BarChart3 className="w-5 h-5" strokeWidth={1.5} />,
                title: 'Mappatura ESCO',
                body: 'Ogni competenza è collegata a un descrittore ufficiale del framework europeo ESCO v1.2 e alla scala EQF, con URI verificabile.',
              },
              {
                icon: <FileText className="w-5 h-5" strokeWidth={1.5} />,
                body: 'Il report non è un template. L\'analisi qualitativa è generata da Claude su misura per il tuo profilo specifico di risposte.',
                title: 'Lettura personalizzata',
              },
              {
                icon: <Award className="w-5 h-5" strokeWidth={1.5} />,
                title: 'Evidenza portabile',
                body: 'Badge LinkedIn, QR code verificabile, PDF vettoriale — strumenti che il professionista porta nel CV, nel colloquio, nel profilo online.',
              },
            ].map(({ icon, title, body }) => (
              <div key={title} className="bg-paper-50 p-10">
                <div className="text-sienna-600 mb-5">{icon}</div>
                <h3 className="font-display text-display-3 text-ink-900 mb-4">{title}</h3>
                <p className="font-body text-body text-ink-600 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVIZI ──────────────────────────────────────────────── */}
      <section id="servizi" className="py-24 border-b border-paper-200">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <p className="font-mono text-eyebrow text-ink-500 uppercase tracking-eyebrow mb-4">
            § 03 — Servizi
          </p>
          <h2 className="font-display text-display-2 text-ink-900 mb-16">
            Scegli l'assessment
          </h2>
          <div className="grid md:grid-cols-2 gap-px bg-paper-200">

            {/* Assessment Base */}
            <div className="bg-paper-50 p-10 flex flex-col">
              <div className="mb-2">
                <span className="font-mono text-[11px] tracking-wider text-ink-500 uppercase">
                  Assessment Base
                </span>
              </div>
              <h3 className="font-display text-display-3 text-ink-900 mb-2">
                Competenze Trasversali
              </h3>
              <p className="font-body text-body text-ink-600 mb-8">
                48 item Likert + 12 situational judgement. 12 competenze misurate, mappate ESCO.
              </p>
              <ul className="space-y-3 mb-10 flex-1">
                {[
                  'Valutazione 12 soft skills',
                  'Report qualitativo AI',
                  'Profilo ESCO con URI verificabili',
                  'Badge LinkedIn + QR code',
                  'Certificato PDF',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-sienna-600 mt-1 flex-shrink-0" strokeWidth={1.5} />
                    <span className="font-body text-body text-ink-700">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <LevelTrack score={3.2} className="mb-6 opacity-40" />
                <Button variant="primary" className="w-full justify-center" onClick={() => router.push('/servizi')}>
                  Scopri di più
                  <ChevronRight className="inline ml-1 w-4 h-4" strokeWidth={1.5} />
                </Button>
              </div>
            </div>

            {/* Leadership */}
            <div className="bg-ink-900 p-10 flex flex-col">
              <div className="mb-2">
                <span className="font-mono text-[11px] tracking-wider text-ink-400 uppercase">
                  Assessment Premium
                </span>
              </div>
              <h3 className="font-display text-display-3 text-paper-50 mb-2">
                Leadership Deep Dive
              </h3>
              <p className="font-body text-body text-ink-300 mb-8">
                30 scenari situazionali avanzati. 6 dimensioni di leadership. Piano d'azione 3–6 mesi.
              </p>
              <ul className="space-y-3 mb-10 flex-1">
                {[
                  'Stile di leadership personalizzato',
                  'Analisi 6 dimensioni manageriali',
                  'Piano d\'azione con timeline',
                  'Risorse consigliate',
                  'Report premium scaricabile',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-sienna-500 mt-1 flex-shrink-0" strokeWidth={1.5} />
                    <span className="font-body text-body text-ink-200">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <Button variant="accent" className="w-full justify-center" onClick={() => router.push('/servizi')}>
                  Scopri di più
                  <ChevronRight className="inline ml-1 w-4 h-4" strokeWidth={1.5} />
                </Button>
              </div>
            </div>

          </div>

          {/* Coming soon */}
          <div className="mt-px bg-paper-100 border border-paper-200 p-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Users className="w-5 h-5 text-ink-400" strokeWidth={1.5} />
              <div>
                <p className="font-display text-[18px] font-medium text-ink-700">Dinamiche di Gruppo</p>
                <p className="font-body text-caption text-ink-500">Team assessment — valutazione relazioni interpersonali e ruoli</p>
              </div>
            </div>
            <span className="font-mono text-[11px] tracking-wider text-ink-400 uppercase border border-paper-300 px-3 py-1.5">
              In sviluppo
            </span>
          </div>
        </div>
      </section>

      {/* ── AZIENDE ──────────────────────────────────────────────── */}
      <section id="aziende" className="py-24 border-b border-paper-200 bg-paper-50">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <p className="font-mono text-eyebrow text-ink-500 uppercase tracking-eyebrow mb-4">
            § 04 — Soluzioni per aziende
          </p>
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="font-display text-display-2 text-ink-900 mb-6">
                Valuta il team.<br />Semplifica il recruiting.
              </h2>
              <p className="font-body text-body text-ink-600 mb-8 leading-relaxed">
                Dashboard centralizzata per HR: gestisci inviti, confronta profili,
                esporta report. Nessuna licenza per candidato — una tariffa flat per organizzazione.
              </p>
              <Button variant="accent" onClick={() => router.push('/aziende/create')}>
                Richiedi accesso
                <ArrowRight className="inline ml-2 w-4 h-4" strokeWidth={1.5} />
              </Button>
            </div>
            <ul className="space-y-5">
              {[
                ['Dashboard HR centralizzata', 'Tutti i profili in un posto, con filtri e comparazione.'],
                ['Inviti illimitati', 'Invita candidati e dipendenti con link tracciato.'],
                ['Export per recruiting', 'Scarica i report del team in batch.'],
                ['Gestione permessi', 'Ruoli differenziati per HR, manager, candidato.'],
              ].map(([title, desc]) => (
                <li key={title} className="flex items-start gap-4 border-b border-paper-200 pb-5 last:border-0">
                  <Building2 className="w-4 h-4 text-sienna-600 mt-1 flex-shrink-0" strokeWidth={1.5} />
                  <div>
                    <p className="font-display text-[16px] font-medium text-ink-900">{title}</p>
                    <p className="font-body text-caption text-ink-500 mt-0.5">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-ink-900">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <p className="font-mono text-eyebrow text-ink-500 uppercase tracking-eyebrow mb-6">
            § 05 — Inizia
          </p>
          <h2 className="font-display text-display-2 text-paper-50 mb-6">
            Un assessment che vale la lettura.
          </h2>
          <p className="font-body text-lede text-ink-400 mb-10">
            Quaranta minuti. Dodici competenze. Un report che parla di te, non di un template.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="accent" className="text-[16px] px-8 py-4" onClick={() => router.push('/servizi')}>
              Inizia come privato
            </Button>
            <Button
              variant="secondary"
              className="text-[16px] px-8 py-4 border-ink-600 text-ink-300 hover:border-paper-50 hover:text-paper-50"
              onClick={() => router.push('/aziende/create')}
            >
              Parla con noi — Aziende
            </Button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="bg-ink-950 py-16">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            <div>
              <Wordmark size={20} variant="light" className="mb-4" />
              <p className="font-body text-caption text-ink-500 leading-relaxed">
                Piattaforma professionale per l'assessment delle competenze trasversali
                mappate sullo standard europeo ESCO v1.2.
              </p>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-ink-600 mb-4">
                Servizi
              </p>
              <ul className="space-y-2">
                {[
                  ['Assessment Base', '/servizi'],
                  ['Leadership Deep Dive', '/servizi'],
                  ['Soluzioni Aziende', '/aziende/create'],
                ].map(([label, href]) => (
                  <li key={label}>
                    <a href={href} className="font-body text-caption text-ink-500 hover:text-paper-50 transition-colors">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-ink-600 mb-4">
                Accesso
              </p>
              <ul className="space-y-2">
                {[
                  ['Accedi', '/login'],
                  ['Registrati', '/register'],
                  ['info@valutolab.com', 'mailto:info@valutolab.com'],
                ].map(([label, href]) => (
                  <li key={label}>
                    <a href={href} className="font-body text-caption text-ink-500 hover:text-paper-50 transition-colors">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-ink-800 pt-8 flex flex-wrap justify-between items-center gap-4">
            <p className="font-mono text-[11px] text-ink-600">
              © 2026 ValutoLab · ESCO v1.2 · Commissione Europea
            </p>
            <p className="font-mono text-[11px] text-ink-700">
              Assessment · Reporting · Certificazione
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}
