'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { Wordmark } from '@/components/ui/Wordmark'
import { Button } from '@/components/ui/Button'
import { Users, FileText, CheckCircle, Building2, Mail, Download, Plus, X, AlertTriangle } from 'lucide-react'

// ==================== INTERFACES ====================
interface Stats {
  totalUsers: number
  totalAssessments: number
  completedAssessments: number
  inProgressAssessments: number
  abandonedAssessments: number
  avgCompletionTime: number
  categoryAverages: Record<string, string>
  newUsersLast7Days: number
  completedLast7Days: number
}

interface User {
  id: string
  full_name: string
  email: string
  created_at: string
  assessmentCount: number
  last_assessment_date: string | null
  is_blocked: boolean
}

interface Assessment {
  id: string
  user_id: string
  status: string
  total_score: number | null
  created_at: string
  completed_at: string | null
  userName: string
  userEmail: string
}

interface Trial {
  id: string
  company_name: string
  contact_email: string
  contact_name: string
  phone: string | null
  employees: string | null
  sector: string | null
  assessment_quota: number
  used_assessments: number
  expires_at: string
  status: 'pending' | 'active' | 'expired' | 'converted'
  created_at: string
  activated_at: string | null
}

// ==================== CONSTANTS ====================
const categoryLabels: Record<string, string> = {
  communication: 'Comunicazione', leadership: 'Leadership', problem_solving: 'Problem Solving',
  teamwork: 'Lavoro di Squadra', time_management: 'Gestione del Tempo', adaptability: 'Adattabilità',
  creativity: 'Creatività', critical_thinking: 'Pensiero Critico', empathy: 'Empatia',
  resilience: 'Resilienza', negotiation: 'Negoziazione', decision_making: 'Decision Making'
}

const emailTemplates = {
  welcome: { subject: 'Benvenuto su ValutoLab! 🚀', body: `Ciao {name},\n\nBenvenuto su ValutoLab, la piattaforma per valutare le tue soft skills professionali.\n\nIniziasubito il tuo primo assessment!\n\n🔗 https://valutolab.com/dashboard\n\nIl Team ValutoLab` },
  reminder: { subject: 'Completa il tuo Assessment su ValutoLab ⏰', body: `Ciao {name},\n\nHai iniziato un assessment ma non l'hai ancora completato.\n\nBastano solo 10-15 minuti!\n\n🔗 https://valutolab.com/dashboard\n\nIl Team ValutoLab` },
  congrats: { subject: 'Ottimi risultati! 🎉', body: `Ciao {name},\n\nComplimenti per l'eccellente punteggio!\n\n🔗 https://valutolab.com/dashboard\n\nIl Team ValutoLab` },
  custom: { subject: '', body: '' }
}

// ==================== HELPERS ====================
const inputCls = 'w-full px-3 py-2 border border-paper-300 rounded-sm bg-paper-100 focus:border-ink-600 focus:outline-none font-body text-[13px] text-ink-900 placeholder-ink-400'
const labelCls = 'block text-[11px] font-medium text-ink-600 uppercase tracking-eyebrow mb-1.5'

const TrialStatusBadge = ({ trial }: { trial: Trial }) => {
  const now = new Date()
  const expires = new Date(trial.expires_at)
  if (trial.status === 'pending')
    return <span className="text-[10px] font-semibold uppercase tracking-eyebrow px-2 py-0.5 rounded-sm border text-level-intermedio bg-amber-50 border-amber-200">In attesa</span>
  if (trial.status === 'converted')
    return <span className="text-[10px] font-semibold uppercase tracking-eyebrow px-2 py-0.5 rounded-sm border text-level-esperto bg-teal-50 border-teal-200">Convertito</span>
  if (trial.status === 'active' && expires > now) {
    const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return <span className="text-[10px] font-semibold uppercase tracking-eyebrow px-2 py-0.5 rounded-sm border text-level-avanzato bg-green-50 border-green-200">Attivo ({daysLeft}gg)</span>
  }
  return <span className="text-[10px] font-semibold uppercase tracking-eyebrow px-2 py-0.5 rounded-sm border text-sienna-700 bg-sienna-50 border-sienna-300">Scaduto</span>
}

const thCls = 'px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-eyebrow text-ink-400'
const tdCls = 'px-4 py-3 text-[13px]'

