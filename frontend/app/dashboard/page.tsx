'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import BadgeGenerator from '@/components/BadgeGenerator'
import QRCodeGenerator from '@/components/QRCodeGenerator'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import QRCode from 'qrcode'

interface Assessment {
  id: string
  status: string
  total_score: number | null
  created_at: string
  completed_at: string | null
}

interface LeadershipAssessment {
  id: string
  status: string
  total_score: number | null
  created_at: string
  completed_at: string | null
}

interface ShareData {
  assessment_id: string
  share_token: string
  is_active: boolean
  view_count: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [leadershipAssessments, setLeadershipAssessments] = useState<LeadershipAssessment[]>([])
  const [responsesCount, setResponsesCount] = useState<Record<string, number>>({})
  const [leadershipResponsesCount, setLeadershipResponsesCount] = useState<Record<string, number>>({})
  const [deleting, setDeleting] = useState<string | null>(null)
  const [shareData, setShareData] = useState<Record<string, ShareData>>({})
  const [creatingShare, setCreatingShare] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null)
  const [badgeModal, setBadgeModal] = useState<{
    open: boolean;
    assessmentId: string | null;
    userName: string;
    score: number;
    topSkills: Array<{ name: string; score: number }>;
    shareToken: string;
  } | null>(null)
  const [qrModal, setQrModal] = useState<{
    open: boolean;
    profileUrl: string;
    userName: string;
  } | null>(null)

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
  }

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      const { data: assessmentsData } = await supabase
        .from('assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setAssessments(assessmentsData || [])

      const { data: leadershipData } = await supabase
        .from('leadership_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setLeadershipAssessments(leadershipData || [])

      const counts: Record<string, number> = {}
      for (const assessment of assessmentsData || []) {
        if (assessment.status === 'in_progress') {
          const { count } = await supabase
            .from('assessment_responses')
            .select('*', { count: 'exact', head: true })
            .eq('assessment_id', assessment.id)
          counts[assessment.id] = count || 0
        }
      }
      setResponsesCount(counts)

      const leadershipCounts: Record<string, number> = {}
      for (const assessment of leadershipData || []) {
        if (assessment.status === 'in_progress') {
          const { count } = await supabase
            .from('leadership_responses')
            .select('*', { count: 'exact', head: true })
            .eq('assessment_id', assessment.id)
          leadershipCounts[assessment.id] = count || 0
        }
      }
      setLeadershipResponsesCount(leadershipCounts)

      const completedIds = (assessmentsData || [])
        .filter(a => a.status === 'completed')
        .map(a => a.id)

      if (completedIds.length > 0) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://valutolab-backend.onrender.com'
        
        const sharePromises = completedIds.map(async (id) => {
          try {
            const response = await fetch(`${apiUrl}/api/share/create`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id, assessmentId: id })
            })
            const data = await response.json()
            if (data.success) {
              return { [id]: data.share }
            }
          } catch (error) {
            console.error('Error checking share:', error)
          }
          return null
        })

        const shareResults = await Promise.all(sharePromises)
        const shares: Record<string, ShareData> = shareResults
          .filter((result): result is Record<string, ShareData> => result !== null)
          .reduce((acc, result) => ({ ...acc, ...result }), {} as Record<string, ShareData>)
        
        setShareData(shares)
      }

      setLoading(false)
    }

    fetchData()
  }, [router])

  // Escapa caratteri HTML per prevenire XSS nei template innerHTML del PDF
  const sanitizeText = (value: unknown): string => {
    const str = value == null ? '' : String(value)
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
  }

  const handleGeneratePDF = async (assessmentId: string) => {
    setGeneratingPDF(assessmentId)
    try {
      const { data: assessment } = await supabase
        .from('assessments')
        .select('total_score, completed_at')
        .eq('id', assessmentId)
        .single()

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      const { data: qualitativeReport } = await supabase
        .from('qualitative_reports')
        .select('profile_insights, category_interpretations')
        .eq('assessment_id', assessmentId)
        .single()

      const { data: results } = await supabase
        .from('combined_assessment_results')
        .select('skill_category, final_score')
        .eq('assessment_id', assessmentId)
        .order('final_score', { ascending: false })

      const categoryLabels: Record<string, string> = {
        communication: 'Comunicazione',
        leadership: 'Leadership',
        problem_solving: 'Problem Solving',
        teamwork: 'Lavoro di Squadra',
        time_management: 'Gestione del Tempo',
        adaptability: 'Adattabilità',
        creativity: 'Creatività',
        critical_thinking: 'Pensiero Critico',
        empathy: 'Empatia',
        resilience: 'Resilienza',
        negotiation: 'Negoziazione',
        decision_making: 'Decision Making'
      }

      const categoryIcons: Record<string, string> = {
        communication: '💬',
        leadership: '👑',
        problem_solving: '🧩',
        teamwork: '🤝',
        time_management: '⏰',
        adaptability: '🔄',
        creativity: '🎨',
        critical_thinking: '🧠',
        empathy: '❤️',
        resilience: '💪',
        negotiation: '🤝',
        decision_making: '⚖️'
      }

      const skillColors: Record<string, string> = {
        adaptability: '#06B6D4',
        leadership: '#8B5CF6',
        problem_solving: '#EC4899',
        time_management: '#F59E0B',
        communication: '#3B82F6',
        empathy: '#14B8A6',
        negotiation: '#A855F7',
        decision_making: '#84CC16',
        critical_thinking: '#6366F1',
        teamwork: '#10B981',
        creativity: '#F43F5E',
        resilience: '#EF4444'
      }

      const escoLevelColors: Record<string, { bg: string; border: string; text: string; label: string }> = {
        'Esperto':    { bg: '#DCFCE7', border: '#16A34A', text: '#15803D', label: '★ Esperto' },
        'Avanzato':   { bg: '#DBEAFE', border: '#2563EB', text: '#1D4ED8', label: '▲ Avanzato' },
        'Intermedio': { bg: '#FEF9C3', border: '#CA8A04', text: '#A16207', label: '● Intermedio' },
        'Base':       { bg: '#F3F4F6', border: '#9CA3AF', text: '#6B7280', label: '○ Base' },
      }

      const topSkills = (results || []).slice(0, 3).map(r => ({
        category: categoryLabels[r.skill_category] || r.skill_category,
        icon: categoryIcons[r.skill_category] || '⭐',
        score: parseFloat(r.final_score)
      }))

      const allSkills = (results || []).map(r => ({
        category: categoryLabels[r.skill_category] || r.skill_category,
        name: r.skill_category,
        score: parseFloat(r.final_score)
      }))

      const categoryInterps = qualitativeReport?.category_interpretations || {}
      const escoSummary = qualitativeReport?.profile_insights?.esco_profile_summary || null

      const shareToken = shareData[assessmentId]?.share_token
      const qrCodeUrl = shareToken 
        ? await QRCode.toDataURL(`https://valutolab.com/profile/${shareToken}`, {
            width: 200,
            margin: 2,
            color: { dark: '#8B5CF6', light: '#FFFFFF' }
          })
        : ''

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const imgWidth = 210
      const imgHeight = 297

      const page1Element = document.createElement('div')
      page1Element.style.width = '210mm'
      page1Element.style.height = '297mm'
      page1Element.style.padding = '0'
      page1Element.style.backgroundColor = 'white'
      page1Element.style.fontFamily = 'Arial, sans-serif'
      page1Element.style.position = 'relative'
      page1Element.style.boxSizing = 'border-box'
      page1Element.style.overflow = 'hidden'

      page1Element.innerHTML = `
        <div style="height: 297mm; display: flex; flex-direction: column; font-family: Arial, sans-serif; background: white; box-sizing: border-box;">

          <!-- HEADER FULL-BLEED -->
          <div style="background: linear-gradient(135deg, #2E1065 0%, #5B21B6 55%, #7C3AED 100%); padding: 30px 28px 26px; position: relative; overflow: hidden; flex-shrink: 0;">
            <div style="position: absolute; top: -50px; right: -50px; width: 180px; height: 180px; background: rgba(255,255,255,0.05); border-radius: 50%;"></div>
            <div style="position: absolute; bottom: -30px; right: 110px; width: 100px; height: 100px; background: rgba(255,255,255,0.04); border-radius: 50%;"></div>
            <div style="position: absolute; top: 15px; right: 230px; width: 45px; height: 45px; background: rgba(255,255,255,0.04); border-radius: 50%;"></div>

            <div style="display: flex; justify-content: space-between; align-items: flex-start; position: relative; z-index: 1;">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 18px;">
                  <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.15); border: 1.5px solid rgba(255,255,255,0.3); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <span style="font-size: 24px; font-weight: 900; color: white; line-height: 1;">V</span>
                  </div>
                  <span style="font-size: 22px; font-weight: 800; color: white; letter-spacing: -0.3px;">ValutoLab</span>
                  <span style="font-size: 9px; color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.1); padding: 2px 9px; border-radius: 99px; border: 1px solid rgba(255,255,255,0.15); letter-spacing: 0.5px;">Soft Skills</span>
                </div>
                <p style="color: rgba(255,255,255,0.5); font-size: 9.5px; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 2px;">Certificato di Valutazione Professionale</p>
                <h2 style="color: white; font-size: 28px; font-weight: 800; margin: 0 0 7px 0; line-height: 1.1;">${sanitizeText(profile?.full_name) || 'Utente ValutoLab'}</h2>
                <p style="color: rgba(255,255,255,0.5); font-size: 11px; margin: 0;">${new Date(assessment?.completed_at || '').toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <div style="text-align: center; background: rgba(255,255,255,0.1); border: 1.5px solid rgba(255,255,255,0.2); border-radius: 16px; padding: 16px 22px; flex-shrink: 0; margin-left: 20px;">
                <p style="color: rgba(255,255,255,0.55); font-size: 9px; margin: 0 0 3px 0; text-transform: uppercase; letter-spacing: 1.5px;">Score Totale</p>
                <p style="color: white; font-size: 50px; font-weight: 900; margin: 0; line-height: 1; letter-spacing: -2px;">${assessment?.total_score?.toFixed(1)}</p>
                <p style="color: rgba(255,255,255,0.4); font-size: 12px; margin: 1px 0 0 0;">/ 5.0</p>
              </div>
            </div>
          </div>

          <!-- BODY -->
          <div style="flex: 1; padding: 22px 28px 14px; display: flex; flex-direction: column; gap: 17px; overflow: hidden;">

            <!-- Profilo professionale -->
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 9px;">
                <div style="width: 3px; height: 16px; background: linear-gradient(180deg, #7C3AED, #3B82F6); border-radius: 2px;"></div>
                <span style="font-size: 9.5px; font-weight: 700; color: #6D28D9; text-transform: uppercase; letter-spacing: 2px;">Profilo Professionale</span>
              </div>
              <div style="background: linear-gradient(135deg, #F5F3FF, #EDE9FE); border-radius: 10px; padding: 14px 18px; border: 1px solid #C4B5FD;">
                <p style="font-size: 17px; font-weight: 800; color: #4C1D95; margin: 0; line-height: 1.3;">"${sanitizeText(qualitativeReport?.profile_insights?.suggested_profile) || 'N/A'}"</p>
              </div>
            </div>

            <!-- Sintesi -->
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 9px;">
                <div style="width: 3px; height: 16px; background: linear-gradient(180deg, #7C3AED, #3B82F6); border-radius: 2px;"></div>
                <span style="font-size: 9.5px; font-weight: 700; color: #6D28D9; text-transform: uppercase; letter-spacing: 2px;">Sintesi del Profilo</span>
              </div>
              <p style="color: #374151; line-height: 1.75; margin: 0; font-size: 12px; text-align: justify;">${sanitizeText(qualitativeReport?.profile_insights?.summary) || 'Descrizione del profilo professionale non disponibile.'}</p>
            </div>

            <!-- Punti di forza -->
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 9px;">
                <div style="width: 3px; height: 16px; background: linear-gradient(180deg, #2563EB, #06B6D4); border-radius: 2px;"></div>
                <span style="font-size: 9.5px; font-weight: 700; color: #1D4ED8; text-transform: uppercase; letter-spacing: 2px;">Punti di Forza Unici</span>
              </div>
              <div style="background: #EFF6FF; border-radius: 10px; padding: 12px 16px; border: 1px solid #BFDBFE;">
                <p style="color: #1E3A8A; line-height: 1.65; margin: 0; font-size: 12px;">${sanitizeText(qualitativeReport?.profile_insights?.unique_strengths) || 'N/A'}</p>
              </div>
            </div>

            <!-- Top 3 competenze -->
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 11px;">
                <div style="width: 3px; height: 16px; background: linear-gradient(180deg, #7C3AED, #3B82F6); border-radius: 2px;"></div>
                <span style="font-size: 9.5px; font-weight: 700; color: #6D28D9; text-transform: uppercase; letter-spacing: 2px;">Top 3 Competenze</span>
              </div>
              <div style="display: flex; gap: 10px;">
                ${topSkills.map((skill, idx) => {
                  const gradients = [
                    'linear-gradient(150deg, #4C1D95, #7C3AED)',
                    'linear-gradient(150deg, #1E40AF, #3B82F6)',
                    'linear-gradient(150deg, #155E75, #0891B2)'
                  ]
                  const textColors = ['#6D28D9', '#1D4ED8', '#0E7490']
                  const borderColors = ['#C4B5FD', '#BFDBFE', '#A5F3FC']
                  const bgColors = ['#F5F3FF', '#EFF6FF', '#ECFEFF']
                  const rankLabels = ['1°', '2°', '3°']
                  return `
                    <div style="flex: 1; border-radius: 12px; overflow: hidden; box-shadow: 0 3px 14px rgba(0,0,0,0.09);">
                      <div style="background: ${gradients[idx]}; padding: 18px 10px 14px; text-align: center; position: relative;">
                        <div style="position: absolute; top: 7px; right: 9px; background: rgba(255,255,255,0.18); border-radius: 99px; padding: 1px 7px; font-size: 9px; color: rgba(255,255,255,0.9); font-weight: 700;">${rankLabels[idx]}</div>
                        <div style="font-size: 32px; line-height: 1; margin-bottom: 8px;">${skill.icon}</div>
                        <div style="font-size: 10.5px; color: rgba(255,255,255,0.9); font-weight: 600; line-height: 1.3;">${sanitizeText(skill.category)}</div>
                      </div>
                      <div style="background: ${bgColors[idx]}; padding: 11px 10px 13px; text-align: center; border: 1px solid ${borderColors[idx]}; border-top: none; border-radius: 0 0 12px 12px;">
                        <span style="font-size: 26px; font-weight: 900; color: ${textColors[idx]};">${skill.score.toFixed(1)}</span>
                        <span style="font-size: 12px; color: #9CA3AF;">/5.0</span>
                        <div style="margin-top: 6px; height: 4px; background: rgba(0,0,0,0.08); border-radius: 2px; overflow: hidden;">
                          <div style="height: 100%; background: ${textColors[idx]}; border-radius: 2px; width: ${(skill.score / 5) * 100}%;"></div>
                        </div>
                      </div>
                    </div>
                  `
                }).join('')}
              </div>
            </div>

          </div>

          <!-- FOOTER -->
          <div style="padding: 9px 28px 14px; border-top: 1px solid #F3F4F6; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
            <span style="font-size: 9px; color: #C4B5FD; font-weight: 700; letter-spacing: 0.5px;">VALUTOLAB.COM</span>
            <span style="font-size: 9px; color: #D1D5DB;">Pagina 1 / 3</span>
          </div>

        </div>
      `

      document.body.appendChild(page1Element)
      const canvas1 = await html2canvas(page1Element, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' })
      pdf.addImage(canvas1.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight)
      document.body.removeChild(page1Element)

      pdf.addPage()

      const page2Element = document.createElement('div')
      page2Element.style.width = '210mm'
      page2Element.style.height = '297mm'
      page2Element.style.padding = '0'
      page2Element.style.backgroundColor = 'white'
      page2Element.style.fontFamily = 'Arial, sans-serif'
      page2Element.style.position = 'relative'
      page2Element.style.boxSizing = 'border-box'
      page2Element.style.overflow = 'hidden'

      page2Element.innerHTML = `
        <div style="height: 297mm; display: flex; flex-direction: column; font-family: Arial, sans-serif; background: white; box-sizing: border-box;">

          <!-- HEADER SLIM -->
          <div style="background: linear-gradient(135deg, #2E1065, #5B21B6, #7C3AED); padding: 14px 28px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 28px; height: 28px; background: rgba(255,255,255,0.16); border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <span style="font-size: 16px; font-weight: 900; color: white;">V</span>
              </div>
              <span style="font-size: 14px; font-weight: 700; color: white;">ValutoLab</span>
              <span style="font-size: 9px; color: rgba(255,255,255,0.4);">·</span>
              <span style="font-size: 11px; color: rgba(255,255,255,0.65);">Profilo Competenze</span>
            </div>
            <span style="font-size: 9.5px; color: rgba(255,255,255,0.45);">${sanitizeText(profile?.full_name) || ''}</span>
          </div>

          <!-- BODY -->
          <div style="flex: 1; padding: 18px 28px 14px; display: flex; flex-direction: column;">

            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px; flex-shrink: 0;">
              <div style="width: 3px; height: 16px; background: linear-gradient(180deg, #7C3AED, #3B82F6); border-radius: 2px;"></div>
              <span style="font-size: 9.5px; font-weight: 700; color: #6D28D9; text-transform: uppercase; letter-spacing: 2px;">Tutte le Competenze</span>
            </div>

            <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
              ${allSkills.map((skill, index) => {
                const color = skillColors[skill.name] || '#8B5CF6'
                const percentage = (skill.score / 5) * 100
                const icon = categoryIcons[skill.name] || '⭐'
                const isEven = index % 2 === 0
                return `
                  <div style="display: flex; align-items: center; gap: 11px; padding: 9px 13px; border-radius: 9px; background: ${isEven ? '#FAFAFA' : 'white'}; border: 1px solid ${isEven ? '#F3F4F6' : '#F9FAFB'};">
                    <span style="font-size: 10px; font-weight: 700; color: #D1D5DB; width: 16px; flex-shrink: 0; text-align: right;">${index + 1}</span>
                    <span style="font-size: 19px; line-height: 1; flex-shrink: 0; width: 24px; text-align: center;">${icon}</span>
                    <span style="font-size: 12px; font-weight: 600; color: #1F2937; width: 155px; flex-shrink: 0; line-height: 1.2;">${sanitizeText(skill.category)}</span>
                    <div style="flex: 1; background: #F3F4F6; height: 13px; border-radius: 7px; overflow: hidden;">
                      <div style="height: 100%; background: linear-gradient(90deg, ${color}BB, ${color}); border-radius: 7px; width: ${percentage}%;"></div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 5px; flex-shrink: 0; width: 82px; justify-content: flex-end;">
                      <span style="font-size: 14px; font-weight: 800; color: ${color};">${skill.score.toFixed(1)}</span>
                      <span style="font-size: 9px; color: #9CA3AF;">/5</span>
                      <span style="font-size: 8.5px; background: #F3F4F6; color: #6B7280; padding: 1px 5px; border-radius: 4px; font-weight: 600;">${Math.round(percentage)}%</span>
                    </div>
                  </div>
                `
              }).join('')}
            </div>

          </div>

          <!-- FOOTER -->
          <div style="padding: 11px 28px 15px; border-top: 1px solid #F3F4F6; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
            <div>
              <p style="font-size: 10px; font-weight: 600; color: #6B7280; margin: 0 0 2px 0;">Certificato Verificabile</p>
              <p style="font-size: 13px; font-weight: 700; color: #7C3AED; margin: 0 0 2px 0;">valutolab.com</p>
              <p style="font-size: 9px; color: #9CA3AF; margin: 0;">ID: ${assessmentId.substring(0, 8)}</p>
            </div>
            <div style="display: flex; align-items: center; gap: 14px;">
              ${qrCodeUrl ? `
                <div style="text-align: center;">
                  <img src="${qrCodeUrl}" alt="QR Code" style="width: 68px; height: 68px; border: 1.5px solid #E5E7EB; border-radius: 8px; display: block;" />
                  <p style="font-size: 8px; color: #9CA3AF; margin: 3px 0 0 0;">Scansiona per verificare</p>
                </div>
              ` : ''}
              <span style="font-size: 9px; color: #D1D5DB;">Pagina 2 / 3</span>
            </div>
          </div>

        </div>
      `

      document.body.appendChild(page2Element)
      const canvas2 = await html2canvas(page2Element, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' })
      pdf.addImage(canvas2.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight)
      document.body.removeChild(page2Element)

      pdf.addPage()

      const escoLevelCount = { Esperto: 0, Avanzato: 0, Intermedio: 0, Base: 0 }
      Object.values(categoryInterps).forEach((interp: any) => {
        const lvl = interp?.esco_mapping?.esco_level
        if (lvl && escoLevelCount.hasOwnProperty(lvl)) {
          escoLevelCount[lvl as keyof typeof escoLevelCount]++
        }
      })

      const canonicalOrder = [
        'communication','leadership','problem_solving','teamwork',
        'time_management','adaptability','creativity','critical_thinking',
        'empathy','resilience','negotiation','decision_making'
      ]

      const page3Element = document.createElement('div')
      page3Element.style.width = '210mm'
      page3Element.style.height = '297mm'
      page3Element.style.padding = '0'
      page3Element.style.backgroundColor = 'white'
      page3Element.style.fontFamily = 'Arial, sans-serif'
      page3Element.style.position = 'relative'
      page3Element.style.boxSizing = 'border-box'
      page3Element.style.overflow = 'hidden'

      page3Element.innerHTML = `
        <div style="height: 297mm; display: flex; flex-direction: column; font-family: Arial, sans-serif; background: white; box-sizing: border-box;">

          <!-- HEADER SLIM BLU -->
          <div style="background: linear-gradient(135deg, #1E3A5F 0%, #1D4ED8 60%, #2563EB 100%); padding: 15px 28px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; position: relative; overflow: hidden;">
            <div style="position: absolute; top: -25px; right: -25px; width: 100px; height: 100px; background: rgba(255,255,255,0.05); border-radius: 50%;"></div>
            <div style="display: flex; align-items: center; gap: 12px; position: relative; z-index: 1;">
              <div style="width: 36px; height: 36px; background: rgba(255,255,255,0.14); border: 1.5px solid rgba(255,255,255,0.25); border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <span style="font-size: 12px; font-weight: 900; color: white; letter-spacing: -0.5px;">EU</span>
              </div>
              <div>
                <p style="color: rgba(255,255,255,0.5); font-size: 9px; margin: 0; text-transform: uppercase; letter-spacing: 1.5px;">Framework Europeo</p>
                <h2 style="color: white; font-size: 16px; font-weight: 800; margin: 0; line-height: 1.1;">Profilo ESCO v1.2</h2>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; position: relative; z-index: 1;">
              <div style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 7px; padding: 5px 11px; text-align: center;">
                <p style="font-size: 8.5px; font-weight: 700; color: rgba(255,255,255,0.8); margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">ESCO-Aligned</p>
                <p style="font-size: 7.5px; color: rgba(255,255,255,0.5); margin: 0;">ValutoLab Certified</p>
              </div>
              <span style="font-size: 9px; color: rgba(255,255,255,0.4);">${sanitizeText(profile?.full_name) || ''}</span>
            </div>
          </div>

          <!-- BODY -->
          <div style="flex: 1; padding: 14px 28px 12px; display: flex; flex-direction: column; overflow: hidden;">

            ${escoSummary ? `
            <div style="background: #EFF6FF; border-left: 3px solid #2563EB; border-radius: 8px; padding: 11px 15px; margin-bottom: 13px; flex-shrink: 0;">
              <p style="font-size: 9px; font-weight: 700; color: #1D4ED8; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 1px;">Analisi del Profilo ESCO</p>
              <p style="font-size: 11px; color: #1E3A5F; line-height: 1.6; margin: 0;">${sanitizeText(escoSummary)}</p>
            </div>
            ` : `
            <div style="background: #EFF6FF; border-left: 3px solid #2563EB; border-radius: 8px; padding: 11px 15px; margin-bottom: 13px; flex-shrink: 0;">
              <p style="font-size: 11px; color: #1E3A5F; line-height: 1.6; margin: 0;">Competenze valutate secondo il framework ESCO v1.2, standard ufficiale della Commissione Europea per il riconoscimento delle competenze nel mercato del lavoro europeo.</p>
            </div>
            `}

            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-shrink: 0;">
              <div style="width: 3px; height: 16px; background: linear-gradient(180deg, #1D4ED8, #06B6D4); border-radius: 2px;"></div>
              <span style="font-size: 9.5px; font-weight: 700; color: #1D4ED8; text-transform: uppercase; letter-spacing: 2px;">Livelli ESCO per Competenza</span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; flex: 1;">
              ${canonicalOrder.map((cat) => {
                const interp = categoryInterps[cat] as any
                const escoLevel = interp?.esco_mapping?.esco_level || 'Base'
                const escoGroup = interp?.esco_mapping?.esco_group || ''
                const score = interp?.score || 0
                const colors = escoLevelColors[escoLevel] || escoLevelColors['Base']
                const icon = categoryIcons[cat] || '⭐'
                const label = categoryLabels[cat] || cat
                const percentage = (score / 5) * 100
                return `
                  <div style="background: ${colors.bg}; border: 1.5px solid ${colors.border}; border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; gap: 5px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <span style="font-size: 15px; line-height: 1; flex-shrink: 0;">${icon}</span>
                      <span style="font-size: 11px; font-weight: 700; color: #1F2937; line-height: 1.2;">${sanitizeText(label)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span style="font-size: 9.5px; font-weight: 700; color: ${colors.text}; background: ${colors.border}33; padding: 1px 6px; border-radius: 4px;">${colors.label}</span>
                      <span style="font-size: 12px; font-weight: 800; color: ${colors.text};">${score.toFixed(1)}</span>
                    </div>
                    <div style="height: 3px; background: rgba(0,0,0,0.07); border-radius: 2px; overflow: hidden;">
                      <div style="height: 100%; background: ${colors.border}; border-radius: 2px; width: ${percentage}%;"></div>
                    </div>
                    ${escoGroup ? `<p style="font-size: 8.5px; color: #6B7280; margin: 0; line-height: 1.3;">${sanitizeText(escoGroup)}</p>` : ''}
                  </div>
                `
              }).join('')}
            </div>

          </div>

          <!-- FOOTER -->
          <div style="padding: 9px 28px 13px; border-top: 1px solid #DBEAFE; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
            <div>
              <p style="font-size: 9px; color: #6B7280; margin: 0 0 1px 0;">Certificato generato da ValutoLab · valutolab.com</p>
              <p style="font-size: 8.5px; color: #9CA3AF; margin: 0;">ID: ${assessmentId.substring(0, 8)} · ${new Date(assessment?.completed_at || '').toLocaleDateString('it-IT')}</p>
            </div>
            <div style="text-align: right;">
              <div style="display: flex; gap: 9px; flex-wrap: wrap; justify-content: flex-end; margin-bottom: 3px;">
                ${Object.entries(escoLevelColors).map(([level, c]) => `
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <div style="width: 8px; height: 8px; background: ${c.bg}; border: 1.5px solid ${c.border}; border-radius: 2px; flex-shrink: 0;"></div>
                    <span style="font-size: 8px; color: #374151;">${c.label} (${escoLevelCount[level as keyof typeof escoLevelCount]})</span>
                  </div>
                `).join('')}
              </div>
              <p style="font-size: 8.5px; color: #9CA3AF; margin: 0;">ESCO v1.2 · Commissione Europea, maggio 2024 · Pagina 3 / 3</p>
            </div>
          </div>

        </div>
      `

      document.body.appendChild(page3Element)
      const canvas3 = await html2canvas(page3Element, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' })
      pdf.addImage(canvas3.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight)
      document.body.removeChild(page3Element)

      pdf.save(`ValutoLab_Certificato_${profile?.full_name || 'Utente'}.pdf`)
      showMessage('success', 'PDF scaricato con successo!')

    } catch (error) {
      console.error('Error generating PDF:', error)
      showMessage('error', 'Errore nella generazione del PDF')
    } finally {
      setGeneratingPDF(null)
    }
  }

  const handleToggleShare = async (assessmentId: string) => {
    if (!user || !shareData[assessmentId]) return
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://valutolab-backend.onrender.com'
      const response = await fetch(
        `${apiUrl}/api/share/${shareData[assessmentId].share_token}/toggle`,
        { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id }) }
      )
      const data = await response.json()
      if (data.success) {
        setShareData({ ...shareData, [assessmentId]: data.share })
        showMessage('success', data.message)
      }
    } catch (error) {
      showMessage('error', "Errore durante l'aggiornamento")
    }
  }

  const handleCopyLink = (assessmentId: string) => {
    if (!shareData[assessmentId]) return
    navigator.clipboard.writeText(`https://valutolab.com/profile/${shareData[assessmentId].share_token}`)
    showMessage('success', 'Link copiato!')
  }

  const handleOpenBadge = async (assessmentId: string) => {
    try {
      const { data: assessment } = await supabase.from('assessments').select('total_score').eq('id', assessmentId).single()
      const { data: profile } = await supabase.from('user_profiles').select('full_name').eq('id', user.id).single()
      const { data: results } = await supabase.from('combined_assessment_results').select('skill_category, final_score').eq('assessment_id', assessmentId).order('final_score', { ascending: false }).limit(3)
      const categoryLabels: Record<string, string> = {
        communication: 'Comunicazione', leadership: 'Leadership', problem_solving: 'Problem Solving',
        teamwork: 'Lavoro di Squadra', time_management: 'Gestione del Tempo', adaptability: 'Adattabilità',
        creativity: 'Creatività', critical_thinking: 'Pensiero Critico', empathy: 'Empatia',
        resilience: 'Resilienza', negotiation: 'Negoziazione', decision_making: 'Decision Making'
      }
      const topSkills = (results || []).map(r => ({ name: categoryLabels[r.skill_category] || r.skill_category, score: Math.round(parseFloat(r.final_score) * 20) }))
      setBadgeModal({ open: true, assessmentId, userName: profile?.full_name || 'Utente ValutoLab', score: assessment?.total_score || 0, topSkills, shareToken: shareData[assessmentId]?.share_token || '' })
    } catch (error) {
      showMessage('error', 'Errore nel caricamento dei dati')
    }
  }

  const handleOpenQR = async (assessmentId: string) => {
    try {
      const { data: profile } = await supabase.from('user_profiles').select('full_name').eq('id', user.id).single()
      const shareToken = shareData[assessmentId]?.share_token
      if (!shareToken) { showMessage('error', 'Errore: token di condivisione non trovato'); return }
      setQrModal({ open: true, profileUrl: `https://valutolab.com/profile/${shareToken}`, userName: profile?.full_name || 'Utente ValutoLab' })
    } catch (error) {
      showMessage('error', 'Errore nel caricamento del QR code')
    }
  }

  const handleStartNewAssessment = async () => {
    const isTrial = user?.user_metadata?.role === 'trial_user'
    if (isTrial) {
      try {
        const { data: newAssessment, error } = await supabase
          .from('assessments')
          .insert({ user_id: user.id, status: 'in_progress' })
          .select()
          .single()
        if (error) throw error
        router.push(`/assessment/${newAssessment.id}`)
      } catch (error) {
        console.error('Error starting assessment:', error)
        alert("Errore nell'avvio dell'assessment. Riprova.")
      }
    } else {
      router.push('/servizi')
    }
  }

  const handleDeleteLeadership = async (assessmentId: string) => {
    setDeleting(assessmentId)
    try {
      await supabase.from('leadership_responses').delete().eq('assessment_id', assessmentId)
      await supabase.from('leadership_results').delete().eq('assessment_id', assessmentId)
      await supabase.from('leadership_ai_reports').delete().eq('assessment_id', assessmentId)
      await supabase.from('leadership_assessments').delete().eq('id', assessmentId)
      setLeadershipAssessments(leadershipAssessments.filter(a => a.id !== assessmentId))
      showMessage('success', 'Leadership assessment eliminato')
    } catch (error) {
      showMessage('error', "Errore nell'eliminazione")
    } finally {
      setDeleting(null)
    }
  }

  const handleDeleteAssessment = async (assessmentId: string) => {
    setDeleting(assessmentId)
    try {
      await supabase.from('assessment_responses').delete().eq('assessment_id', assessmentId)
      await supabase.from('situational_responses').delete().eq('assessment_id', assessmentId)
      await supabase.from('assessment_results').delete().eq('assessment_id', assessmentId)
      await supabase.from('qualitative_reports').delete().eq('assessment_id', assessmentId)
      await supabase.from('shared_profiles').delete().eq('assessment_id', assessmentId)
      await supabase.from('assessments').delete().eq('id', assessmentId)
      setAssessments(assessments.filter(a => a.id !== assessmentId))
      showMessage('success', 'Assessment eliminato')
    } catch (error) {
      showMessage('error', "Errore nell'eliminazione")
    } finally {
      setDeleting(null)
    }
  }

  const handlePrintPDF = (assessmentId: string) => {
    router.push(`/dashboard/results/${assessmentId}`)
  }

  const handleShareEmail = (assessmentId: string) => {
    const subject = encodeURIComponent('I miei risultati ValutoLab')
    const body = encodeURIComponent(`Ecco i risultati del mio assessment delle soft skills:\n\n${window.location.origin}/dashboard/results/${assessmentId}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    )
  }

  const inProgressAssessments = assessments.filter(a => a.status === 'in_progress')
  const completedAssessments = assessments.filter(a => a.status === 'completed')
  const inProgressLeadership = leadershipAssessments.filter(a => a.status === 'in_progress')
  const completedLeadership = leadershipAssessments.filter(a => a.status === 'completed')

  const isTrial = user?.user_metadata?.role === 'trial_user'

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white font-semibold`}>
          {message.text}
        </div>
      )}

      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">ValutoLab</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">{user?.email}</span>
              <button onClick={handleSignOut} className="text-gray-600 hover:text-gray-900">Esci</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Gestisci i tuoi assessment delle soft skills</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nuovo Assessment</h3>
              <p className="text-gray-600">
                {isTrial ? 'Inizia il tuo assessment gratuito delle soft skills' : 'Scegli tra Assessment Base o Leadership Deep Dive'}
              </p>
            </div>
            <button onClick={handleStartNewAssessment} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition shadow-lg">
              {isTrial ? 'Inizia Assessment' : '+ Vai ai Servizi'}
            </button>
          </div>
        </div>

        {inProgressAssessments.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Assessment Base in Corso</h3>
            <div className="space-y-4">
              {inProgressAssessments.map((assessment) => {
                const answeredCount = responsesCount[assessment.id] || 0
                const progress = Math.round((answeredCount / 48) * 100)
                return (
                  <div key={assessment.id} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Assessment Soft Skills</h4>
                        <p className="text-sm text-gray-600">Iniziato il {new Date(assessment.created_at).toLocaleDateString('it-IT')}</p>
                      </div>
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">In corso</span>
                    </div>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progresso: {answeredCount}/48 domande</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => router.push(`/assessment/${assessment.id}`)} className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition">Riprendi Assessment</button>
                      <button onClick={() => { if (window.confirm('Eliminare questo assessment?')) handleDeleteAssessment(assessment.id) }} disabled={deleting === assessment.id} className="px-4 py-2 border-2 border-red-300 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition disabled:opacity-50">
                        {deleting === assessment.id ? 'Eliminazione...' : 'Elimina'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {inProgressLeadership.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Leadership Deep Dive in Corso</h3>
            <div className="space-y-4">
              {inProgressLeadership.map((assessment) => {
                const answeredCount = leadershipResponsesCount[assessment.id] || 0
                const progress = Math.round((answeredCount / 30) * 100)
                return (
                  <div key={assessment.id} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Leadership Deep Dive</h4>
                        <p className="text-sm text-gray-600">Iniziato il {new Date(assessment.created_at).toLocaleDateString('it-IT')}</p>
                      </div>
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">In corso</span>
                    </div>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progresso: {answeredCount}/30 domande</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-gradient-to-r from-yellow-500 to-orange-600 h-3 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => router.push(`/leadership/${assessment.id}`)} className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-700 transition">Riprendi Leadership Assessment</button>
                      <button onClick={() => { if (window.confirm('Eliminare questo assessment?')) handleDeleteLeadership(assessment.id) }} disabled={deleting === assessment.id} className="px-4 py-2 border-2 border-red-300 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition disabled:opacity-50">
                        {deleting === assessment.id ? 'Eliminazione...' : 'Elimina'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {(completedAssessments.length > 0 || completedLeadership.length > 0) && (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Assessment Completati</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedAssessments.map((assessment) => {
                const share = shareData[assessment.id]
                return (
                  <div key={assessment.id} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Assessment Soft Skills</h4>
                        <p className="text-sm text-gray-600">Completato il {new Date(assessment.completed_at || '').toLocaleDateString('it-IT')}</p>
                      </div>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">Completato</span>
                    </div>
                    <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-600 mb-1">Punteggio Generale</p>
                      <p className="text-3xl font-bold text-gray-900">{assessment.total_score?.toFixed(1)}<span className="text-lg text-gray-600">/5.0</span></p>
                    </div>
                    <div className="space-y-3">
                      <button onClick={() => router.push(`/dashboard/results/${assessment.id}`)} className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition">
                        Visualizza Risultati
                      </button>
                      {share && (
                        <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-700">Condivisione</span>
                              {share.is_active && <span className="text-xs text-gray-600">{share.view_count} views</span>}
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" checked={share.is_active} onChange={() => handleToggleShare(assessment.id)} className="sr-only peer" />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                          </div>
                          {share.is_active && (
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <input type="text" value={`valutolab.com/profile/${share.share_token}`} readOnly className="flex-1 px-3 py-1 text-xs border border-gray-300 rounded bg-white text-gray-600 font-mono" />
                                <button onClick={() => handleCopyLink(assessment.id)} className="px-3 py-1 bg-purple-600 text-white rounded text-xs font-semibold hover:bg-purple-700">Copia</button>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => handleOpenBadge(assessment.id)} className="px-2 py-1 border border-purple-300 text-purple-700 rounded text-xs font-semibold hover:bg-purple-50">Badge</button>
                                <button onClick={() => handleOpenQR(assessment.id)} className="px-2 py-1 border border-purple-300 text-purple-700 rounded text-xs font-semibold hover:bg-purple-50">QR</button>
                                <button onClick={() => handleGeneratePDF(assessment.id)} disabled={generatingPDF === assessment.id} className="px-2 py-1 border border-purple-300 text-purple-700 rounded text-xs font-semibold hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed">
                                  {generatingPDF === assessment.id ? '...' : 'PDF'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => handlePrintPDF(assessment.id)} className="px-3 py-2 border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-1">
                          PDF
                        </button>
                        <button onClick={() => handleShareEmail(assessment.id)} className="px-3 py-2 border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-1">
                          Email
                        </button>
                        <button onClick={() => { if (window.confirm('Eliminare questo assessment? Azione irreversibile.')) handleDeleteAssessment(assessment.id) }} disabled={deleting === assessment.id} className="px-3 py-2 border-2 border-red-300 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition disabled:opacity-50 flex items-center justify-center gap-1">
                          {deleting === assessment.id ? '...' : 'Elimina'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}

              {completedLeadership.map((assessment) => (
                <div key={assessment.id} className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-yellow-500">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">Leadership Deep Dive</h4>
                      <p className="text-sm text-gray-600">Completato il {new Date(assessment.completed_at || '').toLocaleDateString('it-IT')}</p>
                    </div>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">Completato</span>
                  </div>
                  <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-600 mb-1">Punteggio Leadership</p>
                    <p className="text-3xl font-bold text-gray-900">{assessment.total_score?.toFixed(1)}<span className="text-lg text-gray-600">/5.0</span></p>
                  </div>
                  <div className="space-y-2">
                    <button onClick={() => router.push(`/leadership/${assessment.id}/results`)} className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-700 transition">
                      Visualizza Risultati Leadership
                    </button>
                    <button onClick={() => { if (window.confirm('Eliminare questo assessment?')) handleDeleteLeadership(assessment.id) }} disabled={deleting === assessment.id} className="w-full px-4 py-2 border-2 border-red-300 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition disabled:opacity-50">
                      {deleting === assessment.id ? 'Eliminazione...' : 'Elimina'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {assessments.length === 0 && leadershipAssessments.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nessun assessment ancora</h3>
            <p className="text-gray-600 mb-4">Inizia il tuo primo assessment per scoprire le tue competenze</p>
            <button onClick={handleStartNewAssessment} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition shadow-lg">
              {isTrial ? 'Inizia Assessment Gratuito' : 'Vai ai Servizi'}
            </button>
          </div>
        )}

        {badgeModal?.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Badge LinkedIn</h3>
                <button onClick={() => setBadgeModal(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <BadgeGenerator userName={badgeModal.userName} score={badgeModal.score} topSkills={badgeModal.topSkills} shareToken={badgeModal.shareToken} />
            </div>
          </div>
        )}

        {qrModal?.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
              <QRCodeGenerator profileUrl={qrModal.profileUrl} userName={qrModal.userName} onClose={() => setQrModal(null)} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
