'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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

interface EmailLog {
  id: string
  recipient: string
  subject: string
  sent_at: string
  status: 'sent' | 'failed'
}

// ==================== CONSTANTS ====================
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

const emailTemplates = {
  welcome: {
    subject: 'Benvenuto su ValutoLab! 🚀',
    body: `Ciao {name},

Benvenuto su ValutoLab, la piattaforma per valutare le tue soft skills professionali.

Inizia subito il tuo primo assessment per scoprire i tuoi punti di forza!

🔗 Accedi alla dashboard: https://valutolab.com/dashboard

Un saluto,
Il Team ValutoLab`
  },
  reminder: {
    subject: 'Completa il tuo Assessment su ValutoLab ⏰',
    body: `Ciao {name},

Abbiamo notato che hai iniziato un assessment ma non l'hai ancora completato.

Bastano solo 10-15 minuti per terminarlo e scoprire il tuo profilo professionale!

🔗 Riprendi l'assessment: https://valutolab.com/dashboard

Ti aspettiamo!
Il Team ValutoLab`
  },
  congrats: {
    subject: 'Ottimi risultati! 🎉',
    body: `Ciao {name},

Complimenti per l'eccellente punteggio nel tuo assessment!

Il tuo profilo mostra competenze professionali di alto livello.

🔗 Visualizza i tuoi risultati: https://valutolab.com/dashboard
📱 Scarica il badge LinkedIn per condividere il tuo successo!

Continua così!
Il Team ValutoLab`
  },
  custom: {
    subject: '',
    body: ''
  }
}

