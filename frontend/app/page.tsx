'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { Wordmark } from '@/components/ui/Wordmark'
import { Button } from '@/components/ui/Button'
import { EscoChip } from '@/components/ui/EscoChip'
import { LevelTrack } from '@/components/ui/LevelTrack'
import {
  BarChart3, FileText, Users, Award,
  Check, ChevronRight, ArrowRight,
  LayoutGrid, UserPlus, Download, Lock
} from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [ownerOrgId, setOwnerOrgId] = useState<string | null>(null)

  useEffect(() => {
    if (loading || !user) return
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.valutolab.com'
    const token = localStorage.getItem('jwt_access_token')
    fetch(`${apiUrl}/api/organizations/my`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.organizations?.length > 0) setOwnerOrgId(data.organizations[0].id) })
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
                <a key={label} href={`#${label.toLowerCase()}`}
                  className="font-body text-[14px] text-ink-600 hover:text-sienna-600 transition-colors">
                  {label}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Button variant="primary" onClick={() => router.push('/dashboard')}>Dashboard</Button>
                  {ownerOrgId && (
                    <Button variant="secondary" onClick={() => router.push(`/aziende/dashboard?org=${ownerOrgId}`)}>Dashboard HR</Button>
                  )}
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => router.push('/login')}>Accedi</Button>
                  <Button variant="secondary" onClick={() => router.push('/register')}>Registrati</Button>
                  <Button variant="accent" onClick={() => router.push('/servizi')}>Inizia l&apos;assessment</Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="border-b border-paper-200 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-0 items-center min-h-[620px]">

            {/* Left column — copy */}
            <div className="py-24 lg:py-36 lg:pr-16 relative z-10">
              {/* traiettoria-crescita: decorazione dietro il testo, posizionata in basso */}
              <div aria-hidden="true"
                className="absolute bottom-0 left-0 w-80 opacity-[0.07] pointer-events-none select-none">
                <img src="/graphics/traiettoria-crescita.svg" alt="" />
              </div>

              <p className="font-mono text-eyebrow text-ink-500 uppercase tracking-eyebrow mb-8">
                § 01 — Assessment professionale
              </p>
              <h1 className="font-display text-display-1 text-ink-900 mb-8 max-w-xl">
                Dodici competenze.<br />
                Uno standard <em>europeo</em>.
              </h1>
              <p className="font-body text-lede text-ink-600 max-w-lg mb-10">
                Scopri il tuo profilo professionale in quaranta minuti. Dodici competenze misurate, un&apos;analisi che parla di te.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="accent" className="text-[16px] px-8 py-4" onClick={() => router.push('/servizi')}>
                  Inizia l&apos;assessment
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

            {/* Right column — report-preview inlinato */}
            <div className="hidden lg:flex items-center justify-center py-12 pl-8">
              <div className="w-full max-w-[480px]">
                {/* SVG inlinato → eredita Space Grotesk / JetBrains Mono */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 500"
                  role="img" aria-label="Anteprima del report ValutoLab"
                  className="w-full h-auto drop-shadow-2xl">
                  <defs>
                    <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="16" stdDeviation="20" floodColor="#0E1A2B" floodOpacity="0.10" />
                    </filter>
                  </defs>
                  <rect x="20" y="14" width="520" height="466" fill="#FBF8F2" stroke="#D9D0BC" strokeWidth="1" filter="url(#cardShadow)" />
                  {/* Header */}
                  <text x="56" y="62" fontFamily="'Space Grotesk',sans-serif" fontWeight="600" fontSize="19" letterSpacing="-0.2" fill="#0E1A2B">Marco Bianchi</text>
                  <text x="56" y="82" fontFamily="'JetBrains Mono',monospace" fontSize="10.5" letterSpacing="1.4" fill="#6F7E96">REPORT · 04 GIUGNO 2026</text>
                  {/* ESCO badge */}
                  <rect x="396" y="46" width="108" height="30" fill="#F6F2EA" stroke="#D9D0BC" strokeWidth="1" />
                  <circle cx="414" cy="61" r="7" fill="#0E1A2B" />
                  <text x="414" y="64.5" textAnchor="middle" fontFamily="sans-serif" fontSize="8" fill="#CF7556">★</text>
                  <text x="428" y="65" fontFamily="'JetBrains Mono',monospace" fontSize="11" fontWeight="600" letterSpacing="0.5" fill="#0E1A2B">ESCO v1.2</text>
                  {/* Separator */}
                  <line x1="56" y1="98" x2="504" y2="98" stroke="#ECE6D8" strokeWidth="1" />
                  {/* Score ring */}
                  <circle cx="100" cy="166" r="40" fill="none" stroke="#ECE6D8" strokeWidth="8" />
                  <circle cx="100" cy="166" r="40" fill="none" stroke="#2D5F73" strokeWidth="8"
                    strokeDasharray="251.3" strokeDashoffset="50.3" strokeLinecap="butt"
                    transform="rotate(-90 100 166)" />
                  <text x="100" y="172" textAnchor="middle" fontFamily="'Space Grotesk',sans-serif" fontWeight="300" fontSize="30" fill="#0E1A2B">4,0</text>
                  <text x="100" y="189" textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontSize="10" letterSpacing="0.8" fill="#6F7E96">/ 5,0</text>
                  <text x="166" y="159" fontFamily="'Space Grotesk',sans-serif" fontWeight="600" fontSize="17" letterSpacing="-0.2" fill="#0E1A2B">Profilo complessivo</text>
                  <text x="166" y="179" fontFamily="'JetBrains Mono',monospace" fontSize="10" letterSpacing="1.2" fill="#6F7E96">LIVELLO AVANZATO · EQF 5–7</text>
                  {/* Separator */}
                  <line x1="56" y1="228" x2="504" y2="228" stroke="#ECE6D8" strokeWidth="1" />
                  {/* Skill bars */}
                  <g fontFamily="'Space Grotesk',sans-serif">
                    <text x="56" y="262" fontWeight="500" fontSize="13" fill="#0E1A2B">Comunicazione</text>
                    <rect x="206" y="254" width="264" height="8" fill="#ECE6D8" />
                    <rect x="206" y="254" width="227" height="8" fill="#2D5F73" />
                    <text x="504" y="262" textAnchor="end" fontWeight="500" fontSize="14" fill="#2E3F58">4,3</text>
                    <text x="56" y="292" fontWeight="500" fontSize="13" fill="#0E1A2B">Empatia</text>
                    <rect x="206" y="284" width="264" height="8" fill="#ECE6D8" />
                    <rect x="206" y="284" width="216" height="8" fill="#2D5F73" />
                    <text x="504" y="292" textAnchor="end" fontWeight="500" fontSize="14" fill="#2E3F58">4,1</text>
                    <text x="56" y="322" fontWeight="500" fontSize="13" fill="#0E1A2B">Pensiero critico</text>
                    <rect x="206" y="314" width="264" height="8" fill="#ECE6D8" />
                    <rect x="206" y="314" width="206" height="8" fill="#4F7A53" />
                    <text x="504" y="322" textAnchor="end" fontWeight="500" fontSize="14" fill="#2E3F58">3,9</text>
                    <text x="56" y="352" fontWeight="500" fontSize="13" fill="#0E1A2B">Teamwork</text>
                    <rect x="206" y="344" width="264" height="8" fill="#ECE6D8" />
                    <rect x="206" y="344" width="190" height="8" fill="#4F7A53" />
                    <text x="504" y="352" textAnchor="end" fontWeight="500" fontSize="14" fill="#2E3F58">3,6</text>
                    <text x="56" y="382" fontWeight="500" fontSize="13" fill="#0E1A2B">Decisione</text>
                    <rect x="206" y="374" width="264" height="8" fill="#ECE6D8" />
                    <rect x="206" y="374" width="148" height="8" fill="#C68A2E" />
                    <text x="504" y="382" textAnchor="end" fontWeight="500" fontSize="14" fill="#2E3F58">2,8</text>
                  </g>
                  {/* Level pills */}
                  <g fontFamily="'JetBrains Mono',monospace" fontSize="10" fontWeight="600" letterSpacing="1">
                    <rect x="56" y="412" width="74" height="22" fill="#2D5F73" />
                    <text x="93" y="427" textAnchor="middle" fill="#FFFFFF">ESPERTO</text>
                    <rect x="138" y="412" width="86" height="22" fill="#4F7A53" />
                    <text x="181" y="427" textAnchor="middle" fill="#FFFFFF">AVANZATO</text>
                    <rect x="232" y="412" width="98" height="22" fill="#C68A2E" />
                    <text x="281" y="427" textAnchor="middle" fill="#FFFFFF">INTERMEDIO</text>
                  </g>
                </svg>
              </div>
            </div>

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
                title: 'Lettura personalizzata',
                body: "L'analisi non è un template. Ogni lettura è costruita sul tuo profilo specifico di risposte.",
                art: '/graphics/doppia-evidenza.svg',
              },
              {
                icon: <Award className="w-5 h-5" strokeWidth={1.5} />,
                title: 'Evidenza portabile',
                body: 'Badge LinkedIn, QR code verificabile, PDF vettoriale — strumenti che il professionista porta nel CV, nel colloquio, nel profilo online.',
              },
            ].map(({ icon, title, body, art }) => (
              <div key={title} className="bg-paper-50 p-10 flex flex-col gap-5">
                <div className="text-sienna-600">{icon}</div>
                <div>
                  <h3 className="font-display text-display-3 text-ink-900 mb-4">{title}</h3>
                  <p className="font-body text-body text-ink-600 leading-relaxed">{body}</p>
                </div>
                {art && (
                  <div aria-hidden="true" className="mt-auto pt-4 opacity-80">
                    <img src={art} alt="" className="w-full" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVIZI ──────────────────────────────────────────────── */}
      <section id="servizi" className="py-24 border-b border-paper-200">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1fr_auto] gap-12 items-start mb-16">
            <div>
              <p className="font-mono text-eyebrow text-ink-500 uppercase tracking-eyebrow mb-4">§ 03 — Servizi</p>
              <h2 className="font-display text-display-2 text-ink-900">Scegli l&apos;assessment</h2>
            </div>
            {/* costellazione-12: a lato del titolo servizi */}
            <div aria-hidden="true" className="hidden lg:block w-40 opacity-70 flex-shrink-0">
              <img src="/graphics/costellazione-12.svg" alt="" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-px bg-paper-200">
            {/* Assessment Base */}
            <div className="bg-paper-50 p-10 flex flex-col">
              <div className="mb-2">
                <span className="font-mono text-[11px] tracking-wider text-ink-500 uppercase">Assessment Base</span>
              </div>
              <h3 className="font-display text-display-3 text-ink-900 mb-2">Competenze Trasversali</h3>
              <p className="font-body text-body text-ink-600 mb-8">
                48 item Likert + 12 situational judgement. 12 competenze misurate, mappate ESCO.
              </p>
              <ul className="space-y-3 mb-10 flex-1">
                {['Valutazione 12 soft skills', 'Analisi qualitativa personalizzata', 'Profilo ESCO con URI verificabili', 'Badge LinkedIn + QR code', 'Certificato PDF'].map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-sienna-600 mt-1 flex-shrink-0" strokeWidth={1.5} />
                    <span className="font-body text-body text-ink-700">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <LevelTrack score={3.2} className="mb-2 opacity-40" />
                <p className="font-mono text-[10px] tracking-wider text-ink-400 uppercase mb-6">Livello di competenza secondo il framework ESCO v1.2</p>
                <Button variant="primary" className="w-full justify-center" onClick={() => router.push('/servizi')}>
                  Scopri di più <ChevronRight className="inline ml-1 w-4 h-4" strokeWidth={1.5} />
                </Button>
              </div>
            </div>

            {/* Leadership */}
            <div className="bg-ink-900 p-10 flex flex-col">
              <div className="mb-2">
                <span className="font-mono text-[11px] tracking-wider text-ink-400 uppercase">Assessment Premium</span>
              </div>
              <h3 className="font-display text-display-3 text-paper-50 mb-2">Leadership Deep Dive</h3>
              <p className="font-body text-body text-ink-300 mb-8">
                30 scenari situazionali avanzati. 6 dimensioni di leadership. Piano d&apos;azione 3–6 mesi.
              </p>
              <ul className="space-y-3 mb-10 flex-1">
                {["Stile di leadership personalizzato", "Analisi 6 dimensioni manageriali", "Piano d'azione con timeline", "Risorse consigliate", "Certificato PDF con piano d'azione"].map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-sienna-500 mt-1 flex-shrink-0" strokeWidth={1.5} />
                    <span className="font-body text-body text-ink-200">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <Button variant="accent" className="w-full justify-center" onClick={() => router.push('/servizi')}>
                  Scopri di più <ChevronRight className="inline ml-1 w-4 h-4" strokeWidth={1.5} />
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
                <p className="font-body text-caption text-ink-500">Mappa le competenze del tuo team e scopri come lavorano insieme.</p>
              </div>
            </div>
            <span className="font-mono text-[11px] tracking-wider text-ink-400 uppercase border border-paper-300 px-3 py-1.5">In sviluppo</span>
          </div>
        </div>
      </section>

      {/* ── AZIENDE ──────────────────────────────────────────────── */}
      <section id="aziende" className="py-24 border-b border-paper-200 bg-paper-50">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <p className="font-mono text-eyebrow text-ink-500 uppercase tracking-eyebrow mb-4">§ 04 — Soluzioni per aziende</p>
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
                Richiedi accesso <ArrowRight className="inline ml-2 w-4 h-4" strokeWidth={1.5} />
              </Button>
              {/* rete-team: sotto la CTA su desktop */}
              <div aria-hidden="true" className="hidden md:block mt-10 w-64 opacity-75">
                <img src="/graphics/rete-team.svg" alt="" />
              </div>
            </div>
            <ul className="space-y-5">
              {[
                ['Dashboard HR centralizzata', 'Tutti i profili in un posto, con filtri e comparazione.', <LayoutGrid key="lg" className="w-4 h-4 text-sienna-600 mt-1 flex-shrink-0" strokeWidth={1.5} />],
                ['Inviti illimitati', 'Invita candidati e dipendenti con link tracciato.', <UserPlus key="up" className="w-4 h-4 text-sienna-600 mt-1 flex-shrink-0" strokeWidth={1.5} />],
                ['Export per recruiting', 'Scarica i report del team in batch.', <Download key="dl" className="w-4 h-4 text-sienna-600 mt-1 flex-shrink-0" strokeWidth={1.5} />],
                ['Gestione permessi', 'Ruoli differenziati per HR, manager, candidato.', <Lock key="lk" className="w-4 h-4 text-sienna-600 mt-1 flex-shrink-0" strokeWidth={1.5} />],
              ].map(([title, desc, icon]) => (
                <li key={title as string} className="flex items-start gap-4 border-b border-paper-200 pb-5 last:border-0">
                  {icon}
                  <div>
                    <p className="font-display text-[16px] font-medium text-ink-900">{title as string}</p>
                    <p className="font-body text-caption text-ink-500 mt-0.5">{desc as string}</p>
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
          <p className="font-mono text-eyebrow text-ink-500 uppercase tracking-eyebrow mb-6">§ 05 — Inizia</p>
          <h2 className="font-display text-display-2 text-paper-50 mb-6">Un assessment che vale la lettura.</h2>
          <p className="font-body text-lede text-ink-400 mb-10">
            Quaranta minuti. Dodici competenze. Un report che parla di te, non di un template.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="accent" className="text-[16px] px-8 py-4" onClick={() => router.push('/servizi')}>
              Inizia come privato
            </Button>
            <Button variant="secondary"
              className="text-[16px] px-8 py-4 border-ink-600 text-ink-300 hover:border-paper-50 hover:text-paper-50"
              onClick={() => router.push('/aziende/create')}>
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
                Piattaforma professionale per l&apos;assessment delle competenze trasversali
                mappate sullo standard europeo ESCO v1.2.
              </p>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-ink-600 mb-4">Servizi</p>
              <ul className="space-y-2">
                {[['Assessment Base', '/servizi'], ['Leadership Deep Dive', '/servizi'], ['Soluzioni Aziende', '/aziende/create']].map(([label, href]) => (
                  <li key={label}><a href={href} className="font-body text-caption text-ink-500 hover:text-paper-50 transition-colors">{label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-ink-600 mb-4">Accesso</p>
              <ul className="space-y-2">
                {[['Accedi', '/login'], ['Registrati', '/register'], ['info@valutolab.com', 'mailto:info@valutolab.com']].map(([label, href]) => (
                  <li key={label}><a href={href} className="font-body text-caption text-ink-500 hover:text-paper-50 transition-colors">{label}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-ink-800 pt-8 flex flex-wrap justify-between items-center gap-4">
            <p className="font-mono text-[11px] text-ink-600">© 2026 ValutoLab · ESCO v1.2 · Commissione Europea</p>
            <p className="font-mono text-[11px] text-ink-700">Assessment · Reporting · Certificazione</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
