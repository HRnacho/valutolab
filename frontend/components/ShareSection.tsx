'use client';

import { useState, useEffect } from 'react';
import { Link2, Copy, Eye, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import QRCodeGenerator from './QRCodeGenerator';

interface ShareSectionProps {
  assessmentId: string;
  userId: string;
}

export default function ShareSection({ assessmentId, userId }: ShareSectionProps) {
  const [loading, setLoading]     = useState(true);
  const [shareData, setShareData] = useState<any>(null);
  const [isActive, setIsActive]   = useState(false);
  const [toast, setToast]         = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showQR, setShowQR]       = useState(false);
  const [userName, setUserName]   = useState('Utente');
  const [toggling, setToggling]   = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.valutolab.com';
  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('jwt_access_token')}` });

  useEffect(() => { fetchStatus(); fetchUserName(); }, [assessmentId]);
  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
  }, [toast]);

  const showToast = (type: 'success' | 'error', text: string) => setToast({ type, text });

  const fetchUserName = async () => {
    try {
      const r = await fetch(`${API}/api/auth/me`, { headers: authHeader() });
      if (r.ok) { const d = await r.json(); setUserName(d.user?.full_name || 'Utente'); }
    } catch {}
  };

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const r = await fetch(`${API}/api/share/status/${assessmentId}`, { headers: authHeader() });
      if (r.ok) {
        const d = await r.json();
        if (d.share_token) { setShareData(d); setIsActive(d.is_active); }
      }
    } catch {} finally { setLoading(false); }
  };

  const toggleSharing = async () => {
    setToggling(true);
    try {
      if (!shareData) {
        // Crea nuova condivisione
        const r = await fetch(`${API}/api/share/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader() },
          body: JSON.stringify({ assessment_id: assessmentId }),
        });
        const d = await r.json();
        if (d.success) { setShareData(d); setIsActive(true); showToast('success', 'Condivisione attivata!'); }
        else showToast('error', d.error || 'Errore');
      } else {
        const newStatus = !isActive;
        const r = await fetch(`${API}/api/share/toggle/${shareData.share_token}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeader() },
          body: JSON.stringify({ is_active: newStatus }),
        });
        const d = await r.json();
        if (d.success) {
          setIsActive(newStatus);
          setShareData(d);
          showToast('success', newStatus ? 'Condivisione attivata!' : 'Condivisione disattivata');
        }
      }
    } catch { showToast('error', "Errore durante l'operazione"); }
    finally { setToggling(false); }
  };

  const copyLink = () => {
    const link = `https://valutolab.com/profile/${shareData.share_token}`;
    navigator.clipboard.writeText(link);
    showToast('success', 'Link copiato!');
  };

  const deleteSharing = async () => {
    if (!confirm('Eliminare la condivisione? Il link pubblico smetterà di funzionare.')) return;
    try {
      await fetch(`${API}/api/share/${shareData.share_token}`, {
        method: 'DELETE', headers: authHeader()
      });
      setShareData(null); setIsActive(false);
      showToast('success', 'Condivisione eliminata');
    } catch { showToast('error', 'Errore durante l\'eliminazione'); }
  };

  const profileUrl = shareData?.share_token
    ? `https://valutolab.com/profile/${shareData.share_token}` : '';

  if (loading) {
    return (
      <div className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink p-6 animate-pulse">
        <div className="h-5 bg-paper-200 rounded w-1/3 mb-4" />
        <div className="h-16 bg-paper-200 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink p-6 relative font-body">

      {/* Toast */}
      {toast && (
        <div className={`absolute top-4 right-4 z-10 px-4 py-2 rounded-sm text-[13px] font-medium text-paper-50 shadow-md-ink ${
          toast.type === 'success' ? 'bg-ink-900' : 'bg-sienna-600'
        }`}>
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Link2 className="w-4 h-4 text-ink-500" />
          <div>
            <h3 className="font-display text-[16px] font-medium text-ink-900">Condivisione</h3>
            <p className="text-[12px] text-ink-500">Profilo pubblico verificabile</p>
          </div>
        </div>

        {/* Toggle */}
        <button onClick={toggleSharing} disabled={toggling}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 focus:outline-none ${
            isActive ? 'bg-ink-900' : 'bg-paper-300'
          }`}>
          <span className={`inline-block h-4 w-4 transform rounded-full bg-paper-50 shadow transition-transform ${
            isActive ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>

      {/* Stato attivo */}
      {shareData && isActive && (
        <div className="space-y-4">
          {/* View count */}
          <div className="flex items-center gap-2 text-[12px] text-ink-500">
            <Eye className="w-3.5 h-3.5" />
            <span>{shareData.view_count || 0} visualizzazioni</span>
          </div>

          {/* Link */}
          <div className="bg-paper-100 border border-paper-200 rounded-md p-4">
            <p className="text-[10px] font-medium uppercase tracking-eyebrow text-ink-400 mb-2">Link profilo pubblico</p>
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[12px] text-ink-700 truncate">
                valutolab.com/profile/{shareData.share_token}
              </p>
              <button onClick={copyLink}
                className="flex items-center gap-1.5 text-[12px] font-medium text-ink-900 hover:text-sienna-600 transition-colors flex-shrink-0">
                <Copy className="w-3.5 h-3.5" /> Copia
              </button>
            </div>
          </div>

          {/* Azioni */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" className="justify-center text-[12px]"
              onClick={() => window.open(profileUrl, '_blank')}>
              Visualizza profilo
            </Button>
            <Button variant="secondary" className="justify-center text-[12px]"
              onClick={() => setShowQR(true)}>
              QR Code
            </Button>
          </div>

          {/* Elimina */}
          <button onClick={deleteSharing}
            className="flex items-center gap-2 text-[12px] text-ink-400 hover:text-sienna-600 transition-colors mt-2">
            <Trash2 className="w-3.5 h-3.5" /> Elimina condivisione
          </button>
        </div>
      )}

      {/* Stato disattivato */}
      {shareData && !isActive && (
        <div className="bg-paper-100 border border-paper-200 rounded-md p-5 text-center">
          <p className="text-[13px] font-medium text-ink-700 mb-1">Condivisione disattivata</p>
          <p className="text-[12px] text-ink-500">Il tuo profilo non è visibile pubblicamente. Attiva lo switch per riabilitarlo.</p>
        </div>
      )}

      {/* Stato vuoto */}
      {!shareData && (
        <div className="bg-paper-100 border border-paper-200 rounded-md p-5 text-center">
          <p className="text-[13px] text-ink-600 mb-3">
            Attiva la condivisione per ottenere un link pubblico verificabile del tuo profilo.
          </p>
          <Button variant="primary" className="justify-center" onClick={toggleSharing} disabled={toggling}>
            {toggling ? 'Attivazione…' : 'Attiva condivisione'}
          </Button>
        </div>
      )}

      {/* QR Modal */}
      {showQR && shareData?.share_token && (
        <div className="fixed inset-0 bg-ink-950/60 flex items-center justify-center p-4 z-50">
          <div className="bg-paper-50 border border-paper-200 rounded-md shadow-lg-ink p-6 max-w-sm w-full relative">
            <button onClick={() => setShowQR(false)}
              className="absolute top-4 right-4 text-ink-400 hover:text-ink-700">
              <X className="w-5 h-5" />
            </button>
            <QRCodeGenerator
              profileUrl={profileUrl}
              userName={userName}
              onClose={() => setShowQR(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
