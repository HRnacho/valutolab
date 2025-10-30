export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white py-20 px-4 overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&q=80")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-indigo-900/50" />
        
        {/* Content */}
        <div className="relative max-w-6xl mx-auto text-center z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 drop-shadow-lg">
            Valuta le Soft Skills del Tuo Team<br />in 15 Minuti
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-purple-100 drop-shadow-md">
            Scopri i punti di forza e le aree di miglioramento delle competenze trasversali<br />
            con il nostro assessment scientifico e personalizzato
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-purple-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-purple-50 transition shadow-lg hover:scale-105 transform">
              Prova Gratis
            </button>
            <button className="bg-purple-500 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-purple-400 transition border-2 border-white hover:scale-105 transform">
              Vedi Demo
            </button>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
            Perché Scegliere ValutoLab?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Veloce e Preciso</h3>
              <p className="text-gray-600">
                48 domande scientificamente validate per una valutazione accurata in soli 15 minuti
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Report Dettagliati</h3>
              <p className="text-gray-600">
                Analisi approfondita con grafici intuitivi e consigli personalizzati per ogni competenza
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Orientato ai Risultati</h3>
              <p className="text-gray-600">
                Identifica immediatamente le aree di sviluppo e ottimizza la crescita del tuo team
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
            Come Funziona
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-purple-700">1</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Rispondi al Questionario</h3>
              <p className="text-gray-600">
                48 domande mirate sulle principali soft skills professionali
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-purple-700">2</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Analisi Automatica</h3>
              <p className="text-gray-600">
                Il nostro algoritmo elabora le risposte in pochi secondi
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-purple-700">3</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Ricevi il Report</h3>
              <p className="text-gray-600">
                Report PDF scaricabile con grafici e consigli pratici
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SOFT SKILLS EVALUATED */}
      <section className="py-20 px-4 bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
            Competenze Valutate
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              'Comunicazione', 'Leadership', 'Problem Solving', 'Lavoro di Squadra',
              'Gestione del Tempo', 'Adattabilità', 'Creatività', 'Pensiero Critico',
              'Empatia', 'Resilienza', 'Negoziazione', 'Decision Making'
            ].map((skill) => (
              <div key={skill} className="bg-white p-4 rounded-lg shadow text-center">
                <p className="font-semibold text-gray-700">{skill}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
            Piani e Prezzi
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-gray-200">
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Singolo</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-purple-700">€49</span>
                <span className="text-gray-600">/assessment</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-600">1 assessment completo</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-600">Report PDF dettagliato</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-600">Valido 30 giorni</span>
                </li>
              </ul>
              <button className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition">
                Inizia Ora
              </button>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-8 rounded-xl shadow-xl border-4 border-purple-400 transform scale-105">
              <div className="bg-yellow-400 text-purple-900 text-sm font-bold px-3 py-1 rounded-full inline-block mb-4">
                PIÙ POPOLARE
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Team</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-white">€199</span>
                <span className="text-purple-200">/mese</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-yellow-300 mr-2">✓</span>
                  <span className="text-white">Fino a 10 assessment/mese</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-300 mr-2">✓</span>
                  <span className="text-white">Dashboard team</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-300 mr-2">✓</span>
                  <span className="text-white">Comparazione risultati</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-300 mr-2">✓</span>
                  <span className="text-white">Supporto prioritario</span>
                </li>
              </ul>
              <button className="w-full bg-white text-purple-700 py-3 rounded-lg font-bold hover:bg-purple-50 transition">
                Prova Gratis 14 Giorni
              </button>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-gray-200">
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Enterprise</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-purple-700">Custom</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-600">Assessment illimitati</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-600">API dedicata</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-600">Personalizzazione completa</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-600">Account manager dedicato</span>
                </li>
              </ul>
              <button className="w-full bg-gray-800 text-white py-3 rounded-lg font-bold hover:bg-gray-700 transition">
                Contattaci
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Pronto a Valutare le Soft Skills del Tuo Team?
          </h2>
          <p className="text-xl mb-8 text-purple-100">
            Inizia oggi con una prova gratuita. Nessuna carta di credito richiesta.
          </p>
          <button className="bg-white text-purple-700 px-10 py-4 rounded-lg font-bold text-xl hover:bg-purple-50 transition shadow-xl">
            Inizia Gratis
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">ValutoLab</h3>
            <p className="text-sm">
              Piattaforma professionale per la valutazione delle soft skills
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Prodotto</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Come funziona</a></li>
              <li><a href="#" className="hover:text-white">Prezzi</a></li>
              <li><a href="#" className="hover:text-white">Demo</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Azienda</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Chi siamo</a></li>
              <li><a href="#" className="hover:text-white">Contatti</a></li>
              <li><a href="#" className="hover:text-white">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Legale</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white">Termini di Servizio</a></li>
              <li><a href="#" className="hover:text-white">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-gray-800 text-center text-sm">
          <p>© 2025 ValutoLab. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  );
}
