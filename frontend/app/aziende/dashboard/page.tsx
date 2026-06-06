'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { Wordmark } from '@/components/ui/Wordmark'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Mail, BarChart3, Users, Clock, CheckCircle, Plus } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

export default function AziendeDashboardPage() {
  const router = useRouter()
  const { user: authUser, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [organization, setOrganization] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'invites' | 'new-invite'>('overview')
  const [invites, setInvites] = useState<any[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [sendingPasswordEmail, setSendingPasswordEmail] = useState(false)
  const [inviteForm, setInviteForm] = useState({ candidateEmail: '', candidateName: '', notes: '' })

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(t)
    }
  }, [message])

  useEffect(() => {
    if (authLoading) return
    if (!authUser) { router.push('/login'); return }
    checkUserAndLoadOrg()
  }, [authUser, authLoading])

  const checkUserAndLoadOrg = async () => {
    try {
      const user = authUser
      if (!user) { router.push('/login'); return }
      setUser(user)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.valutolab.com'
      const response = await fetch(`${apiUrl}/api/organizations/user/${user.id}`)
      const data = await response.json()
      if (data.success && data.organizations.length > 0) {
        const org = data.organizations[0]
        setOrganization(org)
        loadInvites(org.id)
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('Error loading organization:', error)
      setMessage({ type: 'error', text: 'Errore nel caricamento dei dati' })
    } finally {
      setLoading(false)
    }
  }

  const loadInvites = async (orgId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.valutolab.com'
      const response = await fetch(`${apiUrl}/api/organizations/${orgId}/invites`)
      const data = await response.json()
      if (data.success) setInvites(data.invites)
    } catch (error) {
      console.error('Error loading invites:', error)
    }
  }

  const handleSendPasswordSetup = async () => {
    setSendingPasswordEmail(true)
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email })
      })
      if (!res.ok) throw new Error()
      setMessage({ type: 'success', text: 'Email inviata! Controlla la casella per impostare la password.' })
    } catch {
      setMessage({ type: 'error', text: "Errore nell'invio email" })
    } finally {
      setSendingPasswordEmail(false)
    }
  }

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setMessage(null)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.valutolab.com'
      const response = await fetch(`${apiUrl}/api/organizations/${organization.id}/invite`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, candidateEmail: inviteForm.candidateEmail, candidateName: inviteForm.candidateName, notes: inviteForm.notes })
      })
      const data = await response.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Invito inviato con successo!' })
        setInviteForm({ candidateEmail: '', candidateName: '', notes: '' })
        loadInvites(organization.id)
        setTimeout(() => setActiveTab('invites'), 1500)
      } else throw new Error(data.message)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || "Errore nell'invio dell'invito" })
    } finally {
      setLoading(false)
    }
  }

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

  const statsData = {
    quota_used: organization?.used_assessments || 0,
    quota_total: organization?.assessment_quota || 20,
    invites_pending: invites.filter(i => i.status === 'pending').length,
    invites_completed: invites.filter(i => i.status === 'completed').length,
  }

  const tabs: { key: 'overview' | 'invites' | 'new-invite'; label: string }[] = [
    { key: 'overview',    label: 'Overview' },
    { key: 'invites',     label: `Inviti (${invites.length})` },
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

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className="bg-paper-50 border-b border-paper-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Wordmark size={20} />
              {organization?.name && (
                <>
                  <span className="text-paper-300">|</span>
                  <span className="text-[13px] font-medium text-ink-600">{organization.name}</span>
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

        {/* Title */}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-1">Area Azienda</p>
          <h1 className="font-display text-display-3 text-ink-900">Dashboard HR</h1>
        </div>

        {/* ── TABS ────────────────────────────────────────────────── */}
        <div className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink">
          <div className="flex border-b border-paper-200">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3.5 text-[13px] font-medium transition-colors border-b-2 -mb-px ${
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
              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: BarChart3, label: 'Quota usata', value: `${statsData.quota_used}/${statsData.quota_total}`, sub: `${statsData.quota_total - statsData.quota_used} disponibili` },
                  { icon: Mail,      label: 'Inviti totali', value: invites.length, sub: 'Inviati finora' },
                  { icon: Clock,     label: 'In attesa',     value: statsData.invites_pending,   sub: 'Da completare' },
                  { icon: CheckCircle, label: 'Completati',  value: statsData.invites_completed, sub: 'Assessment finiti' },
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

              {/* Org info */}
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
                    <div key={label} className="bg-paper-100 border border-paper-200 rounded-md px-4 py-3">
                      <p className="text-[11px] text-ink-400 mb-0.5">{label}</p>
                      <p className="text-[14px] font-medium text-ink-900 capitalize">{val || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick actions */}
              <div>
                <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ink-400 mb-3">Azioni Rapide</p>
                <div className="grid md:grid-cols-3 gap-3">
                  <button onClick={() => setActiveTab('new-invite')}
                    className="bg-paper-100 border border-paper-200 rounded-md p-5 text-left hover:bg-paper-200 transition-colors">
                    <Mail className="w-5 h-5 text-ink-600 mb-3" />
                    <p className="text-[14px] font-medium text-ink-900 mb-0.5">Invia Nuovo Invito</p>
                    <p className="text-[12px] text-ink-500">Aggiungi un candidato</p>
                  </button>
                  <button onClick={() => setActiveTab('invites')}
                    className="bg-paper-100 border border-paper-200 rounded-md p-5 text-left hover:bg-paper-200 transition-colors">
                    <Users className="w-5 h-5 text-ink-600 mb-3" />
                    <p className="text-[14px] font-medium text-ink-900 mb-0.5">Visualizza Inviti</p>
                    <p className="text-[12px] text-ink-500">Controlla lo stato</p>
                  </button>
                  <div className="bg-paper-100 border border-paper-200 rounded-md p-5 opacity-40 cursor-not-allowed">
                    <BarChart3 className="w-5 h-5 text-ink-400 mb-3" />
                    <p className="text-[14px] font-medium text-ink-700 mb-0.5">Report Completi</p>
                    <p className="text-[12px] text-ink-400">Prossimamente</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── INVITI ──── */}
          {activeTab === 'invites' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-[18px] font-medium text-ink-900">Lista Inviti</h2>
                <Button variant="primary" className="flex items-center gap-2 text-[13px]" onClick={() => setActiveTab('new-invite')}>
                  <Plus className="w-4 h-4" /> Nuovo Invito
                </Button>
              </div>

              {invites.length === 0 ? (
                <div className="text-center py-14 border border-dashed border-paper-300 rounded-md">
                  <Mail className="w-8 h-8 text-ink-300 mx-auto mb-3" />
                  <p className="text-[15px] font-medium text-ink-700 mb-1">Nessun invito inviato</p>
                  <p className="text-[13px] text-ink-400 mb-5">Inizia invitando il tuo primo candidato</p>
                  <Button variant="primary" onClick={() => setActiveTab('new-invite')}>Invia Primo Invito</Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b border-paper-200">
                        <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400">Candidato</th>
                        <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400">Email</th>
                        <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400">Status</th>
                        <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400">Data Invio</th>
                        <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-eyebrow text-ink-400">Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invites.map((invite) => (
                        <tr key={invite.id} className="border-b border-paper-100 hover:bg-paper-100 transition-colors">
                          <td className="py-3 px-4 font-medium text-ink-900">{invite.candidate_name || '—'}</td>
                          <td className="py-3 px-4 text-ink-600">{invite.candidate_email}</td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-semibold uppercase tracking-eyebrow px-2 py-0.5 rounded-sm border ${
                              invite.status === 'completed'
                                ? 'text-level-avanzato bg-green-50 border-green-200'
                                : invite.status === 'pending'
                                ? 'text-level-intermedio bg-amber-50 border-amber-200'
                                : 'text-ink-500 bg-paper-200 border-paper-300'
                            }`}>
                              {invite.status === 'completed' ? 'Completato' : invite.status === 'pending' ? 'In Attesa' : invite.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-ink-500">{new Date(invite.created_at).toLocaleDateString('it-IT')}</td>
                          <td className="py-3 px-4">
                            {invite.status === 'completed' ? (
                              <button className="text-[12px] font-medium text-ink-900 hover:text-sienna-600 transition-colors">
                                Visualizza Report
                              </button>
                            ) : (
                              <span className="text-[12px] text-ink-400">In Attesa</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

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
                    <strong>Cosa succede dopo:</strong> Il candidato riceverà un link unico via email per completare l&apos;assessment. Una volta terminato potrai visualizzare il report nella sezione Inviti.
                  </p>
                </div>

                <Button type="submit" variant="primary" disabled={loading} className="w-full justify-center">
                  {loading ? 'Invio in corso…' : 'Invia Invito'}
                </Button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
