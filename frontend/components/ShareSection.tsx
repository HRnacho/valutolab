'use client';

import { useState, useEffect } from 'react';
import QRCodeGenerator from './QRCodeGenerator';

interface ShareSectionProps {
  assessmentId: string;
  userName: string;
}

export default function ShareSection({ assessmentId, userName }: ShareSectionProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [shareData, setShareData] = useState<any>(null);
  const [isActive, setIsActive] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  useEffect(() => {
    fetchShareStatus();
  }, [assessmentId]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchShareStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/share/status/${assessmentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setShareData(data);
        setIsActive(data?.is_active || false);
      }
    } catch (error) {
      console.error('Errore recupero stato condivisione:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSharing = async () => {
    try {
      if (!shareData) {
        const response = await fetch(`${API_URL}/share/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ assessment_id: assessmentId })
        });

        if (response.ok) {
          const data = await response.json();
          setShareData(data);
          setIsActive(true);
          setMessage({ type: 'success', text: '✅ Condivisione attivata!' });
        }
      } else {
        const newStatus = !isActive;
        const response = await fetch(`${API_URL}/share/toggle/${shareData.share_token}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ is_active: newStatus })
        });

        if (response.ok) {
          setIsActive(newStatus);
          setMessage({ 
            type: 'success', 
            text: newStatus ? '✅ Condivisione attivata!' : '⏸️ Condivisione disattivata' 
          });
        }
      }
    } catch (error) {
      console.error('Errore toggle condivisione:', error);
      setMessage({ type: 'error', text: '❌ Errore durante l\'operazione' });
    }
  };

  const copyLink = () => {
    if (shareData?.share_token) {
      const link = `https://valutolab.com/profile/${shareData.share_token}`;
      navigator.clipboard.writeText(link);
      setMessage({ type: 'success', text: '📋 Link copiato!' });
    }
  };

  const deleteSharing = async () => {
    if (!confirm('Vuoi davvero eliminare la condivisione? Il link pubblico non funzionerà più.')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/share/${shareData.share_token}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setShareData(null);
        setIsActive(false);
        setMessage({ type: 'success', text: '🗑️ Condivisione eliminata' });
      }
    } catch (error) {
      console.error('Errore eliminazione condivisione:', error);
      setMessage({ type: 'error', text: '❌ Errore durante l\'eliminazione' });
    }
  };

  const getProfileUrl = () => {
    if (shareData?.share_token) {
      return `https://valutolab.com/profile/${shareData.share_token}`;
    }
    return '';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🔗</div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Condivisione</h2>
            <p className="text-sm text-gray-600">Condividi il tuo profilo pubblico</p>
          </div>
        </div>
        
        {/* Toggle switch */}
        <button
          onClick={toggleSharing}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
            isActive ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
              isActive ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Message notification */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`text-sm font-medium ${
            message.type === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            {message.text}
          </p>
        </div>
      )}

      {/* Content */}
      {shareData && (
        <div className="space-y-4">
          {isActive ? (
            <>
              {/* Stats */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>👁️</span>
                <span className="font-medium">{shareData.view_count || 0} visualizzazioni</span>
              </div>

              {/* Link copiabile */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 mb-1">Link profilo pubblico:</p>
                    <p className="text-sm font-mono text-gray-800 truncate">
                      valutolab.com/profile/{shareData.share_token}
                    </p>
                  </div>
                  <button
                    onClick={copyLink}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors duration-200 flex-shrink-0"
                  >
                    Copia
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => window.open(`/profile/${shareData.share_token}`, '_blank')}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <span>📱</span>
                  Badge
                </button>
                
                <button
                  onClick={() => setShowQRModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <span>📄</span>
                  QR
                </button>
                
                <button
                  disabled
                  className="bg-gray-300 text-gray-500 px-4 py-3 rounded-lg font-semibold text-sm cursor-not-allowed flex items-center justify-center gap-2 opacity-50"
                  title="Coming soon"
                >
                  <span>📋</span>
                  PDF
                </button>
              </div>

              {/* Delete button */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={deleteSharing}
                  className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Elimina Condivisione
                </button>
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

      {/* QR Code Modal */}
      {showQRModal && shareData?.share_token && (
        <QRCodeGenerator
          profileUrl={getProfileUrl()}
          userName={userName}
          onClose={() => setShowQRModal(false)}
        />
      )}
    </div>
  );
}
