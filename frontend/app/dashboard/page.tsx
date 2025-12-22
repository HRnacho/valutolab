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

      // Carica assessment base
      const { data: assessmentsData } = await supabase
        .from('assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setAssessments(assessmentsData || [])

      // Carica leadership assessments
      const { data: leadershipData } = await supabase
        .from('leadership_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setLeadershipAssessments(leadershipData || [])

      // Conta risposte assessment base
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

      // Conta risposte leadership
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
          .reduce((acc, result) => {
            return { ...acc, ...result }
          }, {} as Record<string, ShareData>)
        
        setShareData(shares)
      }

      setLoading(false)
    }

    fetchData()
  }, [router])

  const handleGeneratePDF = async (assessmentId: string) => {
    setGeneratingPDF(assessmentId)
    try {
      // 1. Carica tutti i dati necessari
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
        .select('profile_insights')
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

      // 2. Genera QR Code
      const shareToken = shareData[assessmentId]?.share_token
      const qrCodeUrl = shareToken 
        ? await QRCode.toDataURL(`https://valutolab.com/profile/${shareToken}`, {
            width: 200,
            margin: 2,
            color: { dark: '#8B5CF6', light: '#FFFFFF' }
          })
        : ''

      // 3. Inizializza PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // PAGINA 1
      const page1Element = document.createElement('div')
      page1Element.style.width = '210mm'
      page1Element.style.height = '297mm'
      page1Element.style.padding = '20mm'
      page1Element.style.backgroundColor = 'white'
      page1Element.style.fontFamily = 'Arial, sans-serif'
      page1Element.style.position = 'relative'
      page1Element.style.boxSizing = 'border-box'
      
      page1Element.innerHTML = `
        <!-- Watermark -->
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; font-weight: bold; color: rgba(147, 51, 234, 0.08); white-space: nowrap; z-index: 0; pointer-events: none;">
          ValutoLab
        </div>

        <!-- Content -->
        <div style="position: relative; z-index: 1;">
          <!-- Header -->
          <div style="text-align: center; border-bottom: 4px solid #9333EA; padding-bottom: 25px; margin-bottom: 25px;">
            <div style="width: 80px; height: 80px; margin: 0 auto 15px; background: linear-gradient(135deg, #EC4899, #8B5CF6, #3B82F6); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);">
              <span style="font-size: 48px; font-weight: 900; color: white;">V</span>
            </div>
            <h1 style="font-size: 36px; font-weight: bold; color: #1F2937; margin: 10px 0 8px 0;">ValutoLab</h1>
            <h2 style="font-size: 20px; font-weight: 600; color: #6B7280; margin: 0 0 5px 0;">Certificato di Valutazione Professionale</h2>
            <p style="color: #9CA3AF; font-size: 14px; margin: 0;">Soft Skills Assessment</p>
          </div>

          <!-- Info Utente -->
          <div style="background: linear-gradient(to right, #F3E8FF, #DBEAFE); padding: 20px 25px; border-radius: 10px; margin-bottom: 25px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="flex: 1;">
                <h3 style="font-size: 24px; font-weight: bold; color: #1F2937; margin: 0 0 12px 0;">${profile?.full_name || 'Utente ValutoLab'}</h3>
                <p style="font-weight: 600; color: #6B7280; margin: 0 0 3px 0; font-size: 13px;">Data Valutazione:</p>
                <p style="color: #9CA3AF; font-size: 13px; margin: 0;">${new Date(assessment?.completed_at || '').toLocaleDateString('it-IT')}</p>
              </div>
              <div style="text-align: right;">
                <p style="font-weight: 600; color: #6B7280; margin: 0 0 3px 0; font-size: 13px;">Punteggio Generale:</p>
                <p style="font-size: 36px; font-weight: bold; color: #9333EA; margin: 0; line-height: 1;">${assessment?.total_score?.toFixed(1)}<span style="font-size: 20px; color: #9CA3AF;">/5.0</span></p>
              </div>
            </div>
          </div>

          <!-- Profilo Professionale -->
          <div style="margin-bottom: 25px;">
            <h3 style="font-size: 18px; font-weight: bold; color: #1F2937; margin: 0 0 12px 0; display: flex; align-items: center;">
              <span style="font-size: 24px; margin-right: 8px;">🎯</span>
              Profilo Professionale
            </h3>
            
            <!-- Titolo Profilo -->
            <div style="background-color: #F3E8FF; padding: 18px 20px; border-radius: 10px; border-left: 4px solid #9333EA; margin-bottom: 15px;">
              <p style="font-size: 20px; font-weight: bold; color: #7C3AED; margin: 0; line-height: 1.3;">${qualitativeReport?.profile_insights?.suggested_profile || 'N/A'}</p>
            </div>
            
            <!-- Descrizione Completa -->
            <div style="background-color: #F9FAFB; padding: 16px 20px; border-radius: 10px; border: 1px solid #E5E7EB;">
              <p style="color: #374151; line-height: 1.7; margin: 0; font-size: 13px; text-align: justify;">${qualitativeReport?.profile_insights?.summary || 'Descrizione del profilo professionale non disponibile.'}</p>
            </div>
          </div>

          <!-- Unicità -->
          <div style="margin-bottom: 25px;">
            <h3 style="font-size: 18px; font-weight: bold; color: #1F2937; margin: 0 0 12px 0; display: flex; align-items: center;">
              <span style="font-size: 24px; margin-right: 8px;">✨</span>
              La Tua Unicità
            </h3>
            <div style="background-color: #DBEAFE; padding: 18px 20px; border-radius: 10px; border-left: 4px solid #3B82F6;">
              <p style="color: #374151; line-height: 1.5; margin: 0; font-size: 14px;">${qualitativeReport?.profile_insights?.unique_strengths || 'N/A'}</p>
            </div>
          </div>

          <!-- Top 3 Competenze -->
          <div style="margin-bottom: 0;">
            <h3 style="font-size: 18px; font-weight: bold; color: #1F2937; margin: 0 0 15px 0; display: flex; align-items: center;">
              <span style="font-size: 24px; margin-right: 8px;">🏆</span>
              Top 3 Competenze
            </h3>
            <div style="display: flex; gap: 12px; justify-content: space-between;">
              ${topSkills.map((skill) => `
                <div style="flex: 1; text-align: center; padding: 18px 15px; border-radius: 10px; background: linear-gradient(135deg, #F3E8FF, #DBEAFE);">
                  <div style="font-size: 42px; margin-bottom: 8px; line-height: 1;">${skill.icon}</div>
                  <div style="font-weight: 600; color: #1F2937; margin-bottom: 8px; font-size: 14px; line-height: 1.2;">${skill.category}</div>
                  <div style="font-size: 22px; font-weight: bold; color: #7C3AED; line-height: 1;">${skill.score.toFixed(1)}<span style="font-size: 14px; color: #9CA3AF;">/5.0</span></div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `

      document.body.appendChild(page1Element)

      const canvas1 = await html2canvas(page1Element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      const imgData1 = canvas1.toDataURL('image/png')
      const imgWidth = 210
      const imgHeight = 297

      pdf.addImage(imgData1, 'PNG', 0, 0, imgWidth, imgHeight)
      document.body.removeChild(page1Element)

      // PAGINA 2 - ⭐ OTTIMIZZATA CON BAR CHART PERFETTO
      pdf.addPage()

      const page2Element = document.createElement('div')
      page2Element.style.width = '210mm'
      page2Element.style.height = '297mm'
      page2Element.style.padding = '20mm'
      page2Element.style.backgroundColor = 'white'
      page2Element.style.fontFamily = 'Arial, sans-serif'
      page2Element.style.position = 'relative'
      page2Element.style.boxSizing = 'border-box'
      
      page2Element.innerHTML = `
        <!-- Watermark -->
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; font-weight: bold; color: rgba(147, 51, 234, 0.08); white-space: nowrap; z-index: 0; pointer-events: none;">
          ValutoLab
        </div>

        <!-- Content -->
        <div style="position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column;">
          <!-- Profilo Completo -->
          <div style="flex: 1; display: flex; flex-direction: column;">
            <h3 style="font-size: 18px; font-weight: bold; color: #1F2937; margin: 0 0 20px 0; display: flex; align-items: center;">
              <span style="font-size: 24px; margin-right: 8px;">📊</span>
              Profilo Completo delle Competenze
            </h3>
            
            <!-- Container Bar Chart -->
            <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
              
              <!-- ⭐ GRAFICO A BARRE OTTIMIZZATO: PIÙ ALTO (280px) + BARRE STRETTE (5%) + SPACE-AROUND + GAP -->
              <div style="display: flex; align-items: flex-end; justify-content: space-around; height: 280px; padding: 0 10px; margin-bottom: 15px; border-bottom: 2px solid #D1D5DB; position: relative; gap: 8px;">
                ${(() => {
                  // Calcola min e max score per scala percentile
                  const scores = allSkills.map(s => s.score);
                  const minScore = Math.min(...scores);
                  const maxScore = Math.max(...scores);
                  const range = maxScore - minScore;
                  
                  return allSkills.map(skill => {
                    // ⭐ FORMULA PERCENTILE: normalizza tra 20% e 100%
                    const heightPercent = range > 0 
                      ? ((skill.score - minScore) / range) * 80 + 20 
                      : 50;
                    
                    const categoryKey = skill.name;
                    const color = skillColors[categoryKey] || '#8B5CF6';
                    
                    return `
                      <div style="display: flex; flex-direction: column; align-items: center; width: 5%; position: relative;">
                        <!-- Valore Score sopra barra -->
                        <div style="margin-bottom: 4px; min-height: 20px;">
                          <span style="font-size: 10px; font-weight: bold; color: ${color};">
                            ${heightPercent >= 40 ? skill.score.toFixed(1) : ''}
                          </span>
                        </div>
                        
                        <!-- Barra Verticale -->
                        <div style="width: 100%; height: ${heightPercent}%; background: linear-gradient(to top, ${color}, ${color}dd); border-radius: 6px 6px 0 0; position: relative; box-shadow: 0 2px 4px rgba(0,0,0,0.1); min-height: 10px;">
                          <!-- Score dentro barra se troppo bassa -->
                          ${heightPercent < 40 ? `
                            <div style="position: absolute; top: 4px; left: 50%; transform: translateX(-50%); font-size: 8px; font-weight: bold; color: white;">
                              ${skill.score.toFixed(1)}
                            </div>
                          ` : ''}
                        </div>
                      </div>
                    `;
                  }).join('');
                })()}
              </div>
              
              <!-- Labels sotto il grafico -->
              <div style="display: flex; justify-content: space-around; align-items: flex-start; height: 60px; padding: 0 10px; gap: 8px;">
                ${allSkills.map(skill => {
                  const categoryKey = skill.name;
                  const color = skillColors[categoryKey] || '#8B5CF6';
                  const displayName = skill.category.length > 12 ? skill.category.substring(0, 10) + '.' : skill.category;
                  
                  return `
                    <div style="width: 5%; display: flex; flex-direction: column; align-items: center;">
                      <!-- Pallino colorato -->
                      <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${color}; margin-bottom: 4px;"></div>
                      <!-- Label ruotata -->
                      <span style="font-size: 8px; color: #6B7280; transform: rotate(-45deg); transform-origin: top center; white-space: nowrap; margin-top: 15px;">
                        ${displayName}
                      </span>
                    </div>
                  `;
                }).join('')}
              </div>
              
              <!-- ⭐ LEGENDA CON PUNTEGGI (es: "Comunicazione (3.9/5.0)") -->
              <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-top: 15px; padding: 0 10px;">
                ${Object.keys(categoryLabels).map(key => {
                  const color = skillColors[key] || '#8B5CF6';
                  const skillData = allSkills.find(s => s.name === key);
                  const scoreText = skillData ? ` (${skillData.score.toFixed(1)}/5.0)` : '';
                  return `
                    <div style="display: flex; align-items: center; gap: 4px;">
                      <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${color}; flex-shrink: 0;"></div>
                      <span style="font-size: 9px; color: #6B7280; line-height: 1.2;">${categoryLabels[key]}${scoreText}</span>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="margin-top: auto; padding-top: 20px; border-top: 2px solid #D1D5DB;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <p style="font-weight: 600; font-size: 13px; color: #6B7280; margin: 0 0 3px 0;">Certificato Verificabile</p>
                <p style="font-size: 16px; font-weight: bold; color: #9333EA; margin: 0 0 8px 0;">valutolab.com</p>
                <p style="font-size: 10px; color: #9CA3AF; margin: 0;">ID: ${assessmentId.substring(0, 8)}</p>
              </div>
              ${qrCodeUrl ? `
                <div style="text-align: center;">
                  <img src="${qrCodeUrl}" alt="QR Code" style="width: 90px; height: 90px; border: 2px solid #D1D5DB; border-radius: 8px;" />
                  <p style="font-size: 10px; color: #6B7280; margin: 5px 0 0 0;">Scansiona per verificare</p>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `

      document.body.appendChild(page2Element)

      const canvas2 = await html2canvas(page2Element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      const imgData2 = canvas2.toDataURL('image/png')
      pdf.addImage(imgData2, 'PNG', 0, 0, imgWidth, imgHeight)
      document.body.removeChild(page2Element)

      // Salva PDF
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
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        }
      )

      const data = await response.json()

      if (data.success) {
        setShareData({
          ...shareData,
          [assessmentId]: data.share
        })
        showMessage('success', data.message)
      }
    } catch (error) {
      showMessage('error', 'Errore durante l\'aggiornamento')
    }
  }

  const handleCopyLink = (assessmentId: string) => {
    if (!shareData[assessmentId]) return
    
    const link = `https://valutolab.com/profile/${shareData[assessmentId].share_token}`
    navigator.clipboard.writeText(link)
    showMessage('success', 'Link copiato!')
  }

  const handleOpenBadge = async (assessmentId: string) => {
    try {
      const { data: assessment } = await supabase
        .from('assessments')
        .select('total_score')
        .eq('id', assessmentId)
        .single()

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      const { data: results } = await supabase
        .from('combined_assessment_results')
        .select('skill_category, final_score')
        .eq('assessment_id', assessmentId)
        .order('final_score', { ascending: false })
        .limit(3)

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

      const topSkills = (results || []).map(r => ({
        name: categoryLabels[r.skill_category] || r.skill_category,
        score: Math.round(parseFloat(r.final_score) * 20)
      }))

      setBadgeModal({
        open: true,
        assessmentId,
        userName: profile?.full_name || 'Utente ValutoLab',
        score: assessment?.total_score || 0,
        topSkills,
        shareToken: shareData[assessmentId]?.share_token || ''
      })
    } catch (error) {
      console.error('Error loading badge data:', error)
      showMessage('error', 'Errore nel caricamento dei dati')
    }
  }

  const handleOpenQR = async (assessmentId: string) => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      const shareToken = shareData[assessmentId]?.share_token
      if (!shareToken) {
        showMessage('error', 'Errore: token di condivisione non trovato')
        return
      }

      setQrModal({
        open: true,
        profileUrl: `https://valutolab.com/profile/${shareToken}`,
        userName: profile?.full_name || 'Utente ValutoLab'
      })
    } catch (error) {
      console.error('Error opening QR modal:', error)
      showMessage('error', 'Errore nel caricamento del QR code')
    }
  }

  const handleStartNewAssessment = async () => {
    router.push('/servizi')
  }

  const handleDeleteLeadership = async (assessmentId: string) => {
    setDeleting(assessmentId)
    try {
      await supabase
        .from('leadership_responses')
        .delete()
        .eq('assessment_id', assessmentId)

      await supabase
        .from('leadership_results')
        .delete()
        .eq('assessment_id', assessmentId)

      await supabase
        .from('leadership_ai_reports')
        .delete()
        .eq('assessment_id', assessmentId)

      await supabase
        .from('leadership_assessments')
        .delete()
        .eq('id', assessmentId)

      setLeadershipAssessments(leadershipAssessments.filter(a => a.id !== assessmentId))
      showMessage('success', 'Leadership assessment eliminato')
    } catch (error) {
      console.error('Error deleting leadership assessment:', error)
      showMessage('error', 'Errore nell\'eliminazione')
    } finally {
      setDeleting(null)
    }
  }

  const handleDeleteAssessment = async (assessmentId: string) => {
    setDeleting(assessmentId)
    try {
      await supabase
        .from('assessment_responses')
        .delete()
        .eq('assessment_id', assessmentId)

      await supabase
        .from('situational_responses')
        .delete()
        .eq('assessment_id', assessmentId)

      await supabase
        .from('assessment_results')
        .delete()
        .eq('assessment_id', assessmentId)

      await supabase
        .from('qualitative_reports')
        .delete()
        .eq('assessment_id', assessmentId)

      await supabase
        .from('shared_profiles')
        .delete()
        .eq('assessment_id', assessmentId)

      await supabase
        .from('assessments')
        .delete()
        .eq('id', assessmentId)

      setAssessments(assessments.filter(a => a.id !== assessmentId))
      showMessage('success', 'Assessment eliminato')
    } catch (error) {
      console.error('Error deleting assessment:', error)
      showMessage('error', 'Errore nell\'eliminazione')
    } finally {
      setDeleting(null)
    }
  }

  const handlePrintPDF = (assessmentId: string) => {
    router.push(`/dashboard/results/${assessmentId}`)
    setTimeout(() => {
      window.print()
    }, 1000)
  }

  const handleShareEmail = (assessmentId: string) => {
    const subject = encodeURIComponent('I miei risultati ValutoLab')
    const body = encodeURIComponent(
      `Ecco i risultati del mio assessment delle soft skills:\n\n${window.location.origin}/dashboard/results/${assessmentId}`
    )
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white font-semibold`}>
          {message.text}
        </div>
      )}

      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">ValutoLab</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-900"
              >
                Esci
              </button>
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
              <p className="text-gray-600">Scegli tra Assessment Base o Leadership Deep Dive</p>
            </div>
            <button
              onClick={handleStartNewAssessment}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition shadow-lg"
            >
              + Vai ai Servizi
            </button>
          </div>
        </div>

        {inProgressAssessments.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">📋 Assessment Base in Corso</h3>
            <div className="space-y-4">
              {inProgressAssessments.map((assessment) => {
                const answeredCount = responsesCount[assessment.id] || 0
                const totalQuestions = 48
                const progress = Math.round((answeredCount / totalQuestions) * 100)

                return (
                  <div key={assessment.id} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Assessment Soft Skills</h4>
                        <p className="text-sm text-gray-600">
                          Iniziato il {new Date(assessment.created_at).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                        In corso
                      </span>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progresso: {answeredCount}/{totalQuestions} domande</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => router.push(`/assessment/${assessment.id}`)}
                        className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
                      >
                        Riprendi Assessment
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Sei sicuro di voler eliminare questo assessment?')) {
                            handleDeleteAssessment(assessment.id)
                          }
                        }}
                        disabled={deleting === assessment.id}
                        className="px-4 py-2 border-2 border-red-300 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition disabled:opacity-50"
                      >
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
            <h3 className="text-2xl font-bold text-gray-900 mb-4">🏆 Leadership Deep Dive in Corso</h3>
            <div className="space-y-4">
              {inProgressLeadership.map((assessment) => {
                const answeredCount = leadershipResponsesCount[assessment.id] || 0
                const totalQuestions = 30
                const progress = Math.round((answeredCount / totalQuestions) * 100)

                return (
                  <div key={assessment.id} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Leadership Deep Dive</h4>
                        <p className="text-sm text-gray-600">
                          Iniziato il {new Date(assessment.created_at).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                        In corso
                      </span>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progresso: {answeredCount}/{totalQuestions} domande</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-yellow-500 to-orange-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => router.push(`/leadership/${assessment.id}`)}
                        className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-700 transition"
                      >
                        Riprendi Leadership Assessment
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Sei sicuro di voler eliminare questo assessment?')) {
                            handleDeleteLeadership(assessment.id)
                          }
                        }}
                        disabled={deleting === assessment.id}
                        className="px-4 py-2 border-2 border-red-300 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition disabled:opacity-50"
                      >
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
            <h3 className="text-2xl font-bold text-gray-900 mb-4">✅ Assessment Completati</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedAssessments.map((assessment) => {
                const share = shareData[assessment.id]
                
                return (
                  <div key={assessment.id} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">📋 Assessment Soft Skills</h4>
                        <p className="text-sm text-gray-600">
                          Completato il {new Date(assessment.completed_at || '').toLocaleDateString('it-IT')}
                        </p>
                      </div>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                        Completato
                      </span>
                    </div>

                    <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-600 mb-1">Punteggio Generale</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {assessment.total_score?.toFixed(1)}<span className="text-lg text-gray-600">/5.0</span>
                      </p>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={() => router.push(`/dashboard/results/${assessment.id}`)}
                        className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
                      >
                        Visualizza Risultati
                      </button>

                      {share && (
                        <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-700">🔗 Condivisione</span>
                              {share.is_active && (
                                <span className="text-xs text-gray-600">👁️ {share.view_count} views</span>
                              )}
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={share.is_active}
                                onChange={() => handleToggleShare(assessment.id)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                          </div>

                          {share.is_active && (
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={`valutolab.com/profile/${share.share_token}`}
                                  readOnly
                                  className="flex-1 px-3 py-1 text-xs border border-gray-300 rounded bg-white text-gray-600 font-mono"
                                />
                                <button
                                  onClick={() => handleCopyLink(assessment.id)}
                                  className="px-3 py-1 bg-purple-600 text-white rounded text-xs font-semibold hover:bg-purple-700"
                                >
                                  Copia
                                </button>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2">
                                <button
                                  onClick={() => handleOpenBadge(assessment.id)}
                                  className="px-2 py-1 border border-purple-300 text-purple-700 rounded text-xs font-semibold hover:bg-purple-50"
                                >
                                  📱 Badge
                                </button>
                                <button
                                  onClick={() => handleOpenQR(assessment.id)}
                                  className="px-2 py-1 border border-purple-300 text-purple-700 rounded text-xs font-semibold hover:bg-purple-50"
                                >
                                  📄 QR
                                </button>
                                <button
                                  onClick={() => handleGeneratePDF(assessment.id)}
                                  disabled={generatingPDF === assessment.id}
                                  className="px-2 py-1 border border-purple-300 text-purple-700 rounded text-xs font-semibold hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {generatingPDF === assessment.id ? '⏳' : '📋'} PDF
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => handlePrintPDF(assessment.id)}
                          className="px-3 py-2 border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          PDF
                        </button>
                        
                        <button
                          onClick={() => handleShareEmail(assessment.id)}
                          className="px-3 py-2 border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Email
                        </button>
                        
                        <button
                          onClick={() => {
                            if (window.confirm('Sei sicuro di voler eliminare questo assessment? Questa azione è irreversibile.')) {
                              handleDeleteAssessment(assessment.id)
                            }
                          }}
                          disabled={deleting === assessment.id}
                          className="px-3 py-2 border-2 border-red-300 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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
                      <h4 className="text-lg font-semibold text-gray-900">🏆 Leadership Deep Dive</h4>
                      <p className="text-sm text-gray-600">
                        Completato il {new Date(assessment.completed_at || '').toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                      Completato
                    </span>
                  </div>

                  <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-600 mb-1">Punteggio Leadership</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {assessment.total_score?.toFixed(1)}<span className="text-lg text-gray-600">/5.0</span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => router.push(`/leadership/${assessment.id}/results`)}
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-700 transition"
                    >
                      Visualizza Risultati Leadership
                    </button>
                    
                    <button
                      onClick={() => {
                        if (window.confirm('Sei sicuro di voler eliminare questo assessment?')) {
                          handleDeleteLeadership(assessment.id)
                        }
                      }}
                      disabled={deleting === assessment.id}
                      className="w-full px-4 py-2 border-2 border-red-300 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition disabled:opacity-50"
                    >
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
              <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nessun assessment ancora</h3>
            <p className="text-gray-600 mb-4">Inizia il tuo primo assessment per scoprire le tue competenze</p>
            <button
              onClick={handleStartNewAssessment}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition shadow-lg"
            >
              Vai ai Servizi
            </button>
          </div>
        )}

        {badgeModal?.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Badge LinkedIn</h3>
                <button
                  onClick={() => setBadgeModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <BadgeGenerator
                userName={badgeModal.userName}
                score={badgeModal.score}
                topSkills={badgeModal.topSkills}
                shareToken={badgeModal.shareToken}
              />
            </div>
          </div>
        )}

        {qrModal?.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
              <QRCodeGenerator
                profileUrl={qrModal.profileUrl}
                userName={qrModal.userName}
                onClose={() => setQrModal(null)}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
