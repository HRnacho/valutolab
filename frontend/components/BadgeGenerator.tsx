'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Download, Linkedin, ExternalLink, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface BadgeGeneratorProps {
  userName: string;
  score: number;
  topSkills: Array<{ name: string; score: number }>;
  shareToken: string;
  assessmentId: string;
  onGenerate?: () => void;
}

// Colori DS v2
const DS = {
  ink900:   '#0E1A2B',
  ink800:   '#1B2A40',
  ink700:   '#2E3F58',
  ink500:   '#6F7E96',
  ink400:   '#94A0B5',
  ink300:   '#BCC4D2',
  paper50:  '#FBF8F2',
  paper100: '#F6F2EA',
  paper200: '#ECE6D8',
  sienna:   '#B0473A',
  sienna600:'#CF7556',
  esperto:  '#2D5F73',
  avanzato: '#4F7A53',
  intermedio:'#C68A2E',
  base:     '#B0473A',
};

function getLevelColor(score: number) {
  if (score >= 4.0) return DS.esperto;
  if (score >= 3.0) return DS.avanzato;
  if (score >= 2.0) return DS.intermedio;
  return DS.base;
}
function getLevelLabel(score: number) {
  if (score >= 4.0) return 'ESPERTO';
  if (score >= 3.0) return 'AVANZATO';
  if (score >= 2.0) return 'INTERMEDIO';
  return 'BASE';
}

