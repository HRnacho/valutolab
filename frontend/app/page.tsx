import Footer from '@/components/Footer'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* NAVBAR */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="text-2xl">🧠</div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              ValutoLab
            </span>
          </div>
          <div className="flex gap-4">
            
              href="/login"
              className="px-6 py-2 text-gray-700 hover:text-purple-600 font-semibold transition"
            >
              Accedi
            </a>
            
              href="/register"
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
            >
              Registrati
            </a>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Valuta le Tue{' '}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Soft Skills
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Piattaforma professionale per la valutazione scientifica delle competenze trasversali.
            Report dettagliati, analisi approfondite, piani di sviluppo personalizzati.
          </p>
          <div className="flex gap-4 justify-center">
            
              href="/register"
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl transition transform hover:scale-105"
            >
              Inizia Gratis
            </a>
            
              href="/assessment"
              className="px-8 py-4 bg-white text-purple-600 rounded-xl font-bold text-lg hover:shadow-lg transition border-2 border-purple-200"
            >
              Scopri di più
            </a>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Perché Scegliere ValutoLab
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-2xl hover:shadow-xl transition">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Veloce e Preciso</h3>
              <p className="text-gray-600">
                Assessment scientificamente validato in soli 15 minuti
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-2xl hover:shadow-xl transition">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Report Dettagliati</h3>
              <p className="text-gray-600">
                Analisi approfondite con grafici interattivi e consigli personalizzati
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-2xl hover:shadow-xl transition">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Orientato ai Risultati</h3>
              <p className="text-gray-600">
                Piani di sviluppo concreti per migliorare le tue competenze
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Come Funziona
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Rispondi al Questionario</h3>
              <p className="text-gray-600">48 domande su 12 categorie di soft skills</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Analisi Automatica</h3>
              <p className="text-gray-600">Algoritmi avanzati elaborano le tue risposte</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Ricevi il Report</h3>
              <p className="text-gray-600">Report PDF scaricabile con tutti i risultati</p>
            </div>
          </div>
        </div>
      </section>

      {/* COMPETENZE VALUTATE */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Competenze Valutate
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Comunicazione',
              'Leadership',
              'Problem Solving',
              'Lavoro di Squadra',
              'Gestione del Tempo',
              'Creatività',
              'Pensiero Critico',
              'Adattabilità',
              'Empatia',
              'Resilienza',
              'Negoziazione',
              'Decision Making'
            ].map((skill) => (
              <div
                key={skill}
                className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-lg text-center font-semibold text-gray-800 hover:shadow-lg transition"
              >
                {skill}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINALE */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-6">
            Pronto a Scoprire le Tue Competenze?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Inizia subito il tuo assessment gratuito e ricevi il report dettagliato
          </p>
          
            href="/register"
            className="inline-block px-10 py-4 bg-white text-purple-600 rounded-xl font-bold text-lg hover:shadow-2xl transition transform hover:scale-105"
          >
            Inizia Ora - È Gratis
          </a>
        </div>
      </section>

      <Footer variant="full" />
    </div>
  )
}