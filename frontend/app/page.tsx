export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          🚀 ValutoLab
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Piattaforma di Valutazione Soft Skills Professionale
        </p>
        
        <div className="space-y-4">
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-semibold">✅ Frontend Next.js attivo</p>
            <p className="text-green-600 text-sm mt-1">React 18 + TypeScript + Tailwind CSS</p>
          </div>
          
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 font-semibold">✅ Backend API pronto</p>
            <p className="text-blue-600 text-sm mt-1">Node.js + Express + Supabase</p>
          </div>
          
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <p className="text-purple-800 font-semibold">⚙️ In sviluppo</p>
            <p className="text-purple-600 text-sm mt-1">Questionario e Dashboard coming soon...</p>
          </div>
        </div>

        <p className="text-gray-500 text-sm mt-8">
          Versione 1.0.0 - Development
        </p>
      </div>
    </main>
  );
}