// ==================== MAIN COMPONENT ====================
export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentAdminEmail, setCurrentAdminEmail] = useState('')
  
  // Data states
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([])
  
  // UI states
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'assessments' | 'email'>('overview')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // User Management states
  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'blocked'>('all')
  const [creatingUser, setCreatingUser] = useState(false)
  const [blockingUser, setBlockingUser] = useState<string | null>(null)
  
  // Create User form
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    fullName: '',
    password: ''
  })
  
  // Email states
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailForm, setEmailForm] = useState({
    recipients: 'all' as 'all' | 'completed' | 'incomplete' | 'selected' | 'custom',
    customEmails: '',
    template: 'custom' as keyof typeof emailTemplates,
    subject: '',
    body: ''
  })
  const [sendingEmail, setSendingEmail] = useState(false)
  
  // Assessment filter states
  const [assessmentFilter, setAssessmentFilter] = useState<'all' | 'completed' | 'in_progress'>('all')
  const [assessmentSearchTerm, setAssessmentSearchTerm] = useState('')

  // ==================== EFFECTS ====================
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin, full_name')
        .eq('id', user.id)
        .single()

      if (!profile?.is_admin) {
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)
      setCurrentAdminEmail(user.email || '')
      await loadData()
      setLoading(false)
    }

    checkAdmin()
  }, [router])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [message])

  // ==================== DATA LOADING ====================
  const loadData = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://valutolab-backend.onrender.com'

    try {
      // Load stats
      const statsResponse = await fetch(`${apiUrl}/api/admin/stats`)
      const statsData = await statsResponse.json()
      if (statsData.success) setStats(statsData.stats)

      // Load users
      const usersResponse = await fetch(`${apiUrl}/api/admin/users`)
      const usersData = await usersResponse.json()
      if (usersData.success) setUsers(usersData.users)

      // Load assessments
      const assessmentsResponse = await fetch(`${apiUrl}/api/admin/assessments`)
      const assessmentsData = await assessmentsResponse.json()
      if (assessmentsData.success) setAssessments(assessmentsData.assessments)

      // Load email logs (se endpoint disponibile)
      // const emailResponse = await fetch(`${apiUrl}/api/admin/emails/logs`)
      // const emailData = await emailResponse.json()
      // if (emailData.success) setEmailLogs(emailData.logs)
    } catch (error) {
      console.error('Error loading admin data:', error)
      showMessage('error', 'Errore nel caricamento dei dati')
    }
  }

  // ==================== HELPER FUNCTIONS ====================
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
  }

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // ==================== USER MANAGEMENT HANDLERS ====================
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingUser(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://valutolab-backend.onrender.com'
      
      const response = await fetch(`${apiUrl}/api/admin/users/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserForm.email,
          fullName: newUserForm.fullName,
          password: newUserForm.password
        })
      })

      const data = await response.json()

      if (data.success) {
        showMessage('success', 'Utente creato con successo!')
        setShowCreateUserModal(false)
        setNewUserForm({ email: '', fullName: '', password: '' })
        await loadData()
      } else {
        showMessage('error', data.message || 'Errore nella creazione utente')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      showMessage('error', 'Errore nella creazione utente')
    } finally {
      setCreatingUser(false)
    }
  }

  const handleBlockUser = async (userId: string, currentlyBlocked: boolean) => {
    setBlockingUser(userId)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://valutolab-backend.onrender.com'
      
      const response = await fetch(`${apiUrl}/api/admin/users/${userId}/block`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked: !currentlyBlocked })
      })

      const data = await response.json()

      if (data.success) {
        showMessage('success', currentlyBlocked ? 'Utente sbloccato!' : 'Utente bloccato!')
        await loadData()
      } else {
        showMessage('error', 'Errore nell\'operazione')
      }
    } catch (error) {
      console.error('Error blocking user:', error)
      showMessage('error', 'Errore nell\'operazione')
    } finally {
      setBlockingUser(null)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://valutolab-backend.onrender.com'
      
      const response = await fetch(`${apiUrl}/api/admin/users/${userId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        showMessage('success', 'Utente eliminato con successo')
        setShowDeleteConfirm(null)
        await loadData()
      } else {
        showMessage('error', 'Errore nell\'eliminazione')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      showMessage('error', 'Errore nell\'eliminazione')
    }
  }

  const handleDeleteAssessment = async (assessmentId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo assessment?')) return

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://valutolab-backend.onrender.com'
      
      const response = await fetch(`${apiUrl}/api/admin/assessments/${assessmentId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        showMessage('success', 'Assessment eliminato')
        await loadData()
      } else {
        showMessage('error', 'Errore nell\'eliminazione')
      }
    } catch (error) {
      console.error('Error deleting assessment:', error)
      showMessage('error', 'Errore nell\'eliminazione')
    }
  }

  // ==================== EMAIL HANDLERS ====================
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setSendingEmail(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://valutolab-backend.onrender.com'
      
      // Determina destinatari
      let recipients: string[] = []
      
      if (emailForm.recipients === 'all') {
        recipients = users.map(u => u.email)
      } else if (emailForm.recipients === 'completed') {
        const completedUsers = users.filter(u => u.assessmentCount > 0)
        recipients = completedUsers.map(u => u.email)
      } else if (emailForm.recipients === 'incomplete') {
        const incompleteUsers = users.filter(u => u.assessmentCount === 0)
        recipients = incompleteUsers.map(u => u.email)
      } else if (emailForm.recipients === 'selected') {
        recipients = users.filter(u => selectedUsers.includes(u.id)).map(u => u.email)
      } else if (emailForm.recipients === 'custom') {
        recipients = emailForm.customEmails.split(',').map(e => e.trim()).filter(e => e)
      }

      const response = await fetch(`${apiUrl}/api/admin/emails/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients,
          subject: emailForm.subject,
          body: emailForm.body
        })
      })

      const data = await response.json()

      if (data.success) {
        showMessage('success', `Email inviata a ${recipients.length} destinatari!`)
        setShowEmailModal(false)
        setEmailForm({
          recipients: 'all',
          customEmails: '',
          template: 'custom',
          subject: '',
          body: ''
        })
      } else {
        showMessage('error', 'Errore nell\'invio email')
      }
    } catch (error) {
      console.error('Error sending email:', error)
      showMessage('error', 'Errore nell\'invio email')
    } finally {
      setSendingEmail(false)
    }
  }

  const handleTemplateChange = (template: keyof typeof emailTemplates) => {
    setEmailForm({
      ...emailForm,
      template,
      subject: emailTemplates[template].subject,
      body: emailTemplates[template].body
    })
  }

  // ==================== EXPORT HANDLERS ====================
  const handleExportUsers = () => {
    const exportData = filteredUsers.map(u => ({
      Email: u.email,
      Nome: u.full_name || 'N/A',
      'Assessment Completati': u.assessmentCount,
      'Data Registrazione': new Date(u.created_at).toLocaleDateString('it-IT'),
      Status: u.is_blocked ? 'Bloccato' : 'Attivo'
    }))
    exportToCSV(exportData, 'valutolab_utenti')
  }

  const handleExportAssessments = () => {
    const exportData = filteredAssessments.map(a => ({
      Utente: a.userName,
      Email: a.userEmail,
      Status: a.status === 'completed' ? 'Completato' : 'In corso',
      Punteggio: a.total_score?.toFixed(1) || '-',
      'Data Creazione': new Date(a.created_at).toLocaleDateString('it-IT'),
      'Data Completamento': a.completed_at ? new Date(a.completed_at).toLocaleDateString('it-IT') : '-'
    }))
    exportToCSV(exportData, 'valutolab_assessments')
  }

  // ==================== FILTERING ====================
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                         (user.full_name || '').toLowerCase().includes(userSearchTerm.toLowerCase())
    
    const matchesFilter = userFilter === 'all' ||
                         (userFilter === 'blocked' && user.is_blocked) ||
                         (userFilter === 'active' && !user.is_blocked)
    
    return matchesSearch && matchesFilter
  })

  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = assessment.userName.toLowerCase().includes(assessmentSearchTerm.toLowerCase()) ||
                         assessment.userEmail.toLowerCase().includes(assessmentSearchTerm.toLowerCase())
    
    const matchesFilter = assessmentFilter === 'all' ||
                         (assessmentFilter === 'completed' && assessment.status === 'completed') ||
                         (assessmentFilter === 'in_progress' && assessment.status === 'in_progress')
    
    return matchesSearch && matchesFilter
  })

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // ==================== RENDER ====================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento dashboard admin...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  const completionRate = stats ? Math.round((stats.completedAssessments / stats.totalAssessments) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Message Toast */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white font-semibold animate-slide-in`}>
          {message.text}
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">ValutoLab Admin</h1>
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                🔒 Admin Dashboard
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{currentAdminEmail}</span>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                Dashboard Utente
              </button>
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
        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex gap-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                📊 Panoramica
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                👥 Utenti ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('assessments')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'assessments'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                📋 Assessment ({assessments.length})
              </button>
              <button
                onClick={() => setActiveTab('email')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'email'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                📧 Email
              </button>
            </nav>
          </div>
        </div>

        {/* ==================== OVERVIEW TAB ==================== */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Utenti Totali</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                    <p className="text-xs text-green-600 mt-1">+{stats.newUsersLast7Days} ultimi 7gg</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Assessment Totali</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalAssessments}</p>
                    <p className="text-xs text-blue-600 mt-1">+{stats.completedLast7Days} completati/7gg</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Completati</p>
                    <p className="text-3xl font-bold text-green-600">{stats.completedAssessments}</p>
                    <p className="text-xs text-gray-600 mt-1">{stats.inProgressAssessments} in corso</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Tasso Completamento</p>
                    <p className="text-3xl font-bold text-gray-900">{completionRate}%</p>
                    <p className="text-xs text-orange-600 mt-1">{stats.abandonedAssessments} abbandonati</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-bold mb-4">⚡ Azioni Rapide</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => {
                    setActiveTab('users')
                    setShowCreateUserModal(true)
                  }}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur rounded-lg p-4 text-center transition"
                >
                  <div className="text-2xl mb-2">👤</div>
                  <div className="font-semibold">Crea Utente</div>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('email')
                    setShowEmailModal(true)
                  }}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur rounded-lg p-4 text-center transition"
                >
                  <div className="text-2xl mb-2">📧</div>
                  <div className="font-semibold">Invia Email</div>
                </button>
                <button
                  onClick={handleExportUsers}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur rounded-lg p-4 text-center transition"
                >
                  <div className="text-2xl mb-2">📊</div>
                  <div className="font-semibold">Export Utenti</div>
                </button>
                <button
                  onClick={handleExportAssessments}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur rounded-lg p-4 text-center transition"
                >
                  <div className="text-2xl mb-2">📋</div>
                  <div className="font-semibold">Export Assessment</div>
                </button>
              </div>
            </div>

            {/* Category Averages */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Punteggi Medi per Competenza</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(stats.categoryAverages).map(([category, score]) => (
                  <div key={category} className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">{categoryLabels[category]}</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-bold text-gray-900">{score}</p>
                      <p className="text-sm text-gray-500">/5.0</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full"
                        style={{ width: `${(parseFloat(score) / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== USERS TAB ==================== */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex gap-2 flex-1 w-full md:w-auto">
                  <input
                    type="text"
                    placeholder="🔍 Cerca per email o nome..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">Tutti</option>
                    <option value="active">Attivi</option>
                    <option value="blocked">Bloccati</option>
                  </select>
                </div>
                
                <div className="flex gap-2">
                  {selectedUsers.length > 0 && (
                    <button
                      onClick={() => {
                        setEmailForm({ ...emailForm, recipients: 'selected' })
                        setShowEmailModal(true)
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                    >
                      📧 Email a {selectedUsers.length}
                    </button>
                  )}
                  <button
                    onClick={handleExportUsers}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                  >
                    📊 Export CSV
                  </button>
                  <button
                    onClick={() => setShowCreateUserModal(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
                  >
                    ➕ Crea Utente
                  </button>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(filteredUsers.map(u => u.id))
                            } else {
                              setSelectedUsers([])
                            }
                          }}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assessment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ultimo Assessment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registrato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Azioni
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers([...selectedUsers, user.id])
                              } else {
                                setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                              }
                            }}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {user.assessmentCount} assessment
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.last_assessment_date 
                            ? new Date(user.last_assessment_date).toLocaleDateString('it-IT')
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(user.created_at).toLocaleDateString('it-IT')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.is_blocked 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {user.is_blocked ? '🔒 Bloccato' : '✅ Attivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleBlockUser(user.id, user.is_blocked)}
                              disabled={blockingUser === user.id}
                              className={`px-3 py-1 rounded font-semibold transition ${
                                user.is_blocked
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              } disabled:opacity-50`}
                            >
                              {blockingUser === user.id ? '...' : (user.is_blocked ? 'Sblocca' : 'Blocca')}
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(user.id)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded font-semibold hover:bg-red-200 transition"
                            >
                              Elimina
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  Nessun utente trovato
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== ASSESSMENTS TAB ==================== */}
        {activeTab === 'assessments' && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex gap-2 flex-1 w-full md:w-auto">
                  <input
                    type="text"
                    placeholder="🔍 Cerca per utente o email..."
                    value={assessmentSearchTerm}
                    onChange={(e) => setAssessmentSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <select
                    value={assessmentFilter}
                    onChange={(e) => setAssessmentFilter(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">Tutti</option>
                    <option value="completed">Completati</option>
                    <option value="in_progress">In Corso</option>
                  </select>
                </div>
                
                <button
                  onClick={handleExportAssessments}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                >
                  📊 Export CSV
                </button>
              </div>
            </div>

            {/* Assessments Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Utente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Punteggio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data Creazione
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data Completamento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Azioni
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAssessments.map((assessment) => (
                      <tr key={assessment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {assessment.userName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{assessment.userEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            assessment.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {assessment.status === 'completed' ? '✅ Completato' : '⏳ In corso'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {assessment.total_score ? (
                            <span className="font-semibold">{assessment.total_score.toFixed(1)}/5.0</span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(assessment.created_at).toLocaleDateString('it-IT')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {assessment.completed_at 
                            ? new Date(assessment.completed_at).toLocaleDateString('it-IT')
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            {assessment.status === 'completed' && (
                              <button
                                onClick={() => router.push(`/dashboard/results/${assessment.id}`)}
                                className="px-3 py-1 bg-purple-100 text-purple-700 rounded font-semibold hover:bg-purple-200 transition"
                              >
                                Visualizza
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteAssessment(assessment.id)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded font-semibold hover:bg-red-200 transition"
                            >
                              Elimina
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredAssessments.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  Nessun assessment trovato
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== EMAIL TAB ==================== */}
        {activeTab === 'email' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">📧 Sistema Email</h2>
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
                >
                  ✉️ Componi Nuova Email
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-2">📨</div>
                  <div className="text-3xl font-bold text-gray-900">{users.length}</div>
                  <div className="text-sm text-gray-600 mt-1">Utenti Totali</div>
                </div>

                <div className="bg-green-50 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-2">✅</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {users.filter(u => u.assessmentCount > 0).length}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Con Assessment Completato</div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-2">⏳</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {users.filter(u => u.assessmentCount === 0).length}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Senza Assessment</div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Template Disponibili</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(emailTemplates).filter(([key]) => key !== 'custom').map(([key, template]) => (
                    <div key={key} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition">
                      <h4 className="font-semibold text-gray-900 mb-2">{template.subject}</h4>
                      <p className="text-sm text-gray-600 line-clamp-3">{template.body}</p>
                      <button
                        onClick={() => {
                          handleTemplateChange(key as keyof typeof emailTemplates)
                          setShowEmailModal(true)
                        }}
                        className="mt-3 text-purple-600 hover:text-purple-700 font-semibold text-sm"
                      >
                        Usa Template →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ==================== CREATE USER MODAL ==================== */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">➕ Crea Nuovo Utente</h3>
              <button
                onClick={() => {
                  setShowCreateUserModal(false)
                  setNewUserForm({ email: '', fullName: '', password: '' })
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="utente@esempio.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={newUserForm.fullName}
                  onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Mario Rossi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password Temporanea *
                </label>
                <input
                  type="password"
                  required
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Min 6 caratteri"
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  L'utente potrà cambiarla al primo accesso
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateUserModal(false)
                    setNewUserForm({ email: '', fullName: '', password: '' })
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingUser ? 'Creazione...' : 'Crea Utente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== DELETE CONFIRM MODAL ==================== */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Conferma Eliminazione</h3>
              <p className="text-gray-600 mb-6">
                Sei sicuro di voler eliminare questo utente?<br />
                <strong>Questa azione è irreversibile!</strong>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  Annulla
                </button>
                <button
                  onClick={() => handleDeleteUser(showDeleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
                >
                  Elimina Definitivamente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== EMAIL MODAL ==================== */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">📧 Componi Email</h3>
              <button
                onClick={() => {
                  setShowEmailModal(false)
                  setEmailForm({
                    recipients: 'all',
                    customEmails: '',
                    template: 'custom',
                    subject: '',
                    body: ''
                  })
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template
                </label>
                <select
                  value={emailForm.template}
                  onChange={(e) => handleTemplateChange(e.target.value as keyof typeof emailTemplates)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="custom">Personalizzato</option>
                  <option value="welcome">Benvenuto</option>
                  <option value="reminder">Reminder Completamento</option>
                  <option value="congrats">Congratulazioni</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destinatari
                </label>
                <select
                  value={emailForm.recipients}
                  onChange={(e) => setEmailForm({ ...emailForm, recipients: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">Tutti gli utenti ({users.length})</option>
                  <option value="completed">Chi ha completato assessment ({users.filter(u => u.assessmentCount > 0).length})</option>
                  <option value="incomplete">Chi non ha completato ({users.filter(u => u.assessmentCount === 0).length})</option>
                  <option value="selected">Utenti selezionati ({selectedUsers.length})</option>
                  <option value="custom">Email personalizzate</option>
                </select>
              </div>

              {emailForm.recipients === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (separate da virgola)
                  </label>
                  <textarea
                    value={emailForm.customEmails}
                    onChange={(e) => setEmailForm({ ...emailForm, customEmails: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                    placeholder="email1@esempio.com, email2@esempio.com"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Oggetto *
                </label>
                <input
                  type="text"
                  required
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Oggetto dell'email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Messaggio *
                </label>
                <textarea
                  required
                  value={emailForm.body}
                  onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={8}
                  placeholder="Corpo dell'email..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Puoi usare {'{name}'} per il nome utente
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailModal(false)
                    setEmailForm({
                      recipients: 'all',
                      customEmails: '',
                      template: 'custom',
                      subject: '',
                      body: ''
                    })
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingEmail ? 'Invio in corso...' : '📧 Invia Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
