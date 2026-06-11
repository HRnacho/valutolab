'use client'

import { useState } from 'react'
import { CheckCircle, Users, BarChart3, Mail, Building2, ArrowRight, Clock } from 'lucide-react'
import { Wordmark } from '@/components/ui/Wordmark'
import { Button } from '@/components/ui/Button'

export default function AgenziaTrialLanding() {
  const [formData, setFormData] = useState({ fullName: '', email: '', company: '', phone: '', employees: '', sector: '' })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.valutolab.com'
      const response = await fetch(`${apiUrl}/api/v1/trial/create`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: formData.company, contact_name: formData.fullName,
          contact_email: formData.email, contact_phone: formData.phone,
          notes: `Dipendenti: ${formData.employees} | Settore: ${formData.sector}`
        })
      })
      if (response.ok) setSubmitted(true)
      else { const d = await response.json(); alert(d.error || "Errore durante l'invio. Riprova.") }
    } catch { alert('Errore durante l\'invio. Riprova o contattaci direttamente.') }
    finally { setLoading(false) }
  }

  const inputCls = 'w-full px-4 py-2.5 border border-paper-300 rounded-sm bg-paper-100 focus:border-ink-600 focus:outline-none font-body text-[14px] text-ink-900 placeholder-ink-400'
  const labelCls = 'block text-[12px] font-medium text-ink-600 mb-1.5'

  const faqs = [
    ['Il trial è davvero gratuito?', 'Sì, assolutamente. Ricevi fino a 20 assessment gratuiti per 30 giorni. Dopo il trial, se ti interessa continuare, parliamo insieme di un piano su misura.'],
    ['Quanto tempo ci vuole per attivare il trial?', 'Massimo 2 ore lavorative. Compili il form, noi creiamo il tuo account e ti inviamo le credenziali via email.'],
    ['Come funziona l\'assessment per i candidati?', 'Tu inserisci l\'email del candidato nella dashboard. Lui riceve un link univoco, risponde a 60 domande (15-20 min) e tu vedi i risultati immediatamente.'],
    ['Cosa succede dopo i 30 giorni?', 'Nulla in automatico. Non addebitiamo nulla. Ti contattiamo per sapere come è andato il trial e se vuoi continuare.'],
    ['I dati dei candidati sono sicuri?', 'Sì, siamo GDPR compliant. I dati sono criptati, ospitati in server EU, visibili solo a te.'],
    ['Ricevo supporto durante il trial?', 'Sì! Call di onboarding 15 minuti + supporto email con risposta entro 24h.'],
  ]

  if (submitted) {
    return (
      <div className="min-h-screen bg-paper-100 font-body flex items-center justify-center px-4">
        <div className="max-w-lg w-full">
          <div className="bg-paper-50 border border-paper-200 rounded-md shadow-md-ink p-10 text-center">
            <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-6 h-6 text-level-avanzato" />
            </div>
            <h1 className="font-display text-[28px] font-medium text-ink-900 mb-3">Richiesta Ricevuta!</h1>
            <p className="text-[15px] text-ink-500 mb-8">Abbiamo ricevuto la tua richiesta di trial gratuito.</p>

            <div className="space-y-4 text-left mb-8">
              {[
                ['Entro 2 ore', 'riceverai un\'email con il link per accedere alla piattaforma'],
                ['Ti chiameremo', 'per una call di onboarding di 15 minuti (opzionale ma consigliata)'],
                ['Inizia subito', 'a valutare i tuoi candidati con 20 assessment gratuiti'],
              ].map(([bold, rest], i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-ink-900 rounded-sm flex items-center justify-center text-[10px] font-bold text-paper-50 flex-shrink-0 mt-0.5">{i + 1}</div>
                  <p className="text-[13px] text-ink-700"><strong>{bold}</strong> {rest}</p>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <p className="text-[12px] text-amber-800">
                <strong>Controlla la tua casella email</strong> (anche spam/promozioni).<br />
                Se non ricevi nulla entro 2 ore: <a href="mailto:info@valutolab.com" className="underline">info@valutolab.com</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper-100 font-body text-ink-900">

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className="bg-paper-50 border-b border-paper-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Wordmark size={20} />
            <a href="mailto:info@valutolab.com"
              className="flex items-center gap-1.5 text-[13px] text-ink-600 hover:text-ink-900 transition-colors">
              <Mail className="w-4 h-4" /> Contattaci
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO + FORM ──────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-start">

          {/* LEFT */}
          <div>
            <span className="inline-block text-[10px] font-semibold uppercase tracking-eyebrow text-sienna-600 bg-sienna-50 border border-sienna-300 px-3 py-1 rounded-sm mb-6">
              Offerta Esclusiva per Aziende
            </span>
            <h1 className="font-display text-display-1 text-ink-900 mb-5 leading-tight">
              Valuta il tuo team. <span className="text-sienna-600">Parti oggi.</span>
            </h1>
            <p className="text-[16px] text-ink-600 mb-8 leading-relaxed">
              Attiva il trial gratuito per la tua organizzazione. Invita il team, raccogli i profili, decidi con dati reali.
            </p>

            <div className="space-y-3 mb-10">
              {[
                'fino a 20 assessment gratuiti per 30 giorni di trial',
                'Report dettagliati per ogni candidato in tempo reale',
                'Zero costi — provi completamente gratis',
                'Supporto dedicato e call di onboarding inclusa',
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-level-avanzato flex-shrink-0 mt-0.5" />
                  <p className="text-[14px] text-ink-700" dangerouslySetInnerHTML={{ __html: text.replace(/^(.*?)(\s—|\s–|\s-\s)/, '<strong>$1</strong>$2') }} />
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 text-[12px] text-ink-500">
              {[[Clock, 'Attivazione entro 2 ore'], [Building2, 'GDPR Compliant']].map(([Icon, label]: any) => (
                <div key={label} className="flex items-center gap-1.5"><Icon className="w-4 h-4" />{label}</div>
              ))}
            </div>

            {/* rete-team: profili connessi su base confrontabile */}
            <div aria-hidden="true" className="hidden lg:block mt-10 w-full max-w-sm opacity-80">
              <img src="/graphics/rete-team.svg" alt="" className="w-full" />
            </div>
          </div>

          {/* RIGHT — FORM */}
          <div className="bg-paper-50 border border-paper-200 rounded-md shadow-md-ink p-8">
            <h2 className="font-display text-[24px] font-medium text-ink-900 mb-1 text-center">Attiva il Trial Gratuito</h2>
            <p className="text-[13px] text-ink-500 text-center mb-6">Compila il form e ricevi l'accesso entro 2 ore</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelCls}>Nome e Cognome *</label>
                <input type="text" name="fullName" required value={formData.fullName} onChange={handleChange}
                  className={inputCls} placeholder="Mario Rossi" />
              </div>
              <div>
                <label className={labelCls}>Email Aziendale *</label>
                <input type="email" name="email" required value={formData.email} onChange={handleChange}
                  className={inputCls} placeholder="mario.rossi@azienda.it" />
              </div>
              <div>
                <label className={labelCls}>Nome Azienda *</label>
                <input type="text" name="company" required value={formData.company} onChange={handleChange}
                  className={inputCls} placeholder="Ragione Sociale" />
              </div>
              <Button type="submit" variant="primary" disabled={loading} className="w-full justify-center mt-2">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-paper-50 border-t-transparent rounded-full animate-spin" />
                    Invio in corso…
                  </span>
                ) : <><span>Attiva Trial Gratuito</span><ArrowRight className="w-4 h-4" /></>}
              </Button>

              <p className="text-[10px] text-ink-400 text-center">
                Compilando il form accetti la nostra{' '}
                <a href="/privacy" className="underline hover:text-ink-700">Privacy Policy</a>
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* ── COSA INCLUDE ─────────────────────────────────────────────── */}
      <section className="bg-paper-50 border-y border-paper-200 py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-display text-[28px] font-medium text-ink-900 mb-2">Cosa Include il Trial Gratuito</h2>
            <p className="text-[15px] text-ink-500">Tutto ciò di cui hai bisogno per trovare i candidati perfetti</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: BarChart3, title: '20 Assessment Inclusi', desc: 'Valuta fino a 20 candidati con assessment completi di 60 domande scientifiche sulle soft skills', items: ['12 categorie soft skills', 'Report AI dettagliati', 'Risultati in tempo reale'] },
              { icon: Users, title: 'Dashboard Comparazione', desc: 'Confronta fino a 4 candidati affiancati per trovare il match perfetto per ogni posizione', items: ['Vista side-by-side', 'Grafici comparativi', 'Export PDF'] },
              { icon: Mail, title: 'Supporto Dedicato', desc: 'Non sei solo: ti affianchiamo con onboarding personalizzato e supporto continuo', items: ['Call onboarding 15min', 'Email support', 'Guide e tutorial'] },
            ].map(({ icon: Icon, title, desc, items }) => (
              <div key={title} className="bg-paper-100 border border-paper-200 rounded-md p-6">
                <div className="w-10 h-10 bg-ink-900 rounded-md flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-paper-50" />
                </div>
                <h3 className="font-display text-[16px] font-medium text-ink-900 mb-2">{title}</h3>
                <p className="text-[13px] text-ink-600 mb-4 leading-relaxed">{desc}</p>
                <ul className="space-y-1.5">
                  {items.map(item => (
                    <li key={item} className="flex items-center gap-2 text-[12px] text-ink-600">
                      <CheckCircle className="w-3.5 h-3.5 text-level-avanzato" />{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COME FUNZIONA ────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-display text-[28px] font-medium text-ink-900 mb-2">Come Funziona</h2>
            <p className="text-[15px] text-ink-500">In 3 semplici passi inizi a valutare i tuoi candidati</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              ['Compila il Form', 'Bastano 2 minuti. Inserisci i tuoi dati e la tua azienda.'],
              ['Ricevi Accesso', 'Entro 2 ore ricevi email con credenziali per accedere alla piattaforma.'],
              ['Invita Candidati', 'Inserisci email candidato, lui fa assessment, tu vedi risultati.'],
            ].map(([title, desc], i) => (
              <div key={title} className="text-center">
                <div className="w-12 h-12 bg-ink-900 text-paper-50 rounded-md flex items-center justify-center text-[16px] font-bold mx-auto mb-4">{i + 1}</div>
                <h3 className="font-display text-[16px] font-medium text-ink-900 mb-1">{title}</h3>
                <p className="text-[13px] text-ink-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="bg-paper-50 border-y border-paper-200 py-16">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 className="font-display text-[28px] font-medium text-ink-900 text-center mb-8">Domande Frequenti</h2>
          <div className="space-y-2">
            {faqs.map(([q, a]) => (
              <details key={q} className="bg-paper-100 border border-paper-200 rounded-md p-5 cursor-pointer group">
                <summary className="text-[14px] font-medium text-ink-900 list-none">{q}</summary>
                <p className="text-[13px] text-ink-600 mt-3 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────── */}
      <section className="bg-ink-900 py-16">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-display text-display-3 text-paper-50 mb-4">Inizia il trial gratuito.</h2>
          <p className="text-[15px] text-ink-400 mb-8">30 giorni per valutare il tuo team.</p>
          <button
            onClick={() => document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center gap-2 bg-paper-50 text-ink-900 font-semibold px-8 py-3 rounded-sm hover:bg-paper-100 transition-colors"
          >
            Attiva Trial Gratuito <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-[12px] text-ink-500 mt-4">30 giorni · 20 assessment inclusi</p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="bg-ink-950 py-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <Wordmark size={18} className="mb-3" />
              <p className="text-[12px] text-ink-500">La piattaforma per valutare le soft skills professionali con tecnologia AI.</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400 mb-3">Contatti</p>
              <p className="text-[12px] text-ink-500">info@valutolab.com</p>
              <p className="text-[12px] text-ink-500">www.valutolab.com</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400 mb-3">Legale</p>
              <a href="/privacy" className="text-[12px] text-ink-500 hover:text-paper-200 block">Privacy Policy</a>
              <a href="/terms" className="text-[12px] text-ink-500 hover:text-paper-200 block mt-1">Termini e Condizioni</a>
            </div>
          </div>
          <div className="border-t border-ink-800 pt-6 text-center">
            <p className="text-[11px] text-ink-600">© 2026 ValutoLab. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
