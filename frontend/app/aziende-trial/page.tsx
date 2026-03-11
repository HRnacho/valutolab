'use client';

import { useState } from 'react';
import { CheckCircle, Users, BarChart3, Clock, Mail, Building2, ArrowRight, Sparkles } from 'lucide-react';

export default function AgenziaTrialLanding() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    company: '',
    phone: '',
    employees: '',
    sector: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.valutolab.com';
      const response = await fetch(`${apiUrl}/api/v1/trial/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: formData.company,
          contact_name: formData.fullName,
          contact_email: formData.email,
          contact_phone: formData.phone,
          notes: `Dipendenti: ${formData.employees} | Settore: ${formData.sector}`
        })
      });
      
      if (response.ok) {
        setSubmitted(true);
      } else {
        const data = await response.json();
        alert(data.error || 'Errore durante l\'invio. Riprova.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Errore durante l\'invio. Riprova o contattaci direttamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-2xl text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Richiesta Ricevuta! 🎉
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            Abbiamo ricevuto la tua richiesta di trial gratuito.
          </p>
          
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Cosa succede ora?
            </h2>
            
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 font-semibold">1</span>
                </div>
                <div>
                  <p className="text-gray-700">
                    <strong>Entro 2 ore</strong> riceverai un'email con il link per accedere alla piattaforma
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 font-semibold">2</span>
                </div>
                <div>
                  <p className="text-gray-700">
                    <strong>Ti chiameremo</strong> per una call di onboarding di 15 minuti (opzionale ma consigliata)
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 font-semibold">3</span>
                </div>
                <div>
                  <p className="text-gray-700">
                    <strong>Inizia subito</strong> a valutare i tuoi candidati con 20 assessment gratuiti
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-sm text-yellow-800">
              <strong>Controlla la tua casella email</strong> (anche spam/promozioni).<br />
              Se non ricevi nulla entro 2 ore, contattaci: <a href="mailto:info@valutolab.com" className="underline">info@valutolab.com</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">V</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">ValutoLab</span>
            </div>
            
            <a 
              href="mailto:info@valutolab.com" 
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
            >
              <Mail className="w-5 h-5" />
              Contattaci
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Headline & Value Prop */}
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              Offerta Esclusiva per Aziende
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Trova i Candidati Perfetti con
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Assessment Scientifici</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Valuta le soft skills dei tuoi candidati in 15 minuti con tecnologia AI e framework scientifico. 
              Riduci il turnover, aumenta la retention, trova il match perfetto.
            </p>
            
            {/* Key Benefits */}
            <div className="space-y-4 mb-10">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <p className="text-gray-700">
                  <strong>fino a 20 assessment gratuiti</strong> per 30 giorni di trial
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <p className="text-gray-700">
                  <strong>Report dettagliati</strong> per ogni candidato in tempo reale
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <p className="text-gray-700">
                  <strong>Zero costi, zero carte di credito</strong> - Provi completamente gratis
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <p className="text-gray-700">
                  <strong>Supporto dedicato</strong> e call di onboarding inclusa
                </p>
              </div>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>Usato da 50+ aziende</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>Attivazione entro 2 ore</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                <span>GDPR Compliant</span>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 lg:p-10 border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Attiva il Trial Gratuito
              </h2>
              <p className="text-gray-600">
                Compila il form e ricevi l'accesso entro 2 ore
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome e Cognome *
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Mario Rossi"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Aziendale *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="mario.rossi@azienda.it"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Azienda *
                </label>
                <input
                  type="text"
                  name="company"
                  required
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Ragione Sociale"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefono
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="+39 333 123 4567"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numero Dipendenti
                </label>
                <select
                  name="employees"
                  value={formData.employees}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  <option value="">Seleziona...</option>
                  <option value="1-10">1-10 dipendenti</option>
                  <option value="10-50">10-50 dipendenti</option>
                  <option value="50-200">50-200 dipendenti</option>
                  <option value="200+">200+ dipendenti</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Settore
                </label>
                <input
                  type="text"
                  name="sector"
                  value={formData.sector}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Es: Tecnologia, Retail, Manifatturiero..."
                />
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Invio in corso...
                    </>
                  ) : (
                    <>
                      Attiva Trial Gratuito
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
              
              <p className="text-xs text-gray-500 text-center">
                Compilando il form accetti la nostra{' '}
                <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-white py-16 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Cosa Include il Trial Gratuito
            </h2>
            <p className="text-xl text-gray-600">
              Tutto ciò di cui hai bisogno per trovare i candidati perfetti
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 border border-blue-200">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">20 Assessment Inclusi</h3>
              <p className="text-gray-700 mb-4">
                Valuta fino a 20 candidati con assessment completi di 60 domande scientifiche sulle soft skills
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" />12 categorie soft skills</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" />Report AI dettagliati</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" />Risultati in tempo reale</li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-8 border border-purple-200">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Dashboard Comparazione</h3>
              <p className="text-gray-700 mb-4">
                Confronta fino a 4 candidati affiancati per trovare il match perfetto per ogni posizione
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" />Vista side-by-side</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" />Grafici comparativi</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" />Export PDF</li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8 border border-green-200">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-6">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Supporto Dedicato</h3>
              <p className="text-gray-700 mb-4">
                Non sei solo: ti affianchiamo con onboarding personalizzato e supporto continuo
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" />Call onboarding 15min</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" />Email support</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" />Guide e tutorial</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Come Funziona</h2>
            <p className="text-xl text-gray-600">In 3 semplici passi inizi a valutare i tuoi candidati</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">1</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Compila il Form</h3>
              <p className="text-gray-600">Bastano 2 minuti. Inserisci i tuoi dati e la tua azienda.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">2</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Ricevi Accesso</h3>
              <p className="text-gray-600">Entro 2 ore ricevi email con credenziali per accedere alla piattaforma.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">3</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Invita Candidati</h3>
              <p className="text-gray-600">Inserisci email candidato, lui fa assessment, tu vedi risultati.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Domande Frequenti</h2>
          
          <div className="space-y-6">
            <details className="bg-gray-50 rounded-lg p-6 cursor-pointer hover:bg-gray-100 transition">
              <summary className="font-semibold text-gray-900 text-lg">Il trial è davvero gratuito?</summary>
              <p className="text-gray-600 mt-4">Sì, assolutamente. Non ti chiediamo nessuna carta di credito. Ricevi fino a 20 assessment gratuiti per 30 giorni. Dopo il trial, se ti interessa continuare, parliamo insieme di un piano su misura.</p>
            </details>
            <details className="bg-gray-50 rounded-lg p-6 cursor-pointer hover:bg-gray-100 transition">
              <summary className="font-semibold text-gray-900 text-lg">Quanto tempo ci vuole per attivare il trial?</summary>
              <p className="text-gray-600 mt-4">Massimo 2 ore lavorative. Compili il form, noi creiamo il tuo account e ti inviamo le credenziali via email. Se compili il form di mattina, spesso attivi entro 1 ora.</p>
            </details>
            <details className="bg-gray-50 rounded-lg p-6 cursor-pointer hover:bg-gray-100 transition">
              <summary className="font-semibold text-gray-900 text-lg">Come funziona l'assessment per i candidati?</summary>
              <p className="text-gray-600 mt-4">Tu inserisci l'email del candidato nella dashboard. Lui riceve un'email con un link univoco. Clicca il link, risponde a 60 domande (15-20 minuti), e tu vedi i risultati immediatamente nella tua dashboard.</p>
            </details>
            <details className="bg-gray-50 rounded-lg p-6 cursor-pointer hover:bg-gray-100 transition">
              <summary className="font-semibold text-gray-900 text-lg">Cosa succede dopo i 30 giorni?</summary>
              <p className="text-gray-600 mt-4">Nulla in automatico. Non addebitiamo nulla. Ti contattiamo per sapere come è andato il trial e se vuoi continuare. Se sì, costruiamo insieme un piano su misura per le tue esigenze.</p>
            </details>
            <details className="bg-gray-50 rounded-lg p-6 cursor-pointer hover:bg-gray-100 transition">
              <summary className="font-semibold text-gray-900 text-lg">I dati dei candidati sono sicuri?</summary>
              <p className="text-gray-600 mt-4">Assolutamente. Siamo GDPR compliant. I dati sono criptati, ospitati in server EU, e visibili solo a te. I candidati possono richiedere cancellazione dati in qualsiasi momento.</p>
            </details>
            <details className="bg-gray-50 rounded-lg p-6 cursor-pointer hover:bg-gray-100 transition">
              <summary className="font-semibold text-gray-900 text-lg">Ricevo supporto durante il trial?</summary>
              <p className="text-gray-600 mt-4">Sì! Ti offriamo una call di onboarding di 15 minuti per mostrarti come funziona la piattaforma. Inoltre puoi scriverci via email in qualsiasi momento e ti rispondiamo entro 24h.</p>
            </details>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Pronto a Trovare i Candidati Perfetti?</h2>
          <p className="text-xl text-blue-100 mb-8">Inizia oggi con 20 assessment gratuiti. Nessuna carta di credito richiesta.</p>
          
            href="#form"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 bg-white text-blue-600 font-semibold py-4 px-8 rounded-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Attiva Trial Gratuito
            <ArrowRight className="w-5 h-5" />
          </a>
          <p className="text-blue-100 mt-6 text-sm">Attivazione in 2 ore • 30 giorni gratis • 20 assessment inclusi</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">V</span>
                </div>
                <span className="text-xl font-bold">ValutoLab</span>
              </div>
              <p className="text-gray-400 text-sm">La piattaforma per valutare le soft skills professionali con tecnologia AI.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contatti</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <p>Email: info@valutolab.com</p>
                <p>Web: www.valutolab.com</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legale</h3>
              <div className="space-y-2 text-sm">
                <a href="/privacy" className="text-gray-400 hover:text-white block">Privacy Policy</a>
                <a href="/terms" className="text-gray-400 hover:text-white block">Termini e Condizioni</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2026 ValutoLab. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
