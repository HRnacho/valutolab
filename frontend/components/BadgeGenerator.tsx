'use client';

import { useRef, useEffect, useState } from 'react';

interface BadgeGeneratorProps {
  userName: string;
  score: number;
  topSkills: Array<{ name: string; score: number }>;
  shareToken: string;
  onGenerate?: () => void;
}

type TemplateType = 'professional' | 'modern' | 'creative';

export default function BadgeGenerator({ 
  userName, 
  score, 
  topSkills, 
  shareToken,
  onGenerate 
}: BadgeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('professional');

  const generateProfessionalBadge = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#7C3AED');
    gradient.addColorStop(0.5, '#6366F1');
    gradient.addColorStop(1, '#3B82F6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // White overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(40, 40, canvas.width - 80, canvas.height - 80);

    // Logo "V"
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

    // Divider
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

    // Certified Professional
    ctx.fillStyle = '#6B7280';
    ctx.font = '24px Arial';
    ctx.fillText('Certified Professional', 70, 285);

    // Score box
    const scoreBoxX = canvas.width - 280;
    ctx.fillStyle = '#F3F4F6';
    ctx.fillRect(scoreBoxX, 200, 210, 100);
    
    ctx.fillStyle = '#6B7280';
    ctx.font = '18px Arial';
    ctx.fillText('Overall Score', scoreBoxX + 20, 230);
    
    ctx.fillStyle = '#7C3AED';
    ctx.font = 'bold 56px Arial';
    ctx.fillText(score.toFixed(1), scoreBoxX + 20, 280);
    
    ctx.fillStyle = '#9CA3AF';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('/5.0', scoreBoxX + 120, 280);

    // Top Skills
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 28px Arial';
    ctx.fillText('Top Competencies', 70, 360);

    topSkills.slice(0, 3).forEach((skill, index) => {
      const y = 405 + (index * 50);
      
      ctx.fillStyle = '#374151';
      ctx.font = '22px Arial';
      ctx.fillText(`${index + 1}. ${skill.name}`, 90, y);
      
      const barX = 90;
      const barY = y + 10;
      const barWidth = 400;
      
      ctx.fillStyle = '#E5E7EB';
      ctx.fillRect(barX, barY, barWidth, 8);
      
      const fillWidth = (skill.score / 100) * barWidth;
      const barGradient = ctx.createLinearGradient(barX, barY, barX + fillWidth, barY);
      barGradient.addColorStop(0, '#7C3AED');
      barGradient.addColorStop(1, '#3B82F6');
      ctx.fillStyle = barGradient;
      ctx.fillRect(barX, barY, fillWidth, 8);
      
      ctx.fillStyle = '#7C3AED';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(skill.score.toString(), barX + barWidth + 15, y);
    });

    // Bottom section
    const bottomY = canvas.height - 80;
    
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

    ctx.fillStyle = '#6B7280';
    ctx.font = '16px Arial';
    const linkText = `valutolab.com/profile/${shareToken.substring(0, 8)}...`;
    ctx.fillText(linkText, canvas.width - ctx.measureText(linkText).width - 70, bottomY + 5);
  };

  const generateModernBadge = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Clean white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Thin colored border
    ctx.strokeStyle = '#7C3AED';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Minimal header
    ctx.fillStyle = '#7C3AED';
    ctx.fillRect(60, 60, 60, 60);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.fillText('V', 72, 108);

    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 28px Arial';
    ctx.fillText('ValutoLab', 140, 95);
    
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '18px Arial';
    ctx.fillText('Certification', 140, 118);

    // Divider line
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 160);
    ctx.lineTo(canvas.width - 60, 160);
    ctx.stroke();

    // User name - centered
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 56px Arial';
    const nameWidth = ctx.measureText(userName).width;
    ctx.fillText(userName, (canvas.width - nameWidth) / 2, 240);

    // Large score - centered
    ctx.fillStyle = '#7C3AED';
    ctx.font = 'bold 120px Arial';
    const scoreText = score.toFixed(1);
    const scoreWidth = ctx.measureText(scoreText).width;
    ctx.fillText(scoreText, (canvas.width - scoreWidth) / 2, 380);

    ctx.fillStyle = '#6B7280';
    ctx.font = '32px Arial';
    const outOfText = 'out of 5.0';
    const outOfWidth = ctx.measureText(outOfText).width;
    ctx.fillText(outOfText, (canvas.width - outOfWidth) / 2, 420);

    // Top skill highlighted
    const topSkill = topSkills[0];
    ctx.fillStyle = '#F3F4F6';
    ctx.fillRect(200, 460, canvas.width - 400, 80);
    
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Strongest Skill:', 220, 495);
    
    ctx.fillStyle = '#7C3AED';
    ctx.font = 'bold 32px Arial';
    ctx.fillText(topSkill.name, 220, 530);

    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 40px Arial';
    ctx.fillText(topSkill.score.toString(), canvas.width - 280, 520);

    // Bottom text
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '16px Arial';
    ctx.fillText('Professional Soft Skills Assessment', 60, canvas.height - 60);

    const linkText = `valutolab.com/profile/${shareToken.substring(0, 10)}...`;
    const linkWidth = ctx.measureText(linkText).width;
    ctx.fillText(linkText, canvas.width - linkWidth - 60, canvas.height - 60);
  };

  const generateCreativeBadge = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Vibrant gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#EC4899');
    gradient.addColorStop(0.33, '#8B5CF6');
    gradient.addColorStop(0.66, '#3B82F6');
    gradient.addColorStop(1, '#10B981');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative circles (no shadow)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(100, 100, 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(canvas.width - 100, canvas.height - 100, 120, 0, Math.PI * 2);
    ctx.fill();

    // Main white card (no shadow)
    ctx.fillStyle = 'white';
    ctx.fillRect(80, 60, canvas.width - 160, canvas.height - 120);

    // Colorful header
    const headerGradient = ctx.createLinearGradient(100, 80, canvas.width - 100, 80);
    headerGradient.addColorStop(0, '#EC4899');
    headerGradient.addColorStop(0.5, '#8B5CF6');
    headerGradient.addColorStop(1, '#3B82F6');
    ctx.fillStyle = headerGradient;
    ctx.fillRect(100, 80, canvas.width - 200, 120);

    // Logo
    ctx.fillStyle = 'white';
    ctx.fillRect(120, 100, 60, 60);
    ctx.fillStyle = '#EC4899';
    ctx.font = 'bold 48px Arial';
    ctx.fillText('V', 132, 148);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 36px Arial';
    ctx.fillText('ValutoLab', 200, 140);
    
    ctx.font = '20px Arial';
    ctx.fillText('🌟 Certified Excellence', 200, 170);

    // User name
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 48px Arial';
    ctx.fillText(userName, 120, 260);

    // Score in colorful box
    ctx.fillStyle = '#F9FAFB';
    ctx.fillRect(canvas.width - 300, 220, 180, 80);
    
    ctx.fillStyle = '#EC4899';
    ctx.font = 'bold 56px Arial';
    ctx.fillText(score.toFixed(1), canvas.width - 285, 275);
    
    ctx.fillStyle = '#6B7280';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('/5.0', canvas.width - 195, 275);

    // Skills section title (moved down and spaced properly)
    const skillEmojis = ['🏆', '⭐', '💪'];
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 26px Arial';
    ctx.fillText('Your Superpowers:', 120, 340);

    // Skills with proper spacing
    topSkills.slice(0, 3).forEach((skill, index) => {
      const y = 395 + (index * 65);
      
      // Colorful skill box
      const colors = ['#EC4899', '#8B5CF6', '#3B82F6'];
      ctx.fillStyle = colors[index] + '15';
      ctx.fillRect(120, y - 35, 520, 55);
      
      // Emoji
      ctx.font = '28px Arial';
      ctx.fillText(skillEmojis[index], 140, y);
      
      // Skill name
      ctx.fillStyle = '#1F2937';
      ctx.font = 'bold 24px Arial';
      ctx.fillText(skill.name, 190, y);
      
      // Score badge
      ctx.fillStyle = colors[index];
      ctx.beginPath();
      ctx.arc(605, y - 8, 28, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 20px Arial';
      const scoreStr = skill.score.toString();
      const scoreStrWidth = ctx.measureText(scoreStr).width;
      ctx.fillText(scoreStr, 605 - scoreStrWidth / 2, y);
    });

    // Bottom section - well spaced
    const bottomY = canvas.height - 90;
    
    ctx.fillStyle = '#10B981';
    ctx.fillRect(120, bottomY - 15, 28, 28);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('✓', 127, bottomY + 5);
    
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('Verified by ValutoLab', 160, bottomY + 3);

    ctx.fillStyle = '#6B7280';
    ctx.font = '15px Arial';
    const linkText = `valutolab.com/profile/${shareToken.substring(0, 8)}...`;
    const linkWidth = ctx.measureText(linkText).width;
    ctx.fillText(linkText, canvas.width - linkWidth - 120, bottomY + 3);
  };

  const generateBadge = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1200;
    canvas.height = 627;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Generate based on selected template
    switch (selectedTemplate) {
      case 'professional':
        generateProfessionalBadge(ctx, canvas);
        break;
      case 'modern':
        generateModernBadge(ctx, canvas);
        break;
      case 'creative':
        generateCreativeBadge(ctx, canvas);
        break;
    }

    if (onGenerate) onGenerate();
  };

  useEffect(() => {
    generateBadge();
  }, [userName, score, topSkills, shareToken, selectedTemplate]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    generateBadge();

    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `valutolab-badge-${selectedTemplate}-${userName.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const templates = [
    { id: 'professional', name: 'Professional', desc: 'Formale ed elegante' },
    { id: 'modern', name: 'Modern', desc: 'Minimalista e pulito' },
    { id: 'creative', name: 'Creative', desc: 'Colorato e dinamico' }
  ] as const;

  return (
    <div className="space-y-4">
      <canvas 
        ref={canvasRef} 
        className="hidden"
      />

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Scegli il template:</p>
        <div className="grid grid-cols-3 gap-3">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`p-3 rounded-lg border-2 transition text-left ${
                selectedTemplate === template.id
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <div className="font-semibold text-sm text-gray-900">{template.name}</div>
              <div className="text-xs text-gray-600 mt-1">{template.desc}</div>
            </button>
          ))}
        </div>
      </div>
      
      <button
        onClick={handleDownload}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Scarica Badge LinkedIn
      </button>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          <strong>💡 Come usare:</strong> Carica il badge nella sezione "In primo piano" del tuo profilo LinkedIn 
          o condividilo come post per mostrare le tue competenze certificate!
        </p>
      </div>
    </div>
  );
}
