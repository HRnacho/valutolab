'use client'

import { useRouter } from 'next/navigation'
import { Wordmark } from '@/components/ui/Wordmark'
import { ArrowLeft, UserPlus, LayoutGrid, TrendingUp, Check } from 'lucide-react'

const STEPS = [
  {
    icon: UserPlus,
    title: 'Invita il team',
    desc: 'Ogni membro riceve un link personalizzato e completa l\'assessment in 40 minuti, da qualsiasi dispositivo.',
  },
  {
    icon: LayoutGrid,
    title: 'Raccogli i profili',
    desc: 'La dashboard centralizzata mostra tutti i risultati comparati per competenza, con export CSV immediato.',
  },
  {
    icon: TrendingUp,
    title: 'Decidi con dati',
    desc: 'Identifica gap di competenza, confronta candidati side-by-side e costruisci piani di sviluppo mirati.',
  },
]

const FEATURES = [
  'Dashboard HR centralizzata',
  'Inviti illimitati con link tracciato',
  'Comparazione candidati side-by-side',
  'Export report CSV',
  'Gestione permessi HR / Manager / Candidato',
  'Analisi qualitativa personalizzata per ogni membro',
  'Mappatura competenze ESCO v1.2',
  'Badge LinkedIn e QR code per i candidati',
]

export default function AziendeCreatePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-paper-100 font-body text-ink-900">

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className="bg-paper-50 border-b border-paper-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Wordmark size={20} />
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-1.5 text-[13px] text-ink-500 hover:text-ink-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Torna alla Home
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* ── HERO ──────────────────────────────────────────────────── */}
        <section className="py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400 mb-4">
              Per le aziende
            </p>
            <h1 className="font-display text-display-1 text-ink-900 mb-6 leading-tight">
              Conosci davvero<br />il tuo team.
            </h1>
            <p className="text-[17px] text-ink-500 leading-relaxed mb-10 max-w-2xl">
              Misura le competenze trasversali di dipendenti e candidati. Confronta profili,
              identifica gap, costruisci percorsi di sviluppo. Tariffa flat per
              organizzazione — nessuna licenza per candidato.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="/aziende-trial"
                className="inline-flex items-center px-6 py-3 bg-sienna-600 hover:bg-sienna-700 text-paper-50 text-[14px] font-semibold rounded-sm transition-colors"
              >
                Richiedi il trial gratuito
              </a>
              <a
                href="mailto:info@valutolab.com"
                className="inline-flex items-center px-6 py-3 border border-ink-300 text-ink-700 hover:border-ink-600 hover:text-ink-900 text-[14px] font-medium rounded-sm transition-colors"
              >
                Parla con noi
              </a>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <img
              src="/graphics/hero-matrice-team.svg"
              alt=""
              aria-hidden="true"
              className="w-full max-w-[560px] h-auto"
            />
          </div>
        </section>

        {/* ── COME FUNZIONA ─────────────────────────────────────────── */}
        <section className="py-16 border-t border-paper-200">
          <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400 mb-3">
            Il processo
          </p>
          <h2 className="font-display text-display-3 text-ink-900 mb-12">
            Come funziona
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink p-7">
                <div className="flex items-center gap-3 mb-5">
                  <span className="font-mono text-[11px] text-ink-400">{String(i + 1).padStart(2, '0')}</span>
                  <Icon className="w-5 h-5 text-sienna-600" />
                </div>
                <h3 className="font-display text-[17px] font-medium text-ink-900 mb-2">{title}</h3>
                <p className="text-[13px] text-ink-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── COSA INCLUDE ──────────────────────────────────────────── */}
        <section className="py-16 border-t border-paper-200">
          <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400 mb-3">
            Incluso nel trial
          </p>
          <h2 className="font-display text-display-3 text-ink-900 mb-10">
            Cosa include il trial
          </h2>
          <div className="grid sm:grid-cols-2 gap-x-12 gap-y-4">
            {FEATURES.map(f => (
              <div key={f} className="flex items-start gap-3">
                <Check className="w-4 h-4 text-sienna-600 flex-shrink-0 mt-0.5" />
                <span className="text-[14px] text-ink-700">{f}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA FINALE ────────────────────────────────────────────── */}
        <section className="my-16 bg-ink-900 rounded-md p-12 text-center">
          <h2 className="font-display text-display-3 text-paper-50 mb-3">
            Inizia il trial gratuito.
          </h2>
          <p className="text-[15px] text-ink-400 mb-8 max-w-md mx-auto leading-relaxed">
            Attiva l&apos;accesso per la tua organizzazione.<br />
            Nessun impegno, nessuna carta di credito.
          </p>
          <a
            href="/aziende-trial"
            className="inline-flex items-center px-8 py-3.5 bg-sienna-600 hover:bg-sienna-700 text-paper-50 text-[15px] font-semibold rounded-sm transition-colors"
          >
            Richiedi accesso
          </a>
        </section>

      </main>
    </div>
  )
}
