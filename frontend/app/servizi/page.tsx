import Link from 'next/link'
import { Wordmark } from '@/components/ui/Wordmark'
import { CheckCircle, Download, Mail, Users, Target, Award } from 'lucide-react'

export default function ServiziPage() {
  return (
    <div className="min-h-screen bg-paper-100 font-body text-ink-900">

      {/* Header */}
      <header className="bg-paper-50 border-b border-paper-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/"><Wordmark size={20} /></Link>
            <nav className="flex items-center gap-6">
              <Link href="/trial" className="text-[13px] font-medium text-sienna-600 hover:text-sienna-800 transition-colors">
                Prova gratuitamente
              </Link>
              <Link href="/aziende-trial" className="text-[13px] text-ink-500 hover:text-ink-900 transition-colors">
                Per le aziende
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main>

        {/* Hero */}
        <section className="bg-paper-50 border-b border-paper-200 py-16 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-sienna-600 mb-3">
              Piattaforma di valutazione
            </p>
            <h1 className="font-display text-display-2 text-ink-900 mb-4">
              I nostri servizi
            </h1>
            <p className="text-[16px] text-ink-600 leading-relaxed max-w-xl mx-auto">
              ValutoLab misura le soft skill professionali attraverso assessment validati sul framework ESCO v1.2, producendo report con il supporto dell'intelligenza artificiale e dati strutturati per professionisti e team HR.
            </p>
          </div>
        </section>

        {/* Servizio 1 — Assessment Base */}
        <section className="py-16 px-6 border-b border-paper-200">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-start">

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-ink-900 rounded-sm flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5 text-paper-100" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400">Per professionisti</p>
                  <h2 className="font-display text-[26px] text-ink-900 leading-tight">Assessment Base</h2>
                </div>
              </div>

              <p className="text-[15px] text-ink-700 leading-relaxed mb-6">
                Il punto di partenza di ValutoLab. Le persone scoprono il proprio profilo di 12 competenze trasversali mappate sul framework ESCO v1.2, con un report AI qualitativo, un piano d'azione personalizzato, un badge certificato per LinkedIn e un QR code da inserire nel CV che certifica le competenze dichiarate. Per le aziende è la base da cui si costruisce ogni analisi successiva: dal confronto candidati al report di team aggregato.
              </p>

              <ul className="space-y-2.5 mb-8">
                {[
                  '12 competenze trasversali su scala ESCO 1–5',
                  'Report AI qualitativo con profilo professionale',
                  'Piano di sviluppo a 90 giorni',
                  'Badge certificato e profilo pubblico con QR code',
                  'Export PDF scaricabile',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-[#2D6A4F] flex-shrink-0 mt-0.5" />
                    <span className="text-[13px] text-ink-700">{f}</span>
                  </li>
                ))}
              </ul>

              <p className="text-[12px] text-ink-400 mb-5">
                Ideale per professionisti, candidati in cerca di lavoro e chiunque voglia conoscere il proprio profilo di competenze.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/demo/report-assessment-base-demo.pdf"
                  target="_blank"
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-paper-300 bg-paper-50 text-ink-700 text-[13px] font-medium rounded-sm hover:bg-paper-200 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Scarica report di esempio
                </Link>
                <Link
                  href="/trial"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-ink-900 text-paper-50 text-[13px] font-medium rounded-sm hover:bg-ink-700 transition-colors"
                >
                  Prova gratuitamente
                </Link>
              </div>
            </div>

            {/* Preview card */}
            <div className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink p-6 space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400">Competenze valutate</p>
              <div className="space-y-3">
                {[
                  { label: 'Problem Solving',  score: 4.2, color: '#1B4332' },
                  { label: 'Resilienza',       score: 4.2, color: '#1B4332' },
                  { label: 'Adattabilità',     score: 4.0, color: '#2D6A4F' },
                  { label: 'Comunicazione',    score: 3.9, color: '#2D6A4F' },
                  { label: 'Leadership',       score: 3.9, color: '#2D6A4F' },
                  { label: 'Decision Making',  score: 3.8, color: '#2D6A4F' },
                ].map(({ label, score, color }) => (
                  <div key={label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[12px] text-ink-700">{label}</span>
                      <span className="text-[12px] font-mono font-semibold text-ink-700">{score.toFixed(1)}</span>
                    </div>
                    <div className="w-full bg-paper-200 rounded-sm h-1.5">
                      <div className="h-1.5 rounded-sm" style={{ width: `${(score / 5) * 100}%`, backgroundColor: color }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-ink-400 pt-1">Esempio di report — Mario Rossi, Professionista Mid-Level</p>
            </div>
          </div>
        </section>

        {/* Servizio 2 — Focus Assessment */}
        <section className="py-16 px-6 border-b border-paper-200 bg-paper-50">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-start">

            {/* Preview card */}
            <div className="bg-paper-100 border border-paper-200 rounded-md shadow-sm-ink p-6 space-y-4 order-2 md:order-1">
              <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400">Esempio analisi team — 8 candidati</p>
              <div className="space-y-3">
                {[
                  { name: 'Alessandro C.',  score: 3.5, color: '#2D6A4F' },
                  { name: 'Marco F.',       score: 3.15, color: '#2D6A4F' },
                  { name: 'Chiara D.',      score: 3.15, color: '#2D6A4F' },
                  { name: 'Valentina M.',   score: 2.98, color: '#D4A017' },
                  { name: 'Giulia R.',      score: 2.98, color: '#D4A017' },
                  { name: 'Davide R.',      score: 2.63, color: '#D4A017' },
                  { name: 'Luca E.',        score: 2.10, color: '#D4A017' },
                  { name: 'Sara B.',        score: 1.75, color: '#C0392B' },
                ].map(({ name, score, color }) => (
                  <div key={name} className="flex items-center gap-3">
                    <span className="text-[12px] text-ink-600 w-32 flex-shrink-0">{name}</span>
                    <div className="flex-1 bg-paper-200 rounded-sm h-4 relative">
                      <div className="h-4 rounded-sm" style={{ width: `${(score / 5) * 100}%`, backgroundColor: color }} />
                    </div>
                    <span className="font-mono text-[11px] text-ink-700 w-8 text-right flex-shrink-0">{score.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-ink-400 pt-1">Competenza: Leadership · Azienda Demo ValutoLab</p>
            </div>

            <div className="order-1 md:order-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-sienna-600 rounded-sm flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-paper-100" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400">Per aziende HR</p>
                  <h2 className="font-display text-[26px] text-ink-900 leading-tight">Focus Assessment</h2>
                </div>
              </div>

              <p className="text-[15px] text-ink-700 leading-relaxed mb-6">
                Valutazione mirata su 1–3 competenze scelte dall'HR, ideale per screening e selezione
                su ruoli specifici. Genera report aggregati di team con analisi AI, mappa delle
                competenze e raccomandazioni per il responsabile HR.
              </p>

              <ul className="space-y-2.5 mb-8">
                {[
                  'Selezione di 1–3 competenze target per ogni processo',
                  'Inviti personalizzati per ogni candidato',
                  'Dashboard HR con confronto candidati',
                  'Report di team aggregato con analisi AI',
                  'Export CSV e PDF del report aggregato',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-[#2D6A4F] flex-shrink-0 mt-0.5" />
                    <span className="text-[13px] text-ink-700">{f}</span>
                  </li>
                ))}
              </ul>

              <p className="text-[12px] text-ink-400 mb-5">
                Per aziende HR che valutano candidati su competenze specifiche di ruolo.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/demo/report-team-demo.pdf"
                  target="_blank"
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-paper-300 bg-paper-100 text-ink-700 text-[13px] font-medium rounded-sm hover:bg-paper-200 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Scarica report di esempio
                </Link>
                <a
                  href="mailto:info@valutolab.com?subject=Informazioni Focus Assessment"
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-sienna-600 text-sienna-600 text-[13px] font-medium rounded-sm hover:bg-sienna-50 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Richiedi informazioni
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Servizio 3 — Leadership Deep Dive */}
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-start">

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-ink-900 rounded-sm flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-paper-100" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400">Per manager e team leader</p>
                  <h2 className="font-display text-[26px] text-ink-900 leading-tight">Leadership Deep Dive</h2>
                </div>
              </div>

              <p className="text-[15px] text-ink-700 leading-relaxed mb-6">
                Assessment avanzato che analizza 30 scenari situazionali su 6 dimensioni manageriali — Visione Strategica, People Management, Decisionalità, Change Management, Influenza e Orientamento ai Risultati. Utile sia per chi già gestisce persone sia per valutare la nomina a un ruolo di responsabilità, anticipando lo stile di leadership che la persona esprimerà.
              </p>

              <ul className="space-y-2.5 mb-8">
                {[
                  '30 scenari situazionali specifici per leader',
                  '6 dimensioni manageriali con benchmark',
                  'Identificazione dello stile di leadership prevalente',
                  'Piano d\'azione con azioni concrete e risorse',
                  'Report AI avanzato con insights comportamentali',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-[#2D6A4F] flex-shrink-0 mt-0.5" />
                    <span className="text-[13px] text-ink-700">{f}</span>
                  </li>
                ))}
              </ul>

              <p className="text-[12px] text-ink-400 mb-5">
                Per manager, team leader e chiunque gestisca persone o aspiri a ruoli di guida.
              </p>

              <a
                href="mailto:info@valutolab.com?subject=Informazioni Leadership Deep Dive"
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-paper-300 bg-paper-50 text-ink-700 text-[13px] font-medium rounded-sm hover:bg-paper-200 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Richiedi informazioni
              </a>
            </div>

            {/* Dimensioni card */}
            <div className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink p-6">
              <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400 mb-5">6 dimensioni analizzate</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Visione Strategica',
                  'People Management',
                  'Decisionalità',
                  'Change Management',
                  'Influenza',
                  'Orientamento ai Risultati',
                ].map(dim => (
                  <div key={dim} className="bg-paper-100 border border-paper-200 rounded-sm px-3 py-2.5">
                    <span className="text-[12px] font-medium text-ink-800">{dim}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-5 border-t border-paper-200">
                <p className="text-[12px] text-ink-500 leading-relaxed">
                  Ogni dimensione è analizzata attraverso scenari comportamentali realistici
                  calibrati su contesti manageriali italiani.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA bottom */}
        <section className="bg-ink-900 py-14 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400 mb-3">Inizia ora</p>
            <h2 className="font-display text-display-3 text-paper-50 mb-3">Scopri il tuo profilo di competenze</h2>
            <p className="text-[14px] text-ink-400 mb-8">
              L'Assessment Base è gratuito. Completa il questionario e ricevi il tuo report in pochi minuti.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/trial"
                className="px-6 py-3 bg-paper-50 text-ink-900 text-[14px] font-semibold rounded-sm hover:bg-paper-200 transition-colors"
              >
                Prova gratuitamente
              </Link>
              <Link
                href="/aziende-trial"
                className="px-6 py-3 border border-ink-600 text-ink-300 text-[14px] font-medium rounded-sm hover:border-ink-400 hover:text-paper-50 transition-colors"
              >
                Soluzione per aziende
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* Footer minimo */}
      <footer className="bg-paper-50 border-t border-paper-200 py-6 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Wordmark size={16} />
          <p className="text-[11px] text-ink-400">
            <a href="mailto:info@valutolab.com" className="hover:text-ink-700 transition-colors">info@valutolab.com</a>
          </p>
        </div>
      </footer>

    </div>
  )
}
