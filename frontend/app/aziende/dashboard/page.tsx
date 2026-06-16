'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { Wordmark } from '@/components/ui/Wordmark'
import { Button } from '@/components/ui/Button'
import {
  ArrowLeft, Mail, BarChart3, Users, Clock, CheckCircle,
  Plus, Download, GitCompareArrows, Target, X, Trash2, FileText, RefreshCw,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, Cell,
  ReferenceLine, ResponsiveContainer,
} from 'recharts'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.valutolab.com'

function escoInfo(score: number): { label: string; color: string } {
  const v = Number(score)
  if (v >= 4.1) return { label: 'Esperto',    color: '#1B4332' }
  if (v >= 3.1) return { label: 'Avanzato',   color: '#2D6A4F' }
  if (v >= 2.1) return { label: 'Intermedio', color: '#D4A017' }
  return               { label: 'Base',       color: '#C0392B' }
}

const SKILLS = [
  'communication','leadership','problem_solving','teamwork',
  'time_management','adaptability','creativity','critical_thinking',
  'empathy','resilience','negotiation','decision_making',
]
const SKILL_LABELS: Record<string, string> = {
  communication:    'Comunicazione',
  leadership:       'Leadership',
  problem_solving:  'Problem Solving',
  teamwork:         'Lavoro di Squadra',
  time_management:  'Gestione del Tempo',
  adaptability:     'Adattabilità',
  creativity:       'Creatività',
  critical_thinking:'Pensiero Critico',
  empathy:          'Empatia',
  resilience:       'Resilienza',
  negotiation:      'Negoziazione',
  decision_making:  'Decision Making',
}

const escoColor = (v: number): { bg: string; fg: string } => {
  if (v >= 4.1) return { bg: '#1B4332', fg: '#ffffff' }
  if (v >= 3.1) return { bg: '#2D6A4F', fg: '#ffffff' }
  if (v >= 2.1) return { bg: '#D4A017', fg: '#ffffff' }
  return { bg: '#C0392B', fg: '#ffffff' }
}

type Tab = 'overview' | 'candidates' | 'compare' | 'new-invite' | 'focus' | 'team-report'

interface FocusConfig {
  id: string
  name: string
  description: string | null
  skills: string[]
  completed_count: number
  total_invites: number
  created_at: string
}

interface Candidate {
  invite_id: string
  candidate_name: string
  candidate_email: string
  completed_at: string
  invite_date: string
  assessment_id: string
  total_score: number
  question_set: string
  scores: Record<string, number>
}

function AziendeDashboardContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { user: authUser, loading: authLoading } = useAuth()

  const [loading, setLoading]             = useState(true)
  const [organizations, setOrganizations] = useState<any[]>([])
  const [organization, setOrganization]   = useState<any>(null)
  const [activeTab, setActiveTab]         = useState<Tab>('overview')
  const [invites, setInvites]             = useState<any[]>([])
  const [candidates, setCandidates]       = useState<Candidate[]>([])
  const [selected, setSelected]           = useState<Set<string>>(new Set())
  const [message, setMessage]             = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [inviteForm, setInviteForm]       = useState({ candidateEmail: '', candidateName: '', notes: '' })
  const [sendingInvite, setSendingInvite] = useState(false)
  const [focusConfigs, setFocusConfigs]   = useState<FocusConfig[]>([])
  const [showFocusModal, setShowFocusModal] = useState(false)
  const [focusForm, setFocusForm]         = useState({ name: '', description: '', skills: [] as string[] })
  const [creatingFocus, setCreatingFocus] = useState(false)
  const [focusInviteModal, setFocusInviteModal] = useState<{ open: boolean; configId: string; configName: string } | null>(null)
  const [focusInviteForm, setFocusInviteForm] = useState({ candidateEmail: '', candidateName: '' })
  const [sendingFocusInvite, setSendingFocusInvite] = useState(false)
  const [teamReport, setTeamReport]               = useState<any>(null)
  const [loadingTeamReport, setLoadingTeamReport] = useState(false)
  const [generatingReport, setGeneratingReport]   = useState(false)

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(t)
    }
  }, [message])

  useEffect(() => {
    if (authLoading) return
    if (!authUser) { router.push('/login'); return }
    init()
  }, [authUser, authLoading])

  const init = async () => {
    try {
      const res  = await fetch(`${API_URL}/api/organizations/user/${authUser!.id}`)
      const data = await res.json()
      if (!data.success || data.organizations.length === 0) { router.push('/'); return }
      setOrganizations(data.organizations)
      // Pre-seleziona org da ?org= se presente e l'utente ne è membro, altrimenti la prima
      const paramId = searchParams.get('org')
      const org = (paramId && data.organizations.find((o: any) => o.id === paramId))
        || data.organizations[0]
      setOrganization(org)
      await Promise.all([loadInvites(org.id), loadCandidates(org.id), loadFocusConfigs(org.id), loadTeamReport(org.id)])
    } catch {
      setMessage({ type: 'error', text: 'Errore nel caricamento dei dati' })
    } finally {
      setLoading(false)
    }
  }

  const handleOrgChange = async (orgId: string) => {
    const org = organizations.find(o => o.id === orgId)
    if (!org || org.id === organization?.id) return
    setOrganization(org)
    setSelected(new Set())
    setActiveTab('overview')
    setLoading(true)
    await Promise.all([loadInvites(org.id), loadCandidates(org.id), loadFocusConfigs(org.id), loadTeamReport(org.id)])
    setLoading(false)
    // Aggiorna URL senza reload
    router.replace(`/aziende/dashboard?org=${org.id}`)
  }

  const loadInvites = async (orgId: string) => {
    const res  = await fetch(`${API_URL}/api/organizations/${orgId}/invites`)
    const data = await res.json()
    if (data.success) setInvites(data.invites)
  }

  const loadCandidates = async (orgId: string) => {
    const res  = await fetch(`${API_URL}/api/organizations/${orgId}/candidates-with-scores`)
    const data = await res.json()
    if (data.success) setCandidates(data.candidates)
  }

  const loadTeamReport = async (orgId: string) => {
    setLoadingTeamReport(true)
    try {
      const token = localStorage.getItem('jwt_access_token')
      const res = await fetch(`${API_URL}/api/team-reports/${orgId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) setTeamReport(data.report)
    } catch {
      // non bloccare il caricamento
    } finally {
      setLoadingTeamReport(false)
    }
  }

  const loadFocusConfigs = async (orgId: string) => {
    const token = localStorage.getItem('jwt_access_token')
    const res = await fetch(`${API_URL}/api/focus/configs?org=${orgId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    if (data.success) setFocusConfigs(data.configs)
  }

  const handleCreateFocus = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingFocus(true)
    try {
      const token = localStorage.getItem('jwt_access_token')
      const res = await fetch(`${API_URL}/api/focus/configs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...focusForm, organization_id: organization.id }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Focus creato!' })
        setShowFocusModal(false)
        setFocusForm({ name: '', description: '', skills: [] })
        loadFocusConfigs(organization.id)
      } else throw new Error(data.message)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Errore nella creazione' })
    } finally {
      setCreatingFocus(false)
    }
  }

  const handleDeleteFocus = async (configId: string) => {
    if (!window.confirm('Eliminare questo Focus config?')) return
    const token = localStorage.getItem('jwt_access_token')
    const res = await fetch(`${API_URL}/api/focus/configs/${configId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    if (data.success) {
      setMessage({ type: 'success', text: 'Focus eliminato' })
      loadFocusConfigs(organization.id)
    } else {
      setMessage({ type: 'error', text: data.message })
    }
  }

  const handleSendFocusInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!focusInviteModal) return
    setSendingFocusInvite(true)
    try {
      const res = await fetch(`${API_URL}/api/organizations/${organization.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authUser!.id,
          candidateEmail: focusInviteForm.candidateEmail,
          candidateName: focusInviteForm.candidateName,
          focus_config_id: focusInviteModal.configId,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Invito Focus inviato!' })
        setFocusInviteModal(null)
        setFocusInviteForm({ candidateEmail: '', candidateName: '' })
        await Promise.all([loadInvites(organization.id), loadFocusConfigs(organization.id)])
      } else throw new Error(data.message)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "Errore nell'invio" })
    } finally {
      setSendingFocusInvite(false)
    }
  }

  const toggleFocusSkill = (skill: string) => {
    setFocusForm(prev => {
      if (prev.skills.includes(skill)) return { ...prev, skills: prev.skills.filter(s => s !== skill) }
      if (prev.skills.length >= 3) return prev
      return { ...prev, skills: [...prev.skills, skill] }
    })
  }

  const handleGenerateReport = async () => {
    setGeneratingReport(true)
    try {
      const token = localStorage.getItem('jwt_access_token')
      const res = await fetch(`${API_URL}/api/team-reports/${organization.id}/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setTeamReport(data.report)
        setMessage({ type: 'success', text: 'Report generato con successo!' })
      } else {
        setMessage({ type: 'error', text: data.message || 'Errore nella generazione' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Errore nella generazione del report' })
    } finally {
      setGeneratingReport(false)
    }
  }

  const exportFocusCSV = (config: FocusConfig) => {
    const focusCandidates = candidates.filter((c: any) => c.focus_config_id === config.id)
    const headers = ['Nome', 'Email', 'Data Completamento', ...config.skills.map(s => SKILL_LABELS[s])]
    const rows = focusCandidates.map((c: any) => [
      c.candidate_name,
      c.candidate_email,
      c.completed_at ? new Date(c.completed_at).toLocaleDateString('it-IT') : '',
      ...config.skills.map(s => Number(c.scores?.[s] ?? 0).toFixed(2)),
    ])
    const csv = [headers, ...rows].map(r => r.map((v: any) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `focus_${config.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setSendingInvite(true); setMessage(null)
    try {
      const res  = await fetch(`${API_URL}/api/organizations/${organization.id}/invite`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authUser!.id,
          candidateEmail: inviteForm.candidateEmail,
          candidateName:  inviteForm.candidateName,
          notes:          inviteForm.notes,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Invito inviato con successo!' })
        setInviteForm({ candidateEmail: '', candidateName: '', notes: '' })
        loadInvites(organization.id)
        setTimeout(() => setActiveTab('candidates'), 1500)
      } else throw new Error(data.message)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "Errore nell'invio dell'invito" })
    } finally {
      setSendingInvite(false)
    }
  }

  // ── Selezione candidati ───────────────────────────────────────────────────

  const allSelected = candidates.length > 0 && selected.size === candidates.length
  const toggleAll   = () => setSelected(allSelected ? new Set() : new Set(candidates.map(c => c.invite_id)))
  const toggleOne   = (id: string) => setSelected(prev => {
    const s = new Set(prev)
    s.has(id) ? s.delete(id) : s.add(id)
    return s
  })

  const selectedCandidates = useMemo(
    () => candidates.filter(c => selected.has(c.invite_id)),
    [candidates, selected]
  )

  const goCompare = () => {
    if (selected.size < 2) return
    setActiveTab('compare')
  }

  // ── CSV export ────────────────────────────────────────────────────────────

  const exportCSV = () => {
    const headers = [
      'Nome','Email','Data Completamento','Set','Punteggio Generale',
      ...SKILLS.map(s => SKILL_LABELS[s]),
    ]
    const rows = candidates.map(c => [
      c.candidate_name,
      c.candidate_email,
      c.completed_at ? new Date(c.completed_at).toLocaleDateString('it-IT') : '',
      c.question_set || '',
      Number(c.total_score).toFixed(2),
      ...SKILLS.map(s => Number(c.scores?.[s] ?? 0).toFixed(2)),
    ])
    const csv  = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `candidati_${(organization?.name || 'export').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Guards ────────────────────────────────────────────────────────────────

  if (loading && !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper-100">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-ink-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 font-body text-[14px] text-ink-500">Caricamento dashboard…</p>
        </div>
      </div>
    )
  }

  const stats = {
    quota_used:        organization?.used_assessments   || 0,
    quota_total:       organization?.assessment_quota   || 20,
    invites_pending:   invites.filter(i => i.status === 'pending').length,
    invites_completed: invites.filter(i => i.status === 'completed').length,
  }

  const tabs: { key: Tab; label: string; hidden?: boolean }[] = [
    { key: 'overview',    label: 'Overview' },
    { key: 'candidates',  label: `Candidati (${candidates.length})` },
    { key: 'compare',     label: `Confronto${selected.size >= 2 ? ` (${selected.size})` : ''}`, hidden: selected.size < 2 },
    { key: 'focus',        label: `Focus${focusConfigs.length > 0 ? ` (${focusConfigs.length})` : ''}` },
    { key: 'team-report', label: 'Report di Team' },
    { key: 'new-invite',  label: 'Nuovo Invito' },
  ]

  const inputCls = 'w-full px-4 py-2.5 border border-paper-300 rounded-sm bg-paper-100 focus:border-ink-600 focus:outline-none font-body text-[14px] text-ink-900 placeholder-ink-400'
  const labelCls = 'block text-[12px] font-medium text-ink-600 mb-1.5'

  return (
    <div className="min-h-screen bg-paper-100 font-body text-ink-900">

      {/* Toast */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-sm shadow-lg-ink text-[14px] font-medium text-paper-50 ${message.type === 'success' ? 'bg-ink-900' : 'bg-sienna-600'}`}>
          {message.text}
        </div>
      )}

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="bg-paper-50 border-b border-paper-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Wordmark size={20} />
              {organizations.length === 1 && organization?.name && (
                <>
                  <span className="text-paper-300">|</span>
                  <span className="text-[13px] font-medium text-ink-600">{organization.name}</span>
                </>
              )}
              {organizations.length > 1 && (
                <>
                  <span className="text-paper-300">|</span>
                  <select
                    value={organization?.id ?? ''}
                    onChange={e => handleOrgChange(e.target.value)}
                    className="text-[13px] font-medium text-ink-700 bg-transparent border border-paper-300 rounded-sm px-2 py-1 focus:outline-none focus:border-ink-600 cursor-pointer hover:border-ink-400 transition-colors"
                  >
                    {organizations.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/')} className="flex items-center gap-1 text-[13px] text-ink-500 hover:text-ink-900 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Home
              </button>
              <Button variant="secondary" onClick={() => router.push('/dashboard')} className="text-[13px]">
                Dashboard personale
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-6">

        <div>
          <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-1">Area Azienda</p>
          <h1 className="font-display text-display-3 text-ink-900">Dashboard HR</h1>
        </div>

        {/* ── TABS ──────────────────────────────────────────────────────── */}
        <div className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink">
          <div className="flex border-b border-paper-200 overflow-x-auto">
            {tabs.filter(t => !t.hidden).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 px-6 py-3.5 text-[13px] font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.key
                    ? 'border-ink-900 text-ink-900'
                    : 'border-transparent text-ink-500 hover:text-ink-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW ──── */}
          {activeTab === 'overview' && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: BarChart3,    label: 'Quota usata',   value: `${stats.quota_used}/${stats.quota_total}`, sub: `${stats.quota_total - stats.quota_used} disponibili` },
                  { icon: Mail,         label: 'Inviti totali', value: invites.length,             sub: 'Inviati finora' },
                  { icon: Clock,        label: 'In attesa',     value: stats.invites_pending,      sub: 'Da completare' },
                  { icon: CheckCircle,  label: 'Completati',    value: stats.invites_completed,    sub: 'Assessment finiti' },
                ].map(({ icon: Icon, label, value, sub }) => (
                  <div key={label} className="bg-paper-100 border border-paper-200 rounded-md p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400">{label}</p>
                      <Icon className="w-4 h-4 text-ink-400" />
                    </div>
                    <p className="font-display text-[28px] leading-none text-ink-900">{value}</p>
                    <p className="text-[11px] text-ink-400 mt-1">{sub}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-3">Informazioni Organizzazione</p>
                <div className="grid md:grid-cols-3 gap-3">
                  {[
                    ['Ragione Sociale', organization?.name],
                    ['Partita IVA', organization?.partita_iva || 'N/A'],
                    ['Referente', organization?.referent_name || 'N/A'],
                    ['Ruolo Referente', organization?.referent_role || 'N/A'],
                    ['Email Contatto', organization?.contact_email],
                    ['Piano Attivo', organization?.subscription_tier],
                  ].map(([label, val]) => (
                    <div key={label as string} className="bg-paper-100 border border-paper-200 rounded-md px-4 py-3">
                      <p className="text-[11px] text-ink-400 mb-0.5">{label}</p>
                      <p className="text-[14px] font-medium text-ink-900 capitalize">{val || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-3">Azioni Rapide</p>
                <div className="grid md:grid-cols-3 gap-3">
                  <button onClick={() => setActiveTab('new-invite')}
                    className="bg-paper-100 border border-paper-200 rounded-md p-5 text-left hover:bg-paper-200 transition-colors">
                    <Mail className="w-5 h-5 text-ink-600 mb-3" />
                    <p className="text-[14px] font-medium text-ink-900 mb-0.5">Invia Nuovo Invito</p>
                    <p className="text-[12px] text-ink-500">Aggiungi un candidato</p>
                  </button>
                  <button onClick={() => setActiveTab('candidates')}
                    className="bg-paper-100 border border-paper-200 rounded-md p-5 text-left hover:bg-paper-200 transition-colors">
                    <Users className="w-5 h-5 text-ink-600 mb-3" />
                    <p className="text-[14px] font-medium text-ink-900 mb-0.5">Visualizza Candidati</p>
                    <p className="text-[12px] text-ink-500">Confronta e scarica report</p>
                  </button>
                  <button onClick={candidates.length > 0 ? exportCSV : undefined}
                    className={`bg-paper-100 border border-paper-200 rounded-md p-5 text-left transition-colors ${candidates.length > 0 ? 'hover:bg-paper-200' : 'opacity-40 cursor-not-allowed'}`}>
                    <Download className="w-5 h-5 text-ink-600 mb-3" />
                    <p className="text-[14px] font-medium text-ink-900 mb-0.5">Esporta Report</p>
                    <p className="text-[12px] text-ink-500">{candidates.length > 0 ? 'Scarica CSV completo' : 'Nessun dato disponibile'}</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── CANDIDATI ──── */}
          {activeTab === 'candidates' && (
            <div className="p-6">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <h2 className="font-display text-[18px] font-medium text-ink-900">
                  Candidati Completati
                </h2>
                <div className="flex items-center gap-2">
                  {candidates.length > 0 && (
                    <Button
                      variant="secondary"
                      className="flex items-center gap-2 text-[13px]"
                      onClick={exportCSV}
                    >
                      <Download className="w-4 h-4" /> Esporta tutto
                    </Button>
                  )}
                  <Button
                    variant={selected.size >= 2 ? 'primary' : 'secondary'}
                    disabled={selected.size < 2}
                    className="flex items-center gap-2 text-[13px]"
                    onClick={goCompare}
                  >
                    <GitCompareArrows className="w-4 h-4" />
                    {selected.size >= 2 ? `Confronta (${selected.size})` : 'Confronta selezionati'}
                  </Button>
                  <Button variant="primary" className="flex items-center gap-2 text-[13px]" onClick={() => setActiveTab('new-invite')}>
                    <Plus className="w-4 h-4" /> Nuovo Invito
                  </Button>
                </div>
              </div>

              {candidates.length === 0 ? (
                <div className="text-center py-14 border border-dashed border-paper-300 rounded-md">
                  <Users className="w-8 h-8 text-ink-300 mx-auto mb-3" />
                  <p className="text-[15px] font-medium text-ink-700 mb-1">Nessun assessment completato</p>
                  <p className="text-[13px] text-ink-400 mb-5">I candidati appariranno qui dopo aver completato l&apos;assessment</p>
                  <Button variant="primary" onClick={() => setActiveTab('new-invite')}>Invia Primo Invito</Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b border-paper-200">
                        <th className="py-3 px-3 w-10">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={toggleAll}
                            className="w-4 h-4 accent-ink-900 cursor-pointer"
                          />
                        </th>
                        <th className="text-left py-3 px-3 text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400">Candidato</th>
                        <th className="text-left py-3 px-3 text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400">Email</th>
                        <th className="text-left py-3 px-3 text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400">Set</th>
                        <th className="text-left py-3 px-3 text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400">Punteggio</th>
                        <th className="text-left py-3 px-3 text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400">Completato</th>
                        <th className="text-left py-3 px-3 text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400">Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {candidates.map(c => (
                        <tr
                          key={c.invite_id}
                          className={`border-b border-paper-100 transition-colors ${selected.has(c.invite_id) ? 'bg-paper-200' : 'hover:bg-paper-100'}`}
                        >
                          <td className="py-3 px-3">
                            <input
                              type="checkbox"
                              checked={selected.has(c.invite_id)}
                              onChange={() => toggleOne(c.invite_id)}
                              className="w-4 h-4 accent-ink-900 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-3 font-medium text-ink-900">{c.candidate_name || '—'}</td>
                          <td className="py-3 px-3 text-ink-600">{c.candidate_email}</td>
                          <td className="py-3 px-3">
                            <span className="font-mono text-[11px] text-ink-500 bg-paper-200 px-2 py-0.5 rounded-sm">
                              Set {c.question_set || '—'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-ink-900">{Number(c.total_score).toFixed(2)}</span>
                            <span className="text-ink-400">/5,0</span>
                          </td>
                          <td className="py-3 px-3 text-ink-500">
                            {c.completed_at ? new Date(c.completed_at).toLocaleDateString('it-IT') : '—'}
                          </td>
                          <td className="py-3 px-3">
                            <button
                              className="text-[12px] font-medium text-ink-900 hover:text-sienna-600 transition-colors"
                              onClick={() => router.push(`/dashboard/results/${c.assessment_id}`)}
                            >
                              Visualizza Report
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Inviti in attesa */}
              {invites.filter(i => i.status === 'pending').length > 0 && (
                <div className="mt-8">
                  <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400 mb-3">
                    Inviti in Attesa ({invites.filter(i => i.status === 'pending').length})
                  </p>
                  <div className="space-y-2">
                    {invites.filter(i => i.status === 'pending').map(inv => (
                      <div key={inv.id} className="flex items-center justify-between bg-paper-100 border border-paper-200 rounded-md px-4 py-3">
                        <div>
                          <span className="font-medium text-ink-800 text-[13px]">{inv.candidate_name || inv.candidate_email}</span>
                          <span className="text-ink-500 text-[12px] ml-2">{inv.candidate_email}</span>
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-eyebrow px-2 py-0.5 rounded-sm border text-level-intermedio bg-amber-50 border-amber-200">
                          In Attesa
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── CONFRONTO ──── */}
          {activeTab === 'compare' && selected.size >= 2 && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display text-[18px] font-medium text-ink-900">
                    Comparazione Candidati
                  </h2>
                  <p className="text-[12px] text-ink-500 mt-0.5">
                    {selectedCandidates.length} candidati selezionati · Colore per livello ESCO · Bordo arancione = punteggio più alto
                  </p>
                </div>
                <Button variant="secondary" className="text-[13px]" onClick={() => setActiveTab('candidates')}>
                  ← Modifica selezione
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-[13px] border-collapse">
                  <thead>
                    <tr className="border-b-2 border-paper-200">
                      <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400 bg-paper-100 sticky left-0 min-w-[180px]">
                        Competenza
                      </th>
                      {selectedCandidates.map(c => (
                        <th key={c.invite_id} className="py-3 px-4 text-center min-w-[130px]">
                          <p className="font-semibold text-ink-900 text-[13px] leading-tight">{c.candidate_name}</p>
                          <p className="font-mono text-[10px] text-ink-400 mt-0.5">Set {c.question_set}</p>
                        </th>
                      ))}
                      <th className="py-3 px-4 text-center min-w-[100px] bg-paper-100">
                        <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400">Media</p>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {SKILLS.map((skill, idx) => {
                      const values = selectedCandidates.map(c => Number(c.scores?.[skill] ?? 0))
                      const max    = Math.max(...values)
                      const avg    = values.reduce((a, b) => a + b, 0) / values.length
                      return (
                        <tr key={skill} className={`border-b border-paper-100 ${idx % 2 === 0 ? '' : 'bg-paper-50'}`}>
                          <td className="py-3 px-4 font-medium text-ink-800 bg-paper-100 sticky left-0">
                            {SKILL_LABELS[skill]}
                          </td>
                          {values.map((v, i) => {
                            const { bg, fg } = escoColor(v)
                            const isTop = v === max && max > 0
                            return (
                              <td key={i} className="py-2 px-3 text-center">
                                <span
                                  className="inline-flex items-center justify-center font-mono text-[13px] font-semibold rounded-sm px-3 py-1.5 min-w-[56px]"
                                  style={{
                                    backgroundColor: bg,
                                    color: fg,
                                    border: isTop ? '2px solid #B0473A' : '2px solid transparent',
                                  }}
                                >
                                  {v.toFixed(2)}
                                </span>
                              </td>
                            )
                          })}
                          <td className="py-2 px-3 text-center bg-paper-100">
                            {(() => {
                              const { bg, fg } = escoColor(avg)
                              return (
                                <span
                                  className="inline-flex items-center justify-center font-mono text-[13px] font-semibold rounded-sm px-3 py-1.5 min-w-[56px]"
                                  style={{ backgroundColor: bg, color: fg, border: '2px solid transparent' }}
                                >
                                  {avg.toFixed(2)}
                                </span>
                              )
                            })()}
                          </td>
                        </tr>
                      )
                    })}

                    {/* Riga punteggio generale */}
                    <tr className="border-t-2 border-paper-200 bg-paper-100">
                      <td className="py-4 px-4 font-semibold text-ink-900 sticky left-0 bg-paper-100">
                        Punteggio Generale
                      </td>
                      {selectedCandidates.map(c => {
                        const allScores = selectedCandidates.map(x => Number(x.total_score))
                        const isTop = Number(c.total_score) === Math.max(...allScores)
                        return (
                          <td key={c.invite_id} className="py-4 px-4 text-center">
                            <span className={`font-mono text-[15px] font-bold ${isTop ? 'text-sienna-600' : 'text-ink-800'}`}>
                              {Number(c.total_score).toFixed(2)}
                            </span>
                            <span className="text-ink-400 text-[12px]">/5,0</span>
                          </td>
                        )
                      })}
                      <td className="py-4 px-4 text-center bg-paper-100">
                        <span className="font-mono text-[15px] text-ink-500">
                          {(selectedCandidates.reduce((s, c) => s + Number(c.total_score), 0) / selectedCandidates.length).toFixed(2)}
                        </span>
                        <span className="text-ink-400 text-[12px]">/5,0</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Legenda */}
              <div className="flex flex-wrap items-center gap-4 mt-4">
                {[
                  { label: 'Esperto',    range: '4.1–5.0', bg: '#1B4332' },
                  { label: 'Avanzato',   range: '3.1–4.0', bg: '#2D6A4F' },
                  { label: 'Intermedio', range: '2.1–3.0', bg: '#D4A017' },
                  { label: 'Base',       range: '1.0–2.0', bg: '#C0392B' },
                ].map(({ label, range, bg }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: bg }} />
                    <span className="text-[11px] text-ink-600 font-medium">{label}</span>
                    <span className="text-[11px] text-ink-400">{range}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5 ml-2 pl-4 border-l border-paper-300">
                  <span className="w-3 h-3 rounded-sm border-2 flex-shrink-0" style={{ borderColor: '#B0473A' }} />
                  <span className="text-[11px] text-ink-500">Punteggio più alto per competenza</span>
                </div>
              </div>
            </div>
          )}

          {/* ── FOCUS ──── */}
          {activeTab === 'focus' && (
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-[18px] font-medium text-ink-900">Focus Assessment</h2>
                  <p className="text-[12px] text-ink-500 mt-0.5">Valuta 1-3 competenze specifiche per ogni team o ruolo</p>
                </div>
                <Button variant="primary" className="flex items-center gap-2 text-[13px]" onClick={() => setShowFocusModal(true)}>
                  <Plus className="w-4 h-4" /> Nuovo Focus
                </Button>
              </div>

              {/* Lista configs */}
              {focusConfigs.length === 0 ? (
                <div className="text-center py-14 border border-dashed border-paper-300 rounded-md">
                  <Target className="w-8 h-8 text-ink-300 mx-auto mb-3" />
                  <p className="text-[15px] font-medium text-ink-700 mb-1">Nessun Focus configurato</p>
                  <p className="text-[13px] text-ink-400 mb-5">Crea un Focus per valutare competenze specifiche del tuo team</p>
                  <Button variant="primary" onClick={() => setShowFocusModal(true)}>Crea primo Focus</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {focusConfigs.map(cfg => (
                    <div key={cfg.id} className="bg-paper-100 border border-paper-200 rounded-md p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Target className="w-4 h-4 text-sienna-600 flex-shrink-0" />
                            <p className="font-medium text-[15px] text-ink-900">{cfg.name}</p>
                            <span className="font-mono text-[11px] text-ink-400 bg-paper-200 px-2 py-0.5 rounded-sm">
                              {cfg.completed_count}/{cfg.total_invites} completati
                            </span>
                          </div>
                          {cfg.description && (
                            <p className="text-[13px] text-ink-500 mb-3 ml-7">{cfg.description}</p>
                          )}
                          <div className="flex flex-wrap gap-1.5 ml-7">
                            {cfg.skills.map(s => (
                              <span key={s} className="text-[11px] font-medium text-sienna-700 bg-sienna-50 border border-sienna-200 px-2.5 py-0.5 rounded-sm">
                                {SKILL_LABELS[s]}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="primary"
                            className="text-[12px] flex items-center gap-1.5"
                            onClick={() => { setFocusInviteModal({ open: true, configId: cfg.id, configName: cfg.name }); setFocusInviteForm({ candidateEmail: '', candidateName: '' }) }}
                          >
                            <Mail className="w-3.5 h-3.5" /> Invita
                          </Button>
                          {Number(cfg.total_invites) === 0 && (
                            <button
                              onClick={() => handleDeleteFocus(cfg.id)}
                              className="p-2 text-ink-400 hover:text-sienna-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Risultati per questo config */}
                      {Number(cfg.completed_count) > 0 && (() => {
                        const focusCandidates = candidates.filter((c: any) => c.focus_config_id === cfg.id)
                        if (focusCandidates.length === 0) return null
                        return (
                          <div className="mt-5 pt-5 border-t border-paper-200">
                            <div className="flex items-center justify-between mb-4">
                              <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400">
                                Risultati — {focusCandidates.length} {focusCandidates.length === 1 ? 'candidato' : 'candidati'}
                              </p>
                              <button
                                onClick={() => exportFocusCSV(cfg)}
                                className="flex items-center gap-1.5 text-[12px] text-ink-600 hover:text-ink-900 transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" /> Esporta CSV
                              </button>
                            </div>

                            {/* Tabella punteggi */}
                            <div className="overflow-x-auto mb-4">
                              <table className="w-full text-[13px]">
                                <thead>
                                  <tr className="border-b border-paper-200">
                                    <th className="text-left py-2 px-3 text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400">Candidato</th>
                                    {cfg.skills.map(s => (
                                      <th key={s} className="text-center py-2 px-3 text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400">
                                        {SKILL_LABELS[s]}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {focusCandidates.map((c: any) => (
                                    <tr key={c.invite_id} className="border-b border-paper-100">
                                      <td className="py-2 px-3 font-medium text-ink-800">{c.candidate_name || c.candidate_email}</td>
                                      {cfg.skills.map(s => {
                                        const v = Number(c.scores?.[s] ?? 0)
                                        const { bg, fg } = escoColor(v)
                                        return (
                                          <td key={s} className="py-2 px-3 text-center">
                                            <span
                                              className="inline-flex items-center justify-center font-mono text-[12px] font-semibold rounded-sm px-2.5 py-1 min-w-[48px]"
                                              style={{ backgroundColor: bg, color: fg }}
                                            >
                                              {v.toFixed(2)}
                                            </span>
                                          </td>
                                        )
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Bar chart */}
                            <div className="space-y-4">
                              {cfg.skills.map(skill => (
                                <div key={skill}>
                                  <p className="text-[11px] font-medium text-ink-500 mb-2">{SKILL_LABELS[skill]}</p>
                                  <div className="space-y-1.5">
                                    {focusCandidates.map((c: any) => {
                                      const v = Number(c.scores?.[skill] ?? 0)
                                      const pct = (v / 5) * 100
                                      const { bg } = escoColor(v)
                                      return (
                                        <div key={c.invite_id} className="flex items-center gap-3">
                                          <span className="text-[12px] text-ink-600 w-32 truncate flex-shrink-0">{c.candidate_name || c.candidate_email}</span>
                                          <div className="flex-1 bg-paper-200 rounded-sm h-5 relative">
                                            <div
                                              className="h-5 rounded-sm transition-all"
                                              style={{ width: `${pct}%`, backgroundColor: bg }}
                                            />
                                          </div>
                                          <span className="font-mono text-[12px] text-ink-700 w-10 text-right flex-shrink-0">{v.toFixed(2)}</span>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── REPORT DI TEAM ──── */}
          {activeTab === 'team-report' && (() => {
            const completedBase = candidates.filter((c: any) => !c.focus_config_id)
            const report = teamReport
            const reportData = report?.report_data

            if (loadingTeamReport) {
              return (
                <div className="p-10 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="w-7 h-7 border-2 border-ink-900 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-[13px] text-ink-400">Caricamento report…</p>
                  </div>
                </div>
              )
            }

            // Helper barra ESCO riutilizzabile
            const EscoBar = ({ item }: { item: any }) => {
              const v = Number(item.avg_score)
              const pct = Math.round((v / 5) * 100)
              const { label, color } = escoInfo(v)
              return (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[14px] font-medium text-ink-900">{item.label}</span>
                    <span className="font-mono text-[13px] font-semibold text-ink-700">
                      {v.toFixed(2)} <span className="font-normal text-ink-400">· {label}</span>
                    </span>
                  </div>
                  <div className="w-full bg-paper-200 rounded-sm h-2 mb-2">
                    <div className="h-2 rounded-sm transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                  {item.note && <p className="text-[12px] text-ink-500">{item.note}</p>}
                </div>
              )
            }

            // Mappa del Team — prepara dati recharts se candidate_scores presente
            const candidateScores: Array<{ name: string; scores: Record<string, number | null> }> =
              reportData?.candidate_scores || []
            const teamSkills: string[] = candidateScores.length > 0
              ? Object.keys(candidateScores[0].scores)
              : []

            const chartData = teamSkills.map(skillLabel => {
              const entry: Record<string, any> = { skill: skillLabel }
              let sum = 0, count = 0
              candidateScores.forEach(c => {
                const v = c.scores[skillLabel]
                entry[c.name] = v
                if (v != null) { sum += v; count++ }
              })
              entry._avg = count > 0 ? Number((sum / count).toFixed(2)) : null
              return entry
            })

            // Palette distinta per candidati (ciclica)
            const CANDIDATE_PALETTE = [
              '#1C1917', '#B5541A', '#2D6A4F', '#7C3D12', '#1B4332', '#92400E',
              '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6',
            ]

            const handleExportPdf = async () => {
              const token = localStorage.getItem('jwt_access_token')
              const res = await fetch(`${API_URL}/api/team-reports/${organization.id}/pdf`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              if (!res.ok) { setMessage({ type: 'error', text: 'Errore export PDF' }); return }
              const blob = await res.blob()
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              const safeName = (organization.name || 'team').toLowerCase().replace(/\s+/g, '-')
              a.download = `report-team-${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`
              a.click()
              URL.revokeObjectURL(url)
            }

            return (
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-[18px] font-medium text-ink-900">Report di Team</h2>
                    <p className="text-[12px] text-ink-500 mt-0.5">
                      Analisi aggregata AI sui candidati base completati
                    </p>
                  </div>
                  {report && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        className="flex items-center gap-2 text-[13px]"
                        onClick={handleExportPdf}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Esporta PDF
                      </Button>
                      <Button
                        variant="secondary"
                        className="flex items-center gap-2 text-[13px]"
                        onClick={handleGenerateReport}
                        disabled={generatingReport || completedBase.length < 3}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${generatingReport ? 'animate-spin' : ''}`} />
                        Aggiorna report
                      </Button>
                    </div>
                  )}
                </div>

                {/* Stato: meno di 3 candidati */}
                {completedBase.length < 3 ? (
                  <div className="text-center py-14 border border-dashed border-paper-300 rounded-md space-y-4">
                    <FileText className="w-8 h-8 text-ink-300 mx-auto" />
                    <div>
                      <p className="text-[15px] font-medium text-ink-700 mb-1">Report non disponibile</p>
                      <p className="text-[13px] text-ink-400">
                        Servono almeno 3 candidati con assessment base completato.
                        Attualmente: <span className="font-medium text-ink-700">{completedBase.length}</span>.
                      </p>
                    </div>
                    <Button variant="primary" disabled className="opacity-40 cursor-not-allowed">
                      Genera Report
                    </Button>
                  </div>
                ) : !report ? (
                  <div className="text-center py-14 border border-dashed border-paper-300 rounded-md space-y-4">
                    <FileText className="w-8 h-8 text-ink-300 mx-auto" />
                    <div>
                      <p className="text-[15px] font-medium text-ink-700 mb-1">Nessun report generato</p>
                      <p className="text-[13px] text-ink-400">
                        Hai <span className="font-medium text-ink-700">{completedBase.length}</span> candidati completati. Genera il report AI del team.
                      </p>
                    </div>
                    <Button variant="primary" onClick={handleGenerateReport} disabled={generatingReport}>
                      {generatingReport
                        ? <><span className="w-4 h-4 border-2 border-paper-50 border-t-transparent rounded-full animate-spin inline-block mr-2" />Generazione in corso…</>
                        : 'Genera Report'
                      }
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Meta */}
                    <div className="flex items-center gap-3 text-[12px] text-ink-400">
                      <span>Basato su <span className="font-medium text-ink-700">{report.candidate_count}</span> candidati</span>
                      <span>·</span>
                      <span>Generato il {new Date(report.generated_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>

                    {/* Summary */}
                    <div className="bg-paper-100 border border-paper-200 rounded-md p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400 mb-3">Sintesi</p>
                      <p className="text-[14px] text-ink-800 leading-relaxed">{reportData?.summary}</p>
                    </div>

                    {/* Strengths */}
                    {reportData?.strengths?.length > 0 && (
                      <div className="bg-paper-100 border border-paper-200 rounded-md p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400 mb-4">Punti di Forza</p>
                        <div className="space-y-4">
                          {reportData.strengths.map((s: any, i: number) => <EscoBar key={i} item={s} />)}
                        </div>
                      </div>
                    )}

                    {/* Gaps */}
                    {reportData?.gaps?.length > 0 && (
                      <div className="bg-paper-100 border border-paper-200 rounded-md p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400 mb-4">Aree di Sviluppo</p>
                        <div className="space-y-4">
                          {reportData.gaps.map((g: any, i: number) => <EscoBar key={i} item={g} />)}
                        </div>
                      </div>
                    )}

                    {/* Mappa del Team — recharts grouped bar (solo se candidate_scores presente) */}
                    {candidateScores.length > 0 && teamSkills.length > 0 && (
                      <div className="bg-paper-100 border border-paper-200 rounded-md p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400 mb-5">Mappa del Team</p>
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 60 }}>
                            <XAxis
                              dataKey="skill"
                              tick={{ fontSize: 11, fill: '#6B6560' }}
                              angle={-35}
                              textAnchor="end"
                              interval={0}
                            />
                            <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: '#6B6560' }} />
                            <Tooltip
                              formatter={(value: any, name: string) => {
                                if (name === '_avg') return null
                                const v = Number(value)
                                const { label } = escoInfo(v)
                                return [`${v.toFixed(2)} · ${label}`, name]
                              }}
                              contentStyle={{ fontSize: 12, borderRadius: 4, border: '1px solid #D4CBBA', background: '#FAF7F2' }}
                            />
                            <Legend
                              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                              formatter={(value) => value === '_avg' ? null : value}
                            />
                            <ReferenceLine y={0} stroke="#D4CBBA" />
                            {candidateScores.map((c, idx) => (
                              <Bar key={c.name} dataKey={c.name} fill={CANDIDATE_PALETTE[idx % CANDIDATE_PALETTE.length]} radius={[2, 2, 0, 0]} maxBarSize={18}>
                                {chartData.map((entry, i) => {
                                  const v = entry[c.name]
                                  return <Cell key={i} fill={v != null ? escoInfo(v).color : '#D4CBBA'} />
                                })}
                              </Bar>
                            ))}
                            <ReferenceLine
                              dataKey="_avg"
                              stroke="#8C8070"
                              strokeDasharray="4 3"
                              strokeWidth={1.5}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                        {/* Legenda ESCO */}
                        <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-paper-200">
                          {[
                            { label: 'Esperto',    range: '4.1–5.0', color: '#1B4332' },
                            { label: 'Avanzato',   range: '3.1–4.0', color: '#2D6A4F' },
                            { label: 'Intermedio', range: '2.1–3.0', color: '#D4A017' },
                            { label: 'Base',       range: '1.0–2.0', color: '#C0392B' },
                          ].map(({ label, range, color }) => (
                            <div key={label} className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
                              <span className="text-[11px] text-ink-600 font-medium">{label}</span>
                              <span className="text-[11px] text-ink-400">{range}</span>
                            </div>
                          ))}
                          <div className="flex items-center gap-1.5 ml-2 pl-4 border-l border-paper-300">
                            <span className="w-5 h-px border-t-2 border-dashed flex-shrink-0" style={{ borderColor: '#8C8070' }} />
                            <span className="text-[11px] text-ink-400">Media team per competenza</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Profili in Evidenza */}
                    {reportData?.outliers && (
                      <div className="bg-paper-100 border border-paper-200 rounded-md p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400 mb-3">Profili in Evidenza</p>
                        <p className="text-[14px] text-ink-800 leading-relaxed">{reportData.outliers}</p>
                      </div>
                    )}

                    {/* Raccomandazione HR */}
                    {reportData?.recommendation && (
                      <div className="bg-paper-50 border-l-4 border-sienna-600 rounded-sm p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-sienna-600 mb-3">Raccomandazione HR</p>
                        <p className="text-[14px] text-ink-800 leading-relaxed">{reportData.recommendation}</p>
                      </div>
                    )}

                    {/* Footer azioni */}
                    <div className="pt-2 flex items-center justify-end gap-2">
                      <Button
                        variant="secondary"
                        className="flex items-center gap-2 text-[13px]"
                        onClick={handleExportPdf}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Esporta PDF
                      </Button>
                      <Button
                        variant="secondary"
                        className="flex items-center gap-2 text-[13px]"
                        onClick={handleGenerateReport}
                        disabled={generatingReport}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${generatingReport ? 'animate-spin' : ''}`} />
                        {generatingReport ? 'Aggiornamento…' : 'Aggiorna report'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          {/* ── NUOVO INVITO ──── */}
          {activeTab === 'new-invite' && (
            <div className="p-6 max-w-lg">
              <h2 className="font-display text-[20px] font-medium text-ink-900 mb-1">Invita un Candidato</h2>
              <p className="text-[13px] text-ink-500 mb-6">Il candidato riceverà un link personale via email per completare l&apos;assessment.</p>

              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label className={labelCls}>Email Candidato *</label>
                  <input type="email" required value={inviteForm.candidateEmail}
                    onChange={e => setInviteForm({ ...inviteForm, candidateEmail: e.target.value })}
                    className={inputCls} placeholder="candidato@email.it" />
                </div>
                <div>
                  <label className={labelCls}>Nome Candidato *</label>
                  <input type="text" required value={inviteForm.candidateName}
                    onChange={e => setInviteForm({ ...inviteForm, candidateName: e.target.value })}
                    className={inputCls} placeholder="Mario Rossi" />
                </div>
                <div>
                  <label className={labelCls}>Note (opzionale)</label>
                  <textarea value={inviteForm.notes}
                    onChange={e => setInviteForm({ ...inviteForm, notes: e.target.value })}
                    className={`${inputCls} resize-none`} rows={3}
                    placeholder="Es. Posizione: Full Stack Developer…" />
                </div>
                <div className="bg-paper-100 border border-paper-200 rounded-md p-4">
                  <p className="text-[12px] text-ink-600 leading-relaxed">
                    <strong>Cosa succede dopo:</strong> Il candidato riceverà un link unico via email per completare l&apos;assessment. Una volta terminato potrai visualizzare il report nella sezione Candidati.
                  </p>
                </div>
                <Button type="submit" variant="primary" disabled={sendingInvite} className="w-full justify-center">
                  {sendingInvite ? 'Invio in corso…' : 'Invia Invito'}
                </Button>
              </form>
            </div>
          )}

        </div>
      </main>

      {/* ── MODAL NUOVO FOCUS ──────────────────────────────────────────── */}
      {showFocusModal && (
        <div className="fixed inset-0 bg-ink-950/60 flex items-center justify-center p-4 z-50">
          <div className="bg-paper-50 rounded-md shadow-lg-ink p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-[20px] font-medium text-ink-900">Nuovo Focus</h3>
              <button onClick={() => setShowFocusModal(false)} className="text-ink-400 hover:text-ink-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateFocus} className="space-y-5">
              <div>
                <label className={labelCls}>Nome Focus *</label>
                <input
                  type="text" required value={focusForm.name}
                  onChange={e => setFocusForm({ ...focusForm, name: e.target.value })}
                  className={inputCls} placeholder="Es. Focus Comunicazione Team Sales Q3 2026"
                />
              </div>
              <div>
                <label className={labelCls}>Descrizione (opzionale)</label>
                <textarea
                  value={focusForm.description}
                  onChange={e => setFocusForm({ ...focusForm, description: e.target.value })}
                  className={`${inputCls} resize-none`} rows={2}
                  placeholder="Contesto del ruolo o dell'obiettivo di valutazione…"
                />
              </div>
              <div>
                <label className={labelCls}>
                  Competenze * — seleziona da 1 a 3
                  {focusForm.skills.length > 0 && (
                    <span className="ml-2 text-sienna-600">{focusForm.skills.length}/3</span>
                  )}
                </label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {SKILLS.map(s => {
                    const selected = focusForm.skills.includes(s)
                    const disabled = !selected && focusForm.skills.length >= 3
                    return (
                      <button
                        key={s} type="button"
                        disabled={disabled}
                        onClick={() => toggleFocusSkill(s)}
                        className={`px-3 py-2 rounded-sm border text-[13px] text-left transition-all ${
                          selected
                            ? 'border-sienna-600 bg-sienna-50 text-sienna-900 font-medium'
                            : disabled
                            ? 'border-paper-200 bg-paper-100 text-ink-300 cursor-not-allowed'
                            : 'border-paper-200 bg-paper-50 text-ink-700 hover:border-ink-400'
                        }`}
                      >
                        {SKILL_LABELS[s]}
                      </button>
                    )
                  })}
                </div>
              </div>
              <Button
                type="submit"
                variant="primary"
                disabled={creatingFocus || focusForm.skills.length === 0}
                className="w-full justify-center"
              >
                {creatingFocus ? 'Creazione…' : 'Crea Focus'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL INVITA FOCUS ─────────────────────────────────────────── */}
      {focusInviteModal?.open && (
        <div className="fixed inset-0 bg-ink-950/60 flex items-center justify-center p-4 z-50">
          <div className="bg-paper-50 rounded-md shadow-lg-ink p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display text-[20px] font-medium text-ink-900">Invita per Focus</h3>
              <button onClick={() => setFocusInviteModal(null)} className="text-ink-400 hover:text-ink-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[12px] text-ink-500 mb-6">
              Focus: <span className="font-medium text-ink-800">{focusInviteModal.configName}</span>
            </p>
            <form onSubmit={handleSendFocusInvite} className="space-y-4">
              <div>
                <label className={labelCls}>Email Candidato *</label>
                <input
                  type="email" required value={focusInviteForm.candidateEmail}
                  onChange={e => setFocusInviteForm({ ...focusInviteForm, candidateEmail: e.target.value })}
                  className={inputCls} placeholder="candidato@email.it"
                />
              </div>
              <div>
                <label className={labelCls}>Nome Candidato *</label>
                <input
                  type="text" required value={focusInviteForm.candidateName}
                  onChange={e => setFocusInviteForm({ ...focusInviteForm, candidateName: e.target.value })}
                  className={inputCls} placeholder="Mario Rossi"
                />
              </div>
              <Button type="submit" variant="primary" disabled={sendingFocusInvite} className="w-full justify-center">
                {sendingFocusInvite ? 'Invio…' : 'Invia Invito Focus'}
              </Button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default function AziendeDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-paper-100">
        <div className="w-8 h-8 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AziendeDashboardContent />
    </Suspense>
  )
}