export default function BadgeGenerator({
  userName, score, topSkills, shareToken, assessmentId, onGenerate
}: BadgeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [linkedinState, setLinkedinState] = useState<'idle' | 'posting' | 'done' | 'error'>('idle');
  const [linkedinError, setLinkedinError] = useState('');

  // ── Generazione canvas DS v2 ────────────────────────────────────────────
  const generateBadge = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width  = 1200;
    canvas.height = 630;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const W = canvas.width;
    const H = canvas.height;
    const PAD = 56;

    // ── Background ink-900 ──
    ctx.fillStyle = DS.ink900;
    ctx.fillRect(0, 0, W, H);

    // Sottile texture: griglia di dots
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    for (let x = 0; x < W; x += 32) {
      for (let y = 0; y < H; y += 32) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── Card interna paper-50 ──
    const cardX = PAD;
    const cardY = PAD;
    const cardW = W - PAD * 2;
    const cardH = H - PAD * 2;
    ctx.fillStyle = DS.paper50;
    ctx.fillRect(cardX, cardY, cardW, cardH);

    // Bordo sinistro sienna (accent strip)
    ctx.fillStyle = DS.sienna;
    ctx.fillRect(cardX, cardY, 6, cardH);

    // ── Header ──────────────────────────────────────────────────────────
    const headerY = cardY + 48;

    // "Valuto" block ink-900
    ctx.fillStyle = DS.ink900;
    ctx.fillRect(cardX + 24, headerY - 28, 104, 36);
    ctx.fillStyle = DS.paper50;
    ctx.font = 'bold 22px "Space Grotesk", Arial';
    ctx.fillText('Valuto', cardX + 30, headerY - 6);

    // "Lab" block sienna
    ctx.fillStyle = DS.sienna;
    ctx.fillRect(cardX + 132, headerY - 28, 56, 36);
    ctx.fillStyle = DS.paper50;
    ctx.fillText('Lab', cardX + 138, headerY - 6);

    // Eyebrow
    ctx.fillStyle = DS.ink500;
    ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.letterSpacing = '0.14em';
    ctx.fillText('SOFT SKILLS ASSESSMENT · ESCO v1.2', cardX + 24, headerY + 22);
    ctx.letterSpacing = '0';

    // ── Divisore ────────────────────────────────────────────────────────
    ctx.strokeStyle = DS.paper200;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardX + 24, headerY + 38);
    ctx.lineTo(cardX + cardW - 24, headerY + 38);
    ctx.stroke();

    // ── Nome utente ──────────────────────────────────────────────────────
    const nameY = headerY + 88;
    ctx.fillStyle = DS.ink900;
    ctx.font = '600 42px "Space Grotesk", Arial';
    ctx.fillText(userName, cardX + 24, nameY);

    ctx.fillStyle = DS.ink500;
    ctx.font = '400 16px "IBM Plex Sans", Arial';
    ctx.fillText('Profilo certificato ValutoLab', cardX + 24, nameY + 28);

    // ── Score ring (canvas arc) ──────────────────────────────────────────
    const ringX = cardX + cardW - 180;
    const ringY = headerY + 90;
    const ringR = 52;
    const levelColor = getLevelColor(score);

    // Track grigio
    ctx.beginPath();
    ctx.arc(ringX, ringY, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = DS.paper200;
    ctx.lineWidth = 10;
    ctx.stroke();

    // Arc colorato
    const pct = score / 5;
    ctx.beginPath();
    ctx.arc(ringX, ringY, ringR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
    ctx.strokeStyle = levelColor;
    ctx.lineWidth = 10;
    ctx.lineCap = 'butt';
    ctx.stroke();

    // Testo punteggio
    ctx.fillStyle = DS.ink900;
    ctx.font = '300 32px "Space Grotesk", Arial';
    ctx.textAlign = 'center';
    ctx.fillText(score.toFixed(1), ringX, ringY + 10);
    ctx.fillStyle = DS.ink400;
    ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.fillText('/ 5,0', ringX, ringY + 28);
    ctx.textAlign = 'left';

    // Level badge sotto il ring
    ctx.fillStyle = levelColor;
    const levelLabel = getLevelLabel(score);
    const lbW = 96;
    ctx.fillRect(ringX - lbW / 2, ringY + 42, lbW, 22);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(levelLabel, ringX, ringY + 57);
    ctx.textAlign = 'left';

    // ── Divisore ────────────────────────────────────────────────────────
    const midY = nameY + 72;
    ctx.strokeStyle = DS.paper200;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardX + 24, midY);
    ctx.lineTo(cardX + cardW - 24, midY);
    ctx.stroke();

    // ── Top competenze ───────────────────────────────────────────────────
    ctx.fillStyle = DS.ink500;
    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.fillText('TOP COMPETENZE', cardX + 24, midY + 28);

    const skills = topSkills.slice(0, 3);
    const skillColors = [DS.esperto, DS.avanzato, DS.intermedio];
    skills.forEach((skill, i) => {
      const sy = midY + 56 + i * 58;
      const barW = 400;
      const barH = 6;
      const barX = cardX + 220;
      const fillW = (Math.min(skill.score, 5) / 5) * barW;

      // Numero
      ctx.fillStyle = DS.ink400;
      ctx.font = '400 13px "JetBrains Mono", monospace';
      ctx.fillText(`0${i + 1}`, cardX + 24, sy);

      // Nome
      ctx.fillStyle = DS.ink900;
      ctx.font = '500 15px "Space Grotesk", Arial';
      ctx.fillText(skill.name, cardX + 56, sy);

      // Track
      ctx.fillStyle = DS.paper200;
      ctx.fillRect(barX, sy - 11, barW, barH);

      // Fill
      ctx.fillStyle = skillColors[i];
      ctx.fillRect(barX, sy - 11, fillW, barH);

      // Punteggio
      ctx.fillStyle = skillColors[i];
      ctx.font = '600 14px "Space Grotesk", Arial';
      ctx.fillText(skill.score.toFixed(1), barX + barW + 14, sy);
    });

    // ── Footer ───────────────────────────────────────────────────────────
    const footY = cardY + cardH - 28;

    // Verified badge
    ctx.fillStyle = DS.avanzato;
    ctx.beginPath();
    ctx.arc(cardX + 36, footY, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '600 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('✓', cardX + 36, footY + 4);
    ctx.textAlign = 'left';

    ctx.fillStyle = DS.ink700;
    ctx.font = '400 12px "IBM Plex Sans", Arial';
    ctx.fillText('Certificato ValutoLab', cardX + 52, footY + 4);

    // URL
    const url = `valutolab.com/profile/${shareToken.substring(0, 10)}`;
    ctx.fillStyle = DS.ink400;
    ctx.font = '400 11px "JetBrains Mono", monospace';
    const urlW = ctx.measureText(url).width;
    ctx.fillText(url, cardX + cardW - urlW - 12, footY + 4);

    if (onGenerate) onGenerate();
  }, [userName, score, topSkills, shareToken, onGenerate]);

  useEffect(() => {
    generateBadge();
  }, [generateBadge]);

  // ── Scarica PNG ─────────────────────────────────────────────────────────
  const handleDownload = () => {
    generateBadge();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.download = `valutolab-badge-${userName.replace(/\s+/g, '-').toLowerCase()}.png`;
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  // ── Pubblica su LinkedIn ─────────────────────────────────────────────────
  const handleLinkedInPost = () => {
    if (!process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID) {
      // Fallback: share-offsite con il link del profilo pubblico
      const profileUrl = `https://valutolab.com/profile/${shareToken}`;
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`,
        '_blank'
      );
      return;
    }

    // OAuth flow completo
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.valutolab.com';
    const stateParam = assessmentId;
    window.location.href = `${apiUrl}/api/linkedin/auth?state=${stateParam}`;
  };

  // Gestione callback OAuth (access_token in URL da redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('linkedin_token');
    const urn   = params.get('linkedin_urn');
    const error = params.get('linkedin_error');

    if (error) {
      setLinkedinState('error');
      setLinkedinError(decodeURIComponent(error));
      return;
    }

    if (token && urn) {
      // Abbiamo il token → posta il badge
      setLinkedinState('posting');
      generateBadge();
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.toBlob(async blob => {
        if (!blob) return;
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.valutolab.com';
            const res = await fetch(`${apiUrl}/api/linkedin/post-badge`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                access_token: token,
                person_urn: urn,
                image_base64: base64,
                caption: `Ho ottenuto la mia certificazione soft skills su ValutoLab!\n\nPunteggio: ${score.toFixed(1)}/5,0 — ${getLevelLabel(score)}\n\n12 competenze trasversali mappate sullo standard ESCO v1.2.\n\n#SoftSkills #ESCO #ValutoLab`,
              }),
            });
            const data = await res.json();
            if (data.success) {
              setLinkedinState('done');
              // Pulisce i params dall'URL
              window.history.replaceState({}, '', window.location.pathname);
            } else {
              throw new Error(data.error);
            }
          } catch (err: any) {
            setLinkedinState('error');
            setLinkedinError(err.message);
          }
        };
        reader.readAsDataURL(blob);
      }, 'image/png');
    }
  }, []);

  return (
    <div className="space-y-5">
      <canvas ref={canvasRef} className="hidden" />

      {/* Preview del badge */}
      <div className="rounded-md overflow-hidden border border-paper-200 bg-paper-100">
        <canvas
          ref={canvasRef}
          className="w-full h-auto"
          style={{ aspectRatio: '1200/630' }}
        />
      </div>

      {/* Feedback LinkedIn */}
      {linkedinState === 'done' && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-md px-4 py-3">
          <CheckCircle className="w-4 h-4 text-level-avanzato flex-shrink-0" />
          <p className="text-[13px] text-ink-700 font-medium">Post pubblicato su LinkedIn!</p>
        </div>
      )}
      {linkedinState === 'error' && (
        <div className="bg-sienna-50 border border-sienna-300 rounded-md px-4 py-3">
          <p className="text-[13px] text-sienna-700 font-medium mb-1">Errore LinkedIn</p>
          <p className="text-[12px] text-sienna-600">{linkedinError}</p>
          <p className="text-[11px] text-ink-500 mt-2">
            Puoi comunque scaricare il badge e caricarlo manualmente su LinkedIn.
          </p>
        </div>
      )}

      {/* Azioni */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="primary" className="justify-center flex items-center gap-2 w-full"
          onClick={handleDownload}>
          <Download className="w-4 h-4" />
          Scarica Badge
        </Button>

        <Button variant="secondary"
          className="justify-center flex items-center gap-2 w-full"
          disabled={linkedinState === 'posting'}
          onClick={handleLinkedInPost}>
          {linkedinState === 'posting' ? (
            <>
              <span className="w-4 h-4 border-2 border-ink-400 border-t-transparent rounded-full animate-spin" />
              Pubblicazione…
            </>
          ) : (
            <>
              <Linkedin className="w-4 h-4" />
              Pubblica su LinkedIn
            </>
          )}
        </Button>
      </div>

      <div className="bg-paper-100 border border-paper-200 rounded-md px-4 py-3">
        <p className="text-[11px] text-ink-500 leading-relaxed">
          <strong className="text-ink-700">Scarica</strong> il badge e caricalo nella sezione
          &quot;In primo piano&quot; del tuo profilo LinkedIn, oppure usa{' '}
          <strong className="text-ink-700">Pubblica su LinkedIn</strong> per postarlo direttamente
          sulla tua bacheca.
        </p>
      </div>
    </div>
  );
}
