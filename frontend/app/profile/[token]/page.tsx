'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface ProfileData {
  name: string;
  completedAt: string;
  totalScore: number;
  results: Array<{
    category: string;
    score: number;
  }>;
}

export default function PublicProfilePage() {
  const params = useParams();
  const token = params.token as string;
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/share/${token}`
        );
        
        if (!response.ok) {
          throw new Error('Profilo non trovato');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setProfile(data.profile);
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError('Impossibile caricare il profilo');
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchProfile();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-600">Caricamento profilo...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Profilo Non Disponibile
          </h1>
          <p className="text-gray-600 mb-6">
            {error || 'Questo profilo non esiste o è stato disattivato.'}
          </p>
          
            href="https://valutolab.com"
            className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            Vai a ValutoLab
          </a>
        </div>
      </div>
    );
  }

  // Calcola top 6 competenze
  const topSkills = profile.results
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  // Formatta data
  const completedDate = new Date(profile.completedAt).toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white rounded-full p-4 shadow-lg mb-4">
            <span className="text-5xl">🧠</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ValutoLab - Certificato Soft Skills
          </h1>
          <p className="text-gray-600">
            Profilo verificato e certificato
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold mb-1">{profile.name}</h2>
                <p className="text-purple-100">Assessment completato: {completedDate}</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">{profile.totalScore}</div>
                <div className="text-sm text-purple-100">Score Totale</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 inline-block">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">Certificato Verificato</span>
            </div>
          </div>

          {/* Skills Grid */}
          <div className="p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              Competenze Principali
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {topSkills.map((skill, index) => (
                <div key={index} className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-800">{skill.category}</span>
                    <span className="text-2xl font-bold text-purple-600">{skill.score}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${skill.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* All Skills Table */}
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Tutte le Competenze
            </h3>
            
            <div className="grid md:grid-cols-3 gap-3">
              {profile.results
                .sort((a, b) => b.score - a.score)
                .map((skill, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                  >
                    <span className="text-sm text-gray-700">{skill.category}</span>
                    <span className="font-bold text-purple-600">{skill.score}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">V</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-800 text-sm">ValutoLab</div>
                  <div className="text-xs text-gray-600">Soft Skills Assessment Platform</div>
                </div>
              </div>
              
              
                href="https://valutolab.com"
                className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition text-sm"
              >
                Crea il tuo Assessment
              </a>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
              Questo certificato è verificabile su valutolab.com/profile/{token}
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6 text-center">
          <p className="text-gray-600 mb-4">
            Vuoi misurare anche tu le tue soft skills professionali?
          </p>
          
            href="https://valutolab.com/register"
            className="inline-block bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:shadow-xl transition"
          >
            Inizia il Tuo Assessment Gratuito
          </a>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎨 **Features della pagina:**

✅ **Design professionale** con gradients viola
✅ **Badge certificato verificato**
✅ **Top 6 competenze** in evidenza con barre progress
✅ **Tutte le competenze** in griglia
✅ **Score totale** prominente
✅ **Data completamento**
✅ **Watermark ValutoLab**
✅ **CTA "Crea il tuo assessment"**
✅ **Loading state** animato
✅ **Error state** gestito
✅ **Responsive** mobile-friendly
✅ **NO dati sensibili** (solo nome opzionale)