// ==================== MAIN ====================
export default function AdminDashboard() {
  const router = useRouter()
  const { user: authUser, logout, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentAdminEmail, setCurrentAdminEmail] = useState('')

  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [trials, setTrials] = useState<Trial[]>([])

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'assessments' | 'email' | 'trials'>('overview')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'blocked'>('all')
  const [creatingUser, setCreatingUser] = useState(false)
  const [blockingUser, setBlockingUser] = useState<string | null>(null)
  const [newUserForm, setNewUserForm] = useState({ email: '', fullName: '', password: '' })

  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailForm, setEmailForm] = useState({ recipients: 'all' as 'all' | 'completed' | 'incomplete' | 'selected' | 'custom', customEmails: '', template: 'custom' as keyof typeof emailTemplates, subject: '', body: '' })
  const [sendingEmail, setSendingEmail] = useState(false)

  const [assessmentFilter, setAssessmentFilter] = useState<'all' | 'completed' | 'in_progress'>('all')
  const [assessmentSearchTerm, setAssessmentSearchTerm] = useState('')

  const [activatingTrial, setActivatingTrial] = useState<string | null>(null)
  const [trialFilter, setTrialFilter] = useState<'all' | 'pending' | 'active' | 'expired'>('all')
  const [showActivateModal, setShowActivateModal] = useState<Trial | null>(null)
  const [activateForm, setActivateForm] = useState({ quota: 20, days: 30 })

  useEffect(() => {
    const checkAdmin = async () => {
      if (authLoading) return
      const user = authUser
      if (!user) { router.push('/login'); return }
      if (user.role !== 'admin') { router.push('/dashboard'); return }
      setIsAdmin(true)
      setCurrentAdminEmail(user.email || '')
      await loadData()
      setLoading(false)
    }
    checkAdmin()
  }, [router, authUser, authLoading])

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 4000)
      return () => clearTimeout(t)
    }
  }, [message])

  const loadData = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.valutolab.com'
    try {
      const [sR, uR, aR, tR] = await Promise.all([
        fetch(`${apiUrl}/api/admin/stats`),
        fetch(`${apiUrl}/api/admin/users`),
        fetch(`${apiUrl}/api/admin/assessments`),
        fetch(`${apiUrl}/api/v1/trial/list`),
      ])
      const [sD, uD, aD, tD] = await Promise.all([sR.json(), uR.json(), aR.json(), tR.json()])
      if (sD.success) setStats(sD.stats)
      if (uD.success) setUsers(uD.users)
      if (aD.success) setAssessments(aD.assessments)
      if (tD.success) setTrials(tD.trials)
    } catch { showMsg('error', 'Errore nel caricamento dei dati') }
  }

  const showMsg = (type: 'success' | 'error', text: string) => setMessage({ type, text })

  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return
    const headers = Object.keys(data[0])
    const csv = [headers.join(','), ...data.map(r => headers.map(h => JSON.stringify(r[h] || '')).join(','))].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  // ── Trial handlers ──
  const handleActivateTrial = async () => {
    if (!showActivateModal) return
    setActivatingTrial(showActivateModal.id)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.valutolab.com'}/api/v1/trial/activate/${showActivateModal.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessment_quota: activateForm.quota, days: activateForm.days })
      })
      const data = await res.json()
      if (data.success) { showMsg('success', `Trial attivato! Magic link inviato a ${showActivateModal.contact_email}`); setShowActivateModal(null); await loadData() }
      else showMsg('error', data.error || 'Errore attivazione')
    } catch { showMsg('error', 'Errore attivazione trial') }
    finally { setActivatingTrial(null) }
  }

  const handleUpdateTrialStatus = async (trialId: string, status: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/trial/update/${trialId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      const data = await res.json()
      if (data.success) { showMsg('success', 'Status aggiornato!'); await loadData() } else showMsg('error', 'Errore aggiornamento')
    } catch { showMsg('error', 'Errore aggiornamento') }
  }

  const handleDeleteTrial = async (trialId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/trial/delete/${trialId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) { showMsg('success', 'Trial eliminato!'); await loadData() } else showMsg('error', 'Errore eliminazione')
    } catch { showMsg('error', 'Errore eliminazione') }
  }

  // ── User handlers ──
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault(); setCreatingUser(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/create`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newUserForm.email, fullName: newUserForm.fullName, password: newUserForm.password })
      })
      const data = await res.json()
      if (data.success) { showMsg('success', 'Utente creato!'); setShowCreateUserModal(false); setNewUserForm({ email: '', fullName: '', password: '' }); await loadData() }
      else showMsg('error', data.message || 'Errore creazione utente')
    } catch { showMsg('error', 'Errore creazione utente') }
    finally { setCreatingUser(false) }
  }

  const handleBlockUser = async (userId: string, blocked: boolean) => {
    setBlockingUser(userId)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/block`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blocked: !blocked })
      })
      const data = await res.json()
      if (data.success) { showMsg('success', blocked ? 'Utente sbloccato!' : 'Utente bloccato!'); await loadData() }
      else showMsg('error', "Errore nell'operazione")
    } catch { showMsg('error', "Errore nell'operazione") }
    finally { setBlockingUser(null) }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) { showMsg('success', 'Utente eliminato'); setShowDeleteConfirm(null); await loadData() }
      else showMsg('error', "Errore nell'eliminazione")
    } catch { showMsg('error', "Errore nell'eliminazione") }
  }

  const handleDeleteAssessment = async (id: string) => {
    if (!confirm('Eliminare questo assessment?')) return
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/assessments/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) { showMsg('success', 'Assessment eliminato'); await loadData() }
      else showMsg('error', "Errore nell'eliminazione")
    } catch { showMsg('error', "Errore nell'eliminazione") }
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault(); setSendingEmail(true)
    try {
      let recipients: string[] = []
      if (emailForm.recipients === 'all') recipients = users.map(u => u.email)
      else if (emailForm.recipients === 'completed') recipients = users.filter(u => u.assessmentCount > 0).map(u => u.email)
      else if (emailForm.recipients === 'incomplete') recipients = users.filter(u => u.assessmentCount === 0).map(u => u.email)
      else if (emailForm.recipients === 'selected') recipients = users.filter(u => selectedUsers.includes(u.id)).map(u => u.email)
      else if (emailForm.recipients === 'custom') recipients = emailForm.customEmails.split(',').map(e => e.trim()).filter(Boolean)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/emails/send`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients, subject: emailForm.subject, body: emailForm.body })
      })
      const data = await res.json()
      if (data.success) { showMsg('success', `Email inviata a ${recipients.length} destinatari!`); setShowEmailModal(false); setEmailForm({ recipients: 'all', customEmails: '', template: 'custom', subject: '', body: '' }) }
      else showMsg('error', "Errore nell'invio email")
    } catch { showMsg('error', "Errore nell'invio email") }
    finally { setSendingEmail(false) }
  }

  const handleTemplateChange = (template: keyof typeof emailTemplates) => {
    setEmailForm({ ...emailForm, template, subject: emailTemplates[template].subject, body: emailTemplates[template].body })
  }

  const handleExportUsers = () => exportToCSV(filteredUsers.map(u => ({ Email: u.email, Nome: u.full_name || 'N/A', Assessment: u.assessmentCount, Registrato: new Date(u.created_at).toLocaleDateString('it-IT'), Status: u.is_blocked ? 'Bloccato' : 'Attivo' })), 'valutolab_utenti')
  const handleExportAssessments = () => exportToCSV(filteredAssessments.map(a => ({ Utente: a.userName, Email: a.userEmail, Status: a.status === 'completed' ? 'Completato' : 'In corso', Punteggio: a.total_score != null ? Number(a.total_score).toFixed(1) : '-', Creazione: new Date(a.created_at).toLocaleDateString('it-IT') })), 'valutolab_assessments')

  const filteredUsers = users.filter(u => {
    const ms = u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) || (u.full_name || '').toLowerCase().includes(userSearchTerm.toLowerCase())
    const mf = userFilter === 'all' || (userFilter === 'blocked' && u.is_blocked) || (userFilter === 'active' && !u.is_blocked)
    return ms && mf
  })

  const filteredAssessments = assessments.filter(a => {
    const ms = a.userName.toLowerCase().includes(assessmentSearchTerm.toLowerCase()) || a.userEmail.toLowerCase().includes(assessmentSearchTerm.toLowerCase())
    const mf = assessmentFilter === 'all' || (assessmentFilter === 'completed' && a.status === 'completed') || (assessmentFilter === 'in_progress' && a.status === 'in_progress')
    return ms && mf
  })

  const filteredTrials = trials.filter(t => trialFilter === 'all' || t.status === trialFilter)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-paper-100">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-ink-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 font-body text-[14px] text-ink-500">Caricamento dashboard admin…</p>
      </div>
    </div>
  )

  if (!isAdmin) return null

  const pendingTrials = trials.filter(t => t.status === 'pending').length
  const activeTrials  = trials.filter(t => t.status === 'active').length

  const tabs: { key: typeof activeTab; label: string; badge?: number }[] = [
    { key: 'overview',    label: 'Panoramica' },
    { key: 'users',       label: `Utenti (${users.length})` },
    { key: 'assessments', label: `Assessment (${assessments.length})` },
    { key: 'trials',      label: `Trial Aziende (${trials.length})`, badge: pendingTrials },
    { key: 'email',       label: 'Email' },
  ]

  return (
    <div className="min-h-screen bg-paper-100 font-body text-ink-900">

      {/* Toast */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-sm shadow-lg-ink text-[14px] font-medium text-paper-50 ${message.type === 'success' ? 'bg-ink-900' : 'bg-sienna-600'}`}>
          {message.text}
        </div>
      )}

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className="bg-paper-50 border-b border-paper-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Wordmark size={20} />
              <span className="text-[10px] font-semibold uppercase tracking-eyebrow text-sienna-700 bg-sienna-50 border border-sienna-300 px-2.5 py-1 rounded-sm">
                Admin
              </span>
            </div>
            <div className="flex items-center gap-5">
              <span className="text-[12px] text-ink-400">{currentAdminEmail}</span>
              <button onClick={() => router.push('/dashboard')} className="text-[13px] text-ink-500 hover:text-ink-900 transition-colors">Dashboard utente</button>
              <button onClick={async () => { await logout(); router.push('/login') }} className="text-[13px] text-ink-500 hover:text-sienna-600 transition-colors">Esci</button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-6">

        {/* ── TITLE ──────────────────────────────────────────────────── */}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-1">Pannello di controllo</p>
          <h1 className="font-display text-display-3 text-ink-900">Admin Dashboard</h1>
        </div>

        {/* ── TABS ───────────────────────────────────────────────────── */}
        <div className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink">
          <div className="flex border-b border-paper-200 overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`relative px-5 py-3.5 text-[13px] font-medium whitespace-nowrap transition-colors border-b-2 -mb-px flex-shrink-0 ${
                  activeTab === tab.key ? 'border-ink-900 text-ink-900' : 'border-transparent text-ink-500 hover:text-ink-800'
                }`}>
                {tab.label}
                {tab.badge != null && tab.badge > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-sienna-600 text-paper-50 text-[9px] font-bold rounded-full">{tab.badge}</span>
                )}
              </button>
            ))}
          </div>

          {/* ══════════ OVERVIEW ══════════ */}
          {activeTab === 'overview' && stats && (
            <div className="p-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: Users,       label: 'Utenti Totali',    value: stats.totalUsers,            sub: `+${stats.newUsersLast7Days} ultimi 7gg` },
                  { icon: FileText,    label: 'Assessment Totali', value: stats.totalAssessments,      sub: `+${stats.completedLast7Days} completati/7gg` },
                  { icon: CheckCircle, label: 'Completati',        value: stats.completedAssessments,  sub: `${stats.inProgressAssessments} in corso` },
                  { icon: Building2,   label: 'Trial Aziende',     value: trials.length,               sub: `${pendingTrials} in attesa · ${activeTrials} attivi` },
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

              {/* Quick actions */}
              <div className="bg-ink-900 rounded-md p-6">
                <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-4">Azioni Rapide</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: Plus,     label: 'Crea Utente',     action: () => { setActiveTab('users'); setShowCreateUserModal(true) } },
                    { icon: Building2, label: 'Trial Aziende',   action: () => setActiveTab('trials'), badge: pendingTrials },
                    { icon: Download, label: 'Export Utenti',   action: handleExportUsers },
                    { icon: Mail,     label: 'Invia Email',     action: () => { setActiveTab('email'); setShowEmailModal(true) } },
                  ].map(({ icon: Icon, label, action, badge }) => (
                    <button key={label} onClick={action}
                      className="relative bg-ink-800 hover:bg-ink-700 rounded-md p-4 text-left transition-colors flex flex-col gap-2">
                      <Icon className="w-5 h-5 text-paper-300" />
                      <p className="text-[13px] font-medium text-paper-50">{label}</p>
                      {badge != null && badge > 0 && (
                        <span className="absolute top-2 right-2 w-5 h-5 bg-sienna-600 text-paper-50 text-[9px] font-bold rounded-full flex items-center justify-center">{badge}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category averages */}
              <div>
                <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-3">Punteggi Medi per Competenza</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(stats.categoryAverages).map(([category, score]) => (
                    <div key={category} className="bg-paper-100 border border-paper-200 rounded-md p-4">
                      <p className="text-[11px] text-ink-500 mb-1">{categoryLabels[category]}</p>
                      <div className="flex items-baseline gap-1 mb-2">
                        <p className="font-display text-[20px] text-ink-900">{score}</p>
                        <p className="text-[11px] text-ink-400">/5,0</p>
                      </div>
                      <div className="w-full bg-paper-200 rounded-sm h-1">
                        <div className="bg-ink-900 h-1 rounded-sm" style={{ width: `${(parseFloat(score) / 5) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════════ USERS ══════════ */}
          {activeTab === 'users' && (
            <div className="p-6 space-y-4">
              {/* Toolbar */}
              <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                <div className="flex gap-2 flex-1">
                  <input type="text" placeholder="Cerca per email o nome…" value={userSearchTerm}
                    onChange={e => setUserSearchTerm(e.target.value)}
                    className={`${inputCls} flex-1`} />
                  <select value={userFilter} onChange={e => setUserFilter(e.target.value as any)}
                    className={`${inputCls} w-auto`}>
                    <option value="all">Tutti</option>
                    <option value="active">Attivi</option>
                    <option value="blocked">Bloccati</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  {selectedUsers.length > 0 && (
                    <Button variant="secondary" className="text-[12px]"
                      onClick={() => { setEmailForm({ ...emailForm, recipients: 'selected' }); setShowEmailModal(true) }}>
                      <Mail className="w-3.5 h-3.5 mr-1" /> Email a {selectedUsers.length}
                    </Button>
                  )}
                  <Button variant="secondary" className="text-[12px] flex items-center gap-1.5" onClick={handleExportUsers}>
                    <Download className="w-3.5 h-3.5" /> CSV
                  </Button>
                  <Button variant="primary" className="text-[12px] flex items-center gap-1.5" onClick={() => setShowCreateUserModal(true)}>
                    <Plus className="w-3.5 h-3.5" /> Crea Utente
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div className="border border-paper-200 rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-paper-100 border-b border-paper-200">
                      <tr>
                        <th className={thCls + ' w-10'}>
                          <input type="checkbox"
                            checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                            onChange={e => setSelectedUsers(e.target.checked ? filteredUsers.map(u => u.id) : [])}
                            className="rounded-sm border-paper-300" />
                        </th>
                        {['Nome', 'Email', 'Assessment', 'Ultimo', 'Registrato', 'Status', 'Azioni'].map(h => <th key={h} className={thCls}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-paper-100">
                      {filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-paper-100 transition-colors">
                          <td className={tdCls}>
                            <input type="checkbox" checked={selectedUsers.includes(user.id)}
                              onChange={e => setSelectedUsers(e.target.checked ? [...selectedUsers, user.id] : selectedUsers.filter(id => id !== user.id))}
                              className="rounded-sm border-paper-300" />
                          </td>
                          <td className={tdCls + ' font-medium text-ink-900'}>{user.full_name || 'N/A'}</td>
                          <td className={tdCls + ' text-ink-600'}>{user.email}</td>
                          <td className={tdCls}>
                            <span className="text-[10px] font-semibold uppercase tracking-eyebrow px-2 py-0.5 rounded-sm border border-paper-300 bg-paper-100 text-ink-600">{user.assessmentCount}</span>
                          </td>
                          <td className={tdCls + ' text-ink-500'}>{user.last_assessment_date ? new Date(user.last_assessment_date).toLocaleDateString('it-IT') : '—'}</td>
                          <td className={tdCls + ' text-ink-500'}>{new Date(user.created_at).toLocaleDateString('it-IT')}</td>
                          <td className={tdCls}>
                            <span className={`text-[10px] font-semibold uppercase tracking-eyebrow px-2 py-0.5 rounded-sm border ${user.is_blocked ? 'text-sienna-700 bg-sienna-50 border-sienna-300' : 'text-level-avanzato bg-green-50 border-green-200'}`}>
                              {user.is_blocked ? 'Bloccato' : 'Attivo'}
                            </span>
                          </td>
                          <td className={tdCls}>
                            <div className="flex gap-1.5">
                              <button onClick={() => handleBlockUser(user.id, user.is_blocked)} disabled={blockingUser === user.id}
                                className={`text-[11px] font-medium px-2.5 py-1 rounded-sm border transition-colors disabled:opacity-40 ${user.is_blocked ? 'border-green-200 text-level-avanzato hover:bg-green-50' : 'border-amber-200 text-level-intermedio hover:bg-amber-50'}`}>
                                {blockingUser === user.id ? '…' : (user.is_blocked ? 'Sblocca' : 'Blocca')}
                              </button>
                              <button onClick={() => setShowDeleteConfirm(user.id)}
                                className="text-[11px] font-medium px-2.5 py-1 rounded-sm border border-sienna-300 text-sienna-700 hover:bg-sienna-50 transition-colors">
                                Elimina
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredUsers.length === 0 && <p className="text-center py-10 text-[13px] text-ink-400">Nessun utente trovato</p>}
              </div>
            </div>
          )}

          {/* ══════════ ASSESSMENTS ══════════ */}
          {activeTab === 'assessments' && (
            <div className="p-6 space-y-4">
              <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="flex gap-2 flex-1">
                  <input type="text" placeholder="Cerca per utente o email…" value={assessmentSearchTerm}
                    onChange={e => setAssessmentSearchTerm(e.target.value)} className={`${inputCls} flex-1`} />
                  <select value={assessmentFilter} onChange={e => setAssessmentFilter(e.target.value as any)} className={`${inputCls} w-auto`}>
                    <option value="all">Tutti</option>
                    <option value="completed">Completati</option>
                    <option value="in_progress">In Corso</option>
                  </select>
                </div>
                <Button variant="secondary" className="text-[12px] flex items-center gap-1.5" onClick={handleExportAssessments}>
                  <Download className="w-3.5 h-3.5" /> CSV
                </Button>
              </div>

              <div className="border border-paper-200 rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-paper-100 border-b border-paper-200">
                      <tr>
                        {['Utente', 'Email', 'Status', 'Punteggio', 'Creazione', 'Completamento', 'Azioni'].map(h => <th key={h} className={thCls}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-paper-100">
                      {filteredAssessments.map(a => (
                        <tr key={a.id} className="hover:bg-paper-100 transition-colors">
                          <td className={tdCls + ' font-medium text-ink-900'}>{a.userName}</td>
                          <td className={tdCls + ' text-ink-600'}>{a.userEmail}</td>
                          <td className={tdCls}>
                            <span className={`text-[10px] font-semibold uppercase tracking-eyebrow px-2 py-0.5 rounded-sm border ${a.status === 'completed' ? 'text-level-avanzato bg-green-50 border-green-200' : 'text-level-intermedio bg-amber-50 border-amber-200'}`}>
                              {a.status === 'completed' ? 'Completato' : 'In corso'}
                            </span>
                          </td>
                          <td className={tdCls + ' font-medium text-ink-900'}>{a.total_score != null ? `${Number(a.total_score).toFixed(1)}/5,0` : '—'}</td>
                          <td className={tdCls + ' text-ink-500'}>{new Date(a.created_at).toLocaleDateString('it-IT')}</td>
                          <td className={tdCls + ' text-ink-500'}>{a.completed_at ? new Date(a.completed_at).toLocaleDateString('it-IT') : '—'}</td>
                          <td className={tdCls}>
                            <div className="flex gap-1.5">
                              {a.status === 'completed' && (
                                <button onClick={() => router.push(`/dashboard/results/${a.id}`)}
                                  className="text-[11px] font-medium px-2.5 py-1 rounded-sm border border-paper-300 text-ink-700 hover:bg-paper-100 transition-colors">
                                  Visualizza
                                </button>
                              )}
                              <button onClick={() => handleDeleteAssessment(a.id)}
                                className="text-[11px] font-medium px-2.5 py-1 rounded-sm border border-sienna-300 text-sienna-700 hover:bg-sienna-50 transition-colors">
                                Elimina
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredAssessments.length === 0 && <p className="text-center py-10 text-[13px] text-ink-400">Nessun assessment trovato</p>}
              </div>
            </div>
          )}

          {/* ══════════ TRIALS ══════════ */}
          {activeTab === 'trials' && (
            <div className="p-6 space-y-4">
              {/* Mini stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'In Attesa',   value: trials.filter(t => t.status === 'pending').length,   cls: 'text-level-intermedio' },
                  { label: 'Attivi',      value: trials.filter(t => t.status === 'active').length,    cls: 'text-level-avanzato' },
                  { label: 'Convertiti',  value: trials.filter(t => t.status === 'converted').length, cls: 'text-level-esperto' },
                ].map(({ label, value, cls }) => (
                  <div key={label} className="bg-paper-100 border border-paper-200 rounded-md p-4 text-center">
                    <p className={`font-display text-[28px] ${cls}`}>{value}</p>
                    <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Filter bar */}
              <div className="flex gap-2 flex-wrap">
                {(['all', 'pending', 'active', 'expired'] as const).map(f => (
                  <button key={f} onClick={() => setTrialFilter(f)}
                    className={`text-[12px] font-medium px-4 py-1.5 rounded-sm border transition-colors ${trialFilter === f ? 'bg-ink-900 text-paper-50 border-ink-900' : 'border-paper-300 text-ink-600 hover:border-ink-500'}`}>
                    {f === 'all' ? 'Tutti' : f === 'pending' ? 'In attesa' : f === 'active' ? 'Attivi' : 'Scaduti'}
                  </button>
                ))}
                <span className="ml-auto text-[12px] text-ink-400 self-center">{filteredTrials.length} trial</span>
              </div>

              {/* Table */}
              <div className="border border-paper-200 rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-paper-100 border-b border-paper-200">
                      <tr>
                        {['Azienda', 'Contatto', 'Dimensione', 'Assessment', 'Scadenza', 'Status', 'Richiesta', 'Azioni'].map(h => <th key={h} className={thCls}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-paper-100">
                      {filteredTrials.map(trial => (
                        <tr key={trial.id} className={`hover:bg-paper-100 transition-colors ${trial.status === 'pending' ? 'bg-amber-50/40' : ''}`}>
                          <td className={tdCls}>
                            <p className="font-medium text-ink-900">{trial.company_name}</p>
                            <p className="text-[11px] text-ink-400">{trial.sector || '—'}</p>
                          </td>
                          <td className={tdCls}>
                            <p className="font-medium text-ink-900">{trial.contact_name}</p>
                            <p className="text-[11px] text-ink-400">{trial.contact_email}</p>
                            {trial.phone && <p className="text-[11px] text-ink-400">{trial.phone}</p>}
                          </td>
                          <td className={tdCls + ' text-ink-600'}>{trial.employees || '—'}</td>
                          <td className={tdCls}>
                            <p className="font-medium text-ink-900">{trial.used_assessments}/{trial.assessment_quota}</p>
                            <div className="w-16 bg-paper-200 rounded-sm h-1 mt-1">
                              <div className="bg-ink-900 h-1 rounded-sm" style={{ width: `${Math.min((trial.used_assessments / trial.assessment_quota) * 100, 100)}%` }} />
                            </div>
                          </td>
                          <td className={tdCls + ' text-ink-500'}>{new Date(trial.expires_at).toLocaleDateString('it-IT')}</td>
                          <td className={tdCls}><TrialStatusBadge trial={trial} /></td>
                          <td className={tdCls + ' text-ink-500'}>{new Date(trial.created_at).toLocaleDateString('it-IT')}</td>
                          <td className={tdCls}>
                            <div className="flex gap-1.5">
                              {trial.status === 'pending' && (
                                <button onClick={() => { setShowActivateModal(trial); setActivateForm({ quota: 20, days: 30 }) }}
                                  className="text-[11px] font-medium px-2.5 py-1 rounded-sm border border-green-200 text-level-avanzato hover:bg-green-50 transition-colors">
                                  Attiva
                                </button>
                              )}
                              {trial.status === 'active' && (
                                <button onClick={() => handleUpdateTrialStatus(trial.id, 'converted')}
                                  className="text-[11px] font-medium px-2.5 py-1 rounded-sm border border-teal-200 text-level-esperto hover:bg-teal-50 transition-colors">
                                  Converti
                                </button>
                              )}
                              <button onClick={() => { if (confirm(`Eliminare il trial di ${trial.company_name}?`)) handleDeleteTrial(trial.id) }}
                                className="text-[11px] font-medium px-2.5 py-1 rounded-sm border border-sienna-300 text-sienna-700 hover:bg-sienna-50 transition-colors">
                                Elimina
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredTrials.length === 0 && <p className="text-center py-10 text-[13px] text-ink-400">Nessun trial trovato</p>}
              </div>
            </div>
          )}

          {/* ══════════ EMAIL ══════════ */}
          {activeTab === 'email' && (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[18px] font-medium text-ink-900">Sistema Email</h2>
                <Button variant="primary" className="flex items-center gap-2 text-[13px]" onClick={() => setShowEmailModal(true)}>
                  <Mail className="w-4 h-4" /> Componi Email
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { label: 'Utenti Totali',            value: users.length },
                  { label: 'Con Assessment Completato', value: users.filter(u => u.assessmentCount > 0).length },
                  { label: 'Senza Assessment',          value: users.filter(u => u.assessmentCount === 0).length },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-paper-100 border border-paper-200 rounded-md p-5">
                    <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-2">{label}</p>
                    <p className="font-display text-[28px] text-ink-900">{value}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-3">Template Disponibili</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.entries(emailTemplates).filter(([k]) => k !== 'custom').map(([key, tmpl]) => (
                    <div key={key} className="bg-paper-100 border border-paper-200 rounded-md p-4 hover:border-ink-500 transition-colors">
                      <p className="text-[13px] font-medium text-ink-900 mb-1">{tmpl.subject}</p>
                      <p className="text-[11px] text-ink-500 line-clamp-2">{tmpl.body}</p>
                      <button onClick={() => { handleTemplateChange(key as keyof typeof emailTemplates); setShowEmailModal(true) }}
                        className="mt-3 text-[12px] font-medium text-ink-900 hover:text-sienna-600 transition-colors">
                        Usa Template →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ═══════════════ MODAL OVERLAY ═══════════════ */}
      {/* Activate Trial */}
      {showActivateModal && (
        <div className="fixed inset-0 bg-ink-950/60 flex items-center justify-center p-4 z-50">
          <div className="bg-paper-50 border border-paper-200 rounded-md shadow-lg-ink p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-[20px] font-medium text-ink-900">Attiva Trial</h3>
              <button onClick={() => setShowActivateModal(null)} className="text-ink-400 hover:text-ink-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="bg-paper-100 border border-paper-200 rounded-md p-4 mb-5">
              <p className="font-medium text-ink-900">{showActivateModal.company_name}</p>
              <p className="text-[13px] text-ink-500">{showActivateModal.contact_name} — {showActivateModal.contact_email}</p>
            </div>
            <div className="space-y-4 mb-5">
              <div>
                <label className={labelCls}>Assessment da includere</label>
                <input type="number" min={5} max={100} value={activateForm.quota}
                  onChange={e => setActivateForm({ ...activateForm, quota: parseInt(e.target.value) })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Durata (giorni)</label>
                <input type="number" min={7} max={90} value={activateForm.days}
                  onChange={e => setActivateForm({ ...activateForm, days: parseInt(e.target.value) })} className={inputCls} />
              </div>
            </div>
            <div className="bg-paper-100 border border-paper-200 rounded-md px-4 py-3 mb-5 text-[12px] text-ink-600">
              Verrà inviato un magic link a <strong>{showActivateModal.contact_email}</strong>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1 justify-center" onClick={() => setShowActivateModal(null)}>Annulla</Button>
              <Button variant="primary" className="flex-1 justify-center" onClick={handleActivateTrial} disabled={activatingTrial === showActivateModal.id}>
                {activatingTrial === showActivateModal.id ? 'Attivazione…' : 'Attiva e Invia Link'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create User */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-ink-950/60 flex items-center justify-center p-4 z-50">
          <div className="bg-paper-50 border border-paper-200 rounded-md shadow-lg-ink p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-[20px] font-medium text-ink-900">Crea Nuovo Utente</h3>
              <button onClick={() => { setShowCreateUserModal(false); setNewUserForm({ email: '', fullName: '', password: '' }) }}
                className="text-ink-400 hover:text-ink-700"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div><label className={labelCls}>Email *</label><input type="email" required value={newUserForm.email} onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })} className={inputCls} placeholder="utente@esempio.com" /></div>
              <div><label className={labelCls}>Nome Completo *</label><input type="text" required value={newUserForm.fullName} onChange={e => setNewUserForm({ ...newUserForm, fullName: e.target.value })} className={inputCls} placeholder="Mario Rossi" /></div>
              <div>
                <label className={labelCls}>Password Temporanea *</label>
                <input type="password" required value={newUserForm.password} onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })} className={inputCls} placeholder="Min 6 caratteri" minLength={6} />
                <p className="text-[10px] text-ink-400 mt-1">L'utente potrà cambiarla al primo accesso</p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" className="flex-1 justify-center"
                  onClick={() => { setShowCreateUserModal(false); setNewUserForm({ email: '', fullName: '', password: '' }) }}>Annulla</Button>
                <Button type="submit" variant="primary" className="flex-1 justify-center" disabled={creatingUser}>
                  {creatingUser ? 'Creazione…' : 'Crea Utente'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-ink-950/60 flex items-center justify-center p-4 z-50">
          <div className="bg-paper-50 border border-paper-200 rounded-md shadow-lg-ink p-8 max-w-sm w-full text-center">
            <div className="w-12 h-12 bg-sienna-50 border border-sienna-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-sienna-600" />
            </div>
            <h3 className="font-display text-[20px] font-medium text-ink-900 mb-2">Conferma Eliminazione</h3>
            <p className="text-[13px] text-ink-500 mb-6">Sei sicuro di voler eliminare questo utente?<br /><strong className="text-ink-900">Questa azione è irreversibile.</strong></p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1 justify-center" onClick={() => setShowDeleteConfirm(null)}>Annulla</Button>
              <button onClick={() => handleDeleteUser(showDeleteConfirm)}
                className="flex-1 bg-sienna-600 text-paper-50 font-medium text-[14px] px-5 py-3 rounded-sm hover:bg-sienna-700 transition-colors">
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-ink-950/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-paper-50 border border-paper-200 rounded-md shadow-lg-ink p-8 max-w-2xl w-full my-8">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-[20px] font-medium text-ink-900">Componi Email</h3>
              <button onClick={() => { setShowEmailModal(false); setEmailForm({ recipients: 'all', customEmails: '', template: 'custom', subject: '', body: '' }) }}
                className="text-ink-400 hover:text-ink-700"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div>
                <label className={labelCls}>Template</label>
                <select value={emailForm.template} onChange={e => handleTemplateChange(e.target.value as keyof typeof emailTemplates)} className={inputCls}>
                  <option value="custom">Personalizzato</option>
                  <option value="welcome">Benvenuto</option>
                  <option value="reminder">Reminder Completamento</option>
                  <option value="congrats">Congratulazioni</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Destinatari</label>
                <select value={emailForm.recipients} onChange={e => setEmailForm({ ...emailForm, recipients: e.target.value as any })} className={inputCls}>
                  <option value="all">Tutti gli utenti ({users.length})</option>
                  <option value="completed">Chi ha completato ({users.filter(u => u.assessmentCount > 0).length})</option>
                  <option value="incomplete">Chi non ha completato ({users.filter(u => u.assessmentCount === 0).length})</option>
                  <option value="selected">Utenti selezionati ({selectedUsers.length})</option>
                  <option value="custom">Email personalizzate</option>
                </select>
              </div>
              {emailForm.recipients === 'custom' && (
                <div>
                  <label className={labelCls}>Email (separate da virgola)</label>
                  <textarea value={emailForm.customEmails} onChange={e => setEmailForm({ ...emailForm, customEmails: e.target.value })} className={`${inputCls} resize-none`} rows={3} placeholder="email1@esempio.com, email2@esempio.com" />
                </div>
              )}
              <div>
                <label className={labelCls}>Oggetto *</label>
                <input type="text" required value={emailForm.subject} onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })} className={inputCls} placeholder="Oggetto dell'email" />
              </div>
              <div>
                <label className={labelCls}>Messaggio *</label>
                <textarea required value={emailForm.body} onChange={e => setEmailForm({ ...emailForm, body: e.target.value })} className={`${inputCls} resize-none`} rows={8} placeholder="Corpo dell'email…" />
                <p className="text-[10px] text-ink-400 mt-1">Puoi usare {'{name}'} per il nome utente</p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" className="flex-1 justify-center"
                  onClick={() => { setShowEmailModal(false); setEmailForm({ recipients: 'all', customEmails: '', template: 'custom', subject: '', body: '' }) }}>Annulla</Button>
                <Button type="submit" variant="primary" className="flex-1 justify-center flex items-center gap-2" disabled={sendingEmail}>
                  {sendingEmail ? 'Invio…' : <><Mail className="w-4 h-4" /> Invia Email</>}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
