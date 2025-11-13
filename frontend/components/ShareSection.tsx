'use client';

import { useState, useEffect } from 'react';

interface ShareSectionProps {
  assessmentId: string;
  userId: string;
}

export default function ShareSection({ assessmentId, userId }: ShareSectionProps) {
  const [shareData, setShareData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    checkExistingShare();
  }, [assessmentId]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
  };

  const checkExistingShare = async () => {
    try {
      setLoading(false);
    } catch (error) {
      console.error('Error checking share:', error);
      setLoading(false);
    }
  };

  const createShare = async () => {
    setCreating(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/share/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          assessmentId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShareData(data.share);
        showMessage('success', 'Condivisione attivata!');
      } else {
        showMessage('error', data.error || 'Errore nella creazione');
      }
    } catch (error) {
      showMessage('error', 'Errore di connessione');
    } finally {
      setCreating(false);
    }
  };

  const toggleShare = async () => {
    if (!shareData) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/share/${shareData.share_token}/toggle`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setShareData(data.share);
        showMessage('success', data.message);
      }
    } catch (error) {
      showMessage('error', 'Errore durante l\'aggiornamento');
    }
  };

  const copyLink = () => {
    if (!shareData) return;
    
    const link = `https://valutolab.com/profile/${shareData.share_token}`;
    navigator.clipboard.writeText(link);
    showMessage('success', 'Link copiato negli appunti!');
  };

  const deleteShare = async () => {
    if (!shareData) return;
    
    if (!confirm('Sei sicuro di voler eliminare questa condivisione?')) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/share/${shareData.share_token}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setShareData(null);
        showMessage('success', 'Condivisione eliminata');
      }
    } catch (error) {
      showMessage('error', 'Errore durante l\'eliminazione');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span>🔗</span>
            Condividi il tuo Certificato
          </h2>
          <p className="text-gray-600 mt-1">
            Crea un link pubblico per condividere i tuoi risultati
          </p>
        </div>
        
        {shareData && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              👁️ {shareData.view_count} visualizzazioni
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={shareData.is_active}
                onChange={toggleShare}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {shareData.is_active ? 'Attivo' : 'Disattivato'}
              </span>
            </label>
          </div>
        )}
      </div>

      {!shareData ? (
        <div className="text-center py-12 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Condividi i tuoi risultati
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Crea un link pubblico per mostrare le tue competenze certificate su LinkedIn, CV o portfolio
          </p>
          <button
            onClick={createShare}
            disabled={creating}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:shadow-xl transition disabled:opacity-50"
          >
            {creating ? 'Creazione...' : 'Attiva Condivisione'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {shareData.is_active ? (
            <>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Condivisione Attiva
                </div>
                <p className="text-sm text-green-600">
                  Il tuo profilo è pubblicamente visibile tramite il link qui sotto
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Link Pubblico
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={`https://valutolab.com/profile/${shareData.share_token}`}
                    readOnly
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-600 font-mono text-sm"
                  />
                  <button
                    onClick={copyLink}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copia
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <a
                  href={`https://valutolab.com/profile/${shareData.share_token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-purple-200 text-purple-700 rounded-lg font-semibold hover:bg-purple-50 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Anteprima Profilo
                </a>
                
                <button
                  onClick={deleteShare}
                  className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-red-200 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Elimina Condivisione
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-200">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span>🎨</span>
                  Coming Soon: Badge e QR Code
                </h3>
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg p-4 text-center opacity-50">
                    <div className="text-3xl mb-2">📱</div>
                    <div className="text-sm font-semibold text-gray-600">Badge LinkedIn</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center opacity-50">
                    <div className="text-3xl mb-2">📄</div>
                    <div className="text-sm font-semibold text-gray-600">QR Code</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center opacity-50">
                    <div className="text-3xl mb-2">📋</div>
                    <div className="text-sm font-semibold text-gray-600">PDF Certificato</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg p-6 text-center">
              <div className="text-4xl mb-3">⏸️</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                Condivisione Disattivata
              </h3>
              <p className="text-gray-600 mb-4">
                Il tuo profilo non è più visibile pubblicamente. Attiva lo switch sopra per riabilitare la condivisione.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
