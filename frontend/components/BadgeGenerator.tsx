'use client';

import { useRef, useEffect } from 'react';

interface BadgeGeneratorProps {
  userName: string;
  score: number;
  topSkills: Array<{ name: string; score: number }>;
  shareToken: string;
  onGenerate?: () => void;
}

export default function BadgeGenerator({ 
  userName, 
  score, 
  topSkills, 
  shareToken,
  onGenerate 
}: BadgeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateBadge = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimensioni ottimali per LinkedIn
    canvas.width = 1200;
    canvas.height = 627;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#7C3AED'); // purple-600
    gradient.addColorStop(0.5, '#6366F1'); // indigo-500
    gradient.addColorStop(1, '#3B82F6'); // blue-500
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // White overlay for contrast
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(40, 40, canvas.width - 80, canvas.height - 80);

    // Logo "V" - top left
    ctx.fillStyle = '#7C3AED';
    ctx.fillRect(70, 70, 80, 80);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 60px Arial';
    ctx.fillText('V', 90, 130);

    // ValutoLab text
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('ValutoLab', 170, 120);

    // Subtitle
    ctx.fillStyle = '#6B7280';
    ctx.font = '20px Arial';
    ctx.fillText('Soft Skills Certification', 170, 145);

    // Divider line
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(70, 180);
    ctx.lineTo(canvas.width - 70, 180);
    ctx.stroke();

    // User name
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 48px Arial';
    ctx.fillText(userName, 70, 250);

    // "Certified Professional"
    ctx.fillStyle = '#6B7280';
    ctx.font = '24px Arial';
    ctx.fillText('Certified Professional', 70, 285);

    // Score box
    const scoreBoxX = canvas.width - 280;
    const scoreBoxY = 200;
    
    // Score background
    ctx.fillStyle = '#F3F4F6';
    ctx.fillRect(scoreBoxX, scoreBoxY, 210, 100);
    
    // Score label
    ctx.fillStyle = '#6B7280';
    ctx.font = '18px Arial';
    ctx.fillText('Overall Score', scoreBoxX + 20, scoreBoxY + 30);
    
    // Score value
    ctx.fillStyle = '#7C3AED';
    ctx.font = 'bold 56px Arial';
    ctx.fillText(score.toFixed(1), scoreBoxX + 20, scoreBoxY + 80);
    
    ctx.fillStyle = '#9CA3AF';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('/5.0', scoreBoxX + 120, scoreBoxY + 80);

    // Top Skills section
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 28px Arial';
    ctx.fillText('Top Competencies', 70, 360);

    // Draw top 3 skills
    const skillY = 405;
    topSkills.slice(0, 3).forEach((skill, index) => {
      const y = skillY + (index * 50);
      
      // Skill name
      ctx.fillStyle = '#374151';
      ctx.font = '22px Arial';
      ctx.fillText(`${index + 1}. ${skill.name}`, 90, y);
      
      // Progress bar background
      const barX = 90;
      const barY = y + 10;
      const barWidth = 400;
      const barHeight = 8;
      
      ctx.fillStyle = '#E5E7EB';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      
      // Progress bar fill
      const fillWidth = (skill.score / 100) * barWidth;
      const barGradient = ctx.createLinearGradient(barX, barY, barX + fillWidth, barY);
      barGradient.addColorStop(0, '#7C3AED');
      barGradient.addColorStop(1, '#3B82F6');
      ctx.fillStyle = barGradient;
      ctx.fillRect(barX, barY, fillWidth, barHeight);
      
      // Score text
      ctx.fillStyle = '#7C3AED';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(skill.score.toString(), barX + barWidth + 15, y);
    });

    // Bottom section
    const bottomY = canvas.height - 80;
    
    // Verified badge
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.arc(90, bottomY, 12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('✓', 85, bottomY + 5);
    
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('Verified Certification', 115, bottomY + 5);

    // Link
    ctx.fillStyle = '#6B7280';
    ctx.font = '16px Arial';
    const linkText = `valutolab.com/profile/${shareToken.substring(0, 8)}...`;
    ctx.fillText(linkText, canvas.width - ctx.measureText(linkText).width - 70, bottomY + 5);

    if (onGenerate) onGenerate();
  };

  useEffect(() => {
    generateBadge();
  }, [userName, score, topSkills, shareToken]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Regenera per assicurarsi sia aggiornato
    generateBadge();

    // Download
    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `valutolab-badge-${userName.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  return (
    <div className="space-y-4">
      <canvas 
        ref={canvasRef} 
        className="hidden"
      />
      
      <button
        onClick={handleDownload}
        className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Scarica Badge LinkedIn
      </button>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 Come usare:</strong> Carica il badge nella sezione "In primo piano" del tuo profilo LinkedIn 
          o condividilo come post per mostrare le tue competenze certificate!
        </p>
      </div>
    </div>
  );
}
