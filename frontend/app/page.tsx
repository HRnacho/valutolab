'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    checkUser()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl font-black text-white">V</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                ValutoLab
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#servizi" className="text-gray-700 hover:text-purple-600 font-medium transition">
                Servizi
              </a>
              <a href="#come-funziona" className="text-gray-700 hover:text-purple-600 font-medium transition">
                Come Funziona
              </a>
              <a href="#cosa-ottieni" className="text-gray-700 hover:text-purple-600 font-medium transition">
                Cosa Ottieni
              </a>
            </nav>

            <div className="flex items-center gap-3">
              {user ? (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:shadow-lg transition"
                >
                  Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => router.push('/servizi')}
                    className="hidden sm:block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:shadow-lg transition"
                  >
                    Per Privati
                  </button>
                  <button
                    onClick={() => router.push('/aziende/create')}
                    className="bg-gradient-to-r from-orange-500 to-pink-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:shadow-lg transition"
                  >
                    Per Aziende
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 mb-6 leading-tight">
              Scopri le Tue{' '}
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                Soft Skills
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-700 mb-12 leading-relaxed">
              Assessment professionale delle competenze trasversali con intelligenza artificiale.
              <br />
              Risultati immediati, certificati e badge per LinkedIn.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => router.push('/servizi')}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all"
              >
                🧑 Per Privati
              </button>
              
              <button
                onClick={() => router.push('/aziende/create')}
                className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-pink-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all"
              >
                🏢 Per Aziende
              </button>
            </div>

            <p className="mt-8 text-sm text-gray-600">
              ✨ Report AI • 📊 Certificati PDF • 🎯 Badge LinkedIn • 📱 QR Code
            </p>
          </div>
        </div>
      </section>

      {/* PERCHÉ VALUTOLAB */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Perché Scegliere ValutoLab
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              La piattaforma più completa per valutare e valorizzare le tue competenze
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 hover:shadow-xl transition">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                <span className="text-3xl">🤖</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Report AI Personalizzati</h3>
              <p className="text-gray-700 leading-relaxed">
                Analisi avanzata con Claude AI di Anthropic. Ogni report è unico e costruito sulle tue risposte.
              </p>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-2xl p-8 hover:shadow-xl transition">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-600 to-orange-600 rounded-xl flex items-center justify-center mb-6">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Risultati Immediati</h3>
              <p className="text-gray-700 leading-relaxed">
                15 minuti per completare l'assessment, report disponibile istantaneamente con badge e certificati.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 hover:shadow-xl transition">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Validato Scientificamente</h3>
              <p className="text-gray-700 leading-relaxed">
                Metodologia basata su framework riconosciuti e validati dalla ricerca in psicologia organizzativa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* I NOSTRI SERVIZI */}
      <section id="servizi" className="py-20 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              I Nostri Servizi
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Scegli l'assessment più adatto alle tue esigenze professionali
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Assessment Base */}
            <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition">
              <div className="text-center mb-6">
                <div className="inline-block bg-gradient-to-br from-purple-600 to-blue-600 rounded-full p-4 mb-4">
                  <span className="text-4xl">🎯</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Assessment Base</h3>
                <p className="text-gray-600">Competenze Trasversali</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 mt-1">✓</span>
                  <span className="text-gray-700">48 domande di autovalutazione</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 mt-1">✓</span>
                  <span className="text-gray-700">12 domande situazionali</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 mt-1">✓</span>
                  <span className="text-gray-700">Valutazione 12 soft skills</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 mt-1">✓</span>
                  <span className="text-gray-700">Report AI completo</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 mt-1">✓</span>
                  <span className="text-gray-700">Badge + QR + PDF</span>
                </li>
              </ul>

              <button
                onClick={() => router.push('/servizi')}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition"
              >
                Scopri di più
              </button>
            </div>

            {/* Leadership Deep Dive */}
            <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition border-4 border-yellow-400 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-bold">
                PREMIUM
              </div>
              
              <div className="text-center mb-6">
                <div className="inline-block bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full p-4 mb-4">
                  <span className="text-4xl">🏆</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Leadership Deep Dive</h3>
                <p className="text-gray-600">Per Manager e Leader</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <span className="text-yellow-600 mt-1">✓</span>
                  <span className="text-gray-700">30 domande situazionali avanzate</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow-600 mt-1">✓</span>
                  <span className="text-gray-700">6 dimensioni di leadership</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow-600 mt-1">✓</span>
                  <span className="text-gray-700">Stile di leadership personalizzato</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow-600 mt-1">✓</span>
                  <span className="text-gray-700">Piano d'azione 3-6 mesi</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow-600 mt-1">✓</span>
                  <span className="text-gray-700">Risorse consigliate</span>
                </li>
              </ul>

              <button
                onClick={() => router.push('/servizi')}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition"
              >
                Scopri di più
              </button>
            </div>

            {/* Dinamiche di Gruppo - Coming Soon */}
            <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition opacity-75 relative">
              <div className="absolute inset-0 bg-gray-100/50 rounded-2xl flex items-center justify-center">
                <span className="bg-gray-800 text-white px-6 py-2 rounded-full font-bold text-lg">
                  COMING SOON
                </span>
              </div>
              
              <div className="text-center mb-6">
                <div className="inline-block bg-gradient-to-br from-green-500 to-teal-600 rounded-full p-4 mb-4">
                  <span className="text-4xl">👥</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Dinamiche di Gruppo</h3>
                <p className="text-gray-600">Team Assessment</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-gray-700">Valutazione team completa</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-gray-700">Analisi relazioni interpersonali</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-gray-700">Identificazione ruoli team</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-gray-700">Report collaborazione</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-gray-700">Piano miglioramento team</span>
                </li>
              </ul>

              <button
                disabled
                className="w-full bg-gray-400 text-white py-3 rounded-lg font-semibold cursor-not-allowed"
              >
                Prossimamente
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* TRASFORMA LE TUE COMPETENZE IN OPPORTUNITÀ */}
      <section id="cosa-ottieni" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Trasforma le Tue Competenze in Opportunità
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ogni assessment ValutoLab ti fornisce strumenti concreti per valorizzare il tuo profilo professionale
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Assessment Competenze Trasversali */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-3xl">📊</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Assessment Competenze Trasversali</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-purple-600 text-xl mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">Report AI personalizzato</p>
                    <p className="text-gray-600 text-sm">con profilo professionale suggerito e analisi dettagliata</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-purple-600 text-xl mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">Badge LinkedIn</p>
                    <p className="text-gray-600 text-sm">per valorizzare immediatamente il tuo profilo social</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-purple-600 text-xl mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">QR Code dinamico</p>
                    <p className="text-gray-600 text-sm">da inserire nel CV e biglietto da visita per networking</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-purple-600 text-xl mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">Certificato PDF professionale</p>
                    <p className="text-gray-600 text-sm">scaricabile e stampabile con watermark di autenticità</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-purple-600 text-xl mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">Link pubblico condivisibile</p>
                    <p className="text-gray-600 text-sm">per mostrare i tuoi risultati a recruiter e aziende</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-purple-600 text-xl mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">Accesso permanente</p>
                    <p className="text-gray-600 text-sm">al tuo profilo e dashboard personale</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Leadership Deep Dive */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <span className="text-3xl">🏆</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Leadership Deep Dive</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-yellow-600 text-xl mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">Identificazione stile di leadership</p>
                    <p className="text-gray-600 text-sm">Trasformazionale, Servant Leader, Coaching e altri</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-yellow-600 text-xl mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">Piano d'azione personalizzato</p>
                    <p className="text-gray-600 text-sm">con obiettivi immediati (1 mese) e medio termine (3-6 mesi)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-yellow-600 text-xl mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">Analisi punti di forza</p>
                    <p className="text-gray-600 text-sm">e aree di sviluppo specifiche per la tua leadership</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-yellow-600 text-xl mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">Risorse consigliate</p>
                    <p className="text-gray-600 text-sm">libri, corsi e strumenti per crescita manageriale</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-yellow-600 text-xl mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">Report premium scaricabile</p>
                    <p className="text-gray-600 text-sm">con analisi approfondita delle 6 dimensioni</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Box Aziende */}
          <div className="mt-12 bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl p-8 border-2 border-orange-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl flex items-center justify-center">
                <span className="text-3xl">🏢</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Soluzioni per Aziende</h3>
                <p className="text-gray-600">Valuta il tuo team, semplifica il recruiting</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-orange-600 text-xl mt-1">✓</span>
                  <p className="text-gray-700">Dashboard centralizzata per HR</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-orange-600 text-xl mt-1">✓</span>
                  <p className="text-gray-700">Inviti e gestione candidati illimitati</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-orange-600 text-xl mt-1">✓</span>
                  <p className="text-gray-700">Comparazione risultati team</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-orange-600 text-xl mt-1">✓</span>
                  <p className="text-gray-700">Export report per recruiting</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-orange-600 text-xl mt-1">✓</span>
                  <p className="text-gray-700">Gestione permessi team</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-orange-600 text-xl mt-1">✓</span>
                  <p className="text-gray-700">Supporto dedicato</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push('/aziende/create')}
              className="bg-gradient-to-r from-orange-500 to-pink-600 text-white px-8 py-3 rounded-lg font-bold hover:shadow-lg transition"
            >
              Scopri di più →
            </button>
          </div>
        </div>
      </section>

      {/* CTA FINALE */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Pronto a Scoprire il Tuo Potenziale?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Inizia il tuo assessment oggi e ricevi risultati immediati
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/servizi')}
              className="bg-white text-purple-600 px-10 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition"
            >
              Inizia Come Privato
            </button>
            <button
              onClick={() => router.push('/aziende/create')}
              className="bg-gradient-to-r from-orange-500 to-pink-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition border-2 border-white"
            >
              Parla con Noi - Aziende
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-xl font-black">V</span>
                </div>
                <span className="text-xl font-bold">ValutoLab</span>
              </div>
              <p className="text-gray-400">
                Piattaforma professionale per l'assessment delle soft skills con intelligenza artificiale.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Servizi</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#servizi" className="hover:text-white transition">Assessment Base</a></li>
                <li><a href="#servizi" className="hover:text-white transition">Leadership Deep Dive</a></li>
                <li><a href="/aziende/create" className="hover:text-white transition">Soluzioni Aziende</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Contatti</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Email: info@valutolab.com</li>
                <li>
                  <a href="/login" className="hover:text-white transition">Accedi</a>
                </li>
                <li>
                  <a href="/register" className="hover:text-white transition">Registrati</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 ValutoLab. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
