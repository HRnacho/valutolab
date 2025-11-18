'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AziendeDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [organization, setOrganization] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'invites' | 'new-invite'>('overview')
  const [invites, setInvites] = useState<any[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [inviteForm, setInviteForm] = useState({
    candidateEmail: '',
    candidateName: '',
    notes: ''
  })

  useEffect(() => {
    checkUserAndLoadOrg()
  }, [])

  const checkUserAndLoadOrg = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Carica organizzazione dell'utente
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://valutolab-backend.onrender.com'
      const response = await fetch(`${apiUrl}/api/organizations/user/${user.id}`)
      const data = await response.json()

      if (data.success && data.organizations.length > 0) {
        const org = data.organizations[0]
        setOrganization(org)
        loadInvites(org.id)
      } else {
        // Se non ha organizzazione, redirect a creazione
        router.push('/aziende/create')
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://valutolab-backend.onrender.com'
      const response = await fetch(`${apiUrl}/api/organizations/${orgId}/invites`)
      const data = await response.json()

      if (data.success) {
        setInvites(data.invites)
      }
    } catch (error) {
      console.error('Error loading invites:', error)
    }
  }

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://valutolab-backend.onrender.com'
      const response = await fetch(`${apiUrl}/api/organizations/${organization.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          candidateEmail: inviteForm.candidateEmail,
          candidateName: inviteForm.candidateName,
          notes: inviteForm.notes
        })
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Invito inviato con successo!' })
        setInviteForm({ candidateEmail: '', candidateName: '', notes: '' })
        loadInvites(organization.id)
        setTimeout(() => setActiveTab('invites'), 1500)
      } else {
        throw new Error(data.message)
      }

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Errore nell\'invio dell\'invito' })
    } finally {
      setLoading(false)
    }
  }

  if (loading && !organization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Caricamento dashboard...</p>
        </div>
      </div>
    )
  }

  const statsData = {
    quota_used: organization?.used_assessments || 0,
    quota_total: organization?.assessment_quota || 20,
    invites_pending: invites.filter(inv => inv.status === 'pending').length,
    invites_completed: invites.filter(inv => inv.status === 'completed').length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl flex items-center justify-center">
                <span className="text-xl font-black text-white">V</span>
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent">
                  {organization?.name}
                </span>
                <p className="text-xs text-gray-500">Dashboard Azienda</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                ← Home
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition text-sm"
              >
                Dashboard Personale
              </button>
            </div>
          </div>
        </div>
      </header>

      {message && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white font-semibold`}>
          {message.text}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 font-semibold transition ${
                activeTab === 'overview'
                  ? 'border-b-4 border-orange-600 text-orange-600'
                  : 'text-gray-600 hover:text-orange-600'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab('invites')}
              className={`px-6 py-4 font-semibold transition ${
                activeTab === 'invites'
                  ? 'border-b-4 border-orange-600 text-orange-600'
                  : 'text-gray-600 hover:text-orange-600'
              }`}
            >
              📋 Inviti ({invites.length})
            </button>
            <button
              onClick={() => setActiveTab('new-invite')}
              className={`px-6 py-4 font-semibold transition ${
                activeTab === 'new-invite'
                  ? 'border-b-4 border-orange-600 text-orange-600'
                  : 'text-gray-600 hover:text-orange-600'
              }`}
            >
              ✉️ Nuovo Invito
            </button>
          </div>
        </div>

        {/* TAB: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 font-medium">Quota Assessment</span>
                  <span className="text-3xl">📊</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {statsData.quota_used}/{statsData.quota_total}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {statsData.quota_total - statsData.quota_used} disponibili
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 font-medium">Inviti Totali</span>
                  <span className="text-3xl">✉️</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{invites.length}</p>
                <p className="text-sm text-gray-500 mt-1">Inviati finora</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 font-medium">In Attesa</span>
                  <span className="text-3xl">⏳</span>
                </div>
                <p className="text-3xl font-bold text-orange-600">{statsData.invites_pending}</p>
                <p className="text-sm text-gray-500 mt-1">Da completare</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 font-medium">Completati</span>
                  <span className="text-3xl">✅</span>
                </div>
                <p className="text-3xl font-bold text-green-600">{statsData.invites_completed}</p>
                <p className="text-sm text-gray-500 mt-1">Assessment finiti</p>
              </div>
            </div>

            {/* Informazioni Azienda */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Informazioni Azienda</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Ragione Sociale</p>
                  <p className="text-lg font-semibold text-gray-900">{organization?.name}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Partita IVA</p>
                  <p className="text-lg font-semibold text-gray-900">{organization?.partita_iva || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Referente</p>
                  <p className="text-lg font-semibold text-gray-900">{organization?.referent_name || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Ruolo Referente</p>
                  <p className="text-lg font-semibold text-gray-900">{organization?.referent_role || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Email Contatto</p>
                  <p className="text-lg font-semibold text-gray-900">{organization?.contact_email}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Piano Attivo</p>
                  <p className="text-lg font-semibold text-orange-600 capitalize">
                    {organization?.subscription_tier}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-orange-100 to-pink-100 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Azioni Rapide</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('new-invite')}
                  className="bg-white hover:shadow-lg transition p-4 rounded-lg text-left"
                >
                  <span className="text-2xl mb-2 block">✉️</span>
                  <p className="font-semibold text-gray-900">Invia Nuovo Invito</p>
                  <p className="text-sm text-gray-600 mt-1">Aggiungi un candidato</p>
                </button>

                <button
                  onClick={() => setActiveTab('invites')}
                  className="bg-white hover:shadow-lg transition p-4 rounded-lg text-left"
                >
                  <span className="text-2xl mb-2 block">📋</span>
                  <p className="font-semibold text-gray-900">Visualizza Inviti</p>
                  <p className="text-sm text-gray-600 mt-1">Controlla lo stato</p>
                </button>

                <button
                  className="bg-white hover:shadow-lg transition p-4 rounded-lg text-left opacity-50 cursor-not-allowed"
                  disabled
                >
                  <span className="text-2xl mb-2 block">📈</span>
                  <p className="font-semibold text-gray-900">Report Completi</p>
                  <p className="text-sm text-gray-600 mt-1">Prossimamente</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: INVITI */}
        {activeTab === 'invites' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Lista Inviti</h2>
              <button
                onClick={() => setActiveTab('new-invite')}
                className="bg-gradient-to-r from-orange-500 to-pink-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition"
              >
                + Nuovo Invito
              </button>
            </div>

            {invites.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">📭</span>
                <p className="text-xl text-gray-600 mb-2">Nessun invito inviato</p>
                <p className="text-gray-500 mb-6">Inizia invitando il tuo primo candidato</p>
                <button
                  onClick={() => setActiveTab('new-invite')}
                  className="bg-gradient-to-r from-orange-500 to-pink-600 text-white px-8 py-3 rounded-lg font-bold hover:shadow-lg transition"
                >
                  Invia Primo Invito
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Candidato</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Data Invio</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invites.map((invite) => (
                      <tr key={invite.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {invite.candidate_name || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-gray-600">{invite.candidate_email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            invite.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : invite.status === 'pending'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {invite.status === 'completed' ? '✅ Completato' : 
                             invite.status === 'pending' ? '⏳ In Attesa' : 
                             invite.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-sm">
                          {new Date(invite.created_at).toLocaleDateString('it-IT')}
                        </td>
                        <td className="py-3 px-4">
                          {invite.status === 'completed' ? (
                            <button className="text-purple-600 hover:underline font-medium text-sm">
                              Visualizza Report
                            </button>
                          ) : (
                            <button className="text-gray-400 text-sm cursor-not-allowed">
                              In Attesa
                            </button>
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

        {/* TAB: NUOVO INVITO */}
        {activeTab === 'new-invite' && (
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Invita un Candidato</h2>
            <p className="text-gray-600 mb-8">
              Il candidato riceverà un'email con un link personale per completare l'assessment
            </p>

            <form onSubmit={handleSendInvite} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Candidato *
                </label>
                <input
                  type="email"
                  required
                  value={inviteForm.candidateEmail}
                  onChange={(e) => setInviteForm({ ...inviteForm, candidateEmail: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                  placeholder="candidato@email.it"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nome Candidato *
                </label>
                <input
                  type="text"
                  required
                  value={inviteForm.candidateName}
                  onChange={(e) => setInviteForm({ ...inviteForm, candidateName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                  placeholder="Mario Rossi"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Note (opzionale)
                </label>
                <textarea
                  value={inviteForm.notes}
                  onChange={(e) => setInviteForm({ ...inviteForm, notes: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                  rows={4}
                  placeholder="Es. Posizione: Full Stack Developer, Colloquio previsto per..."
                />
              </div>

              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>ℹ️ Cosa succede dopo:</strong>
                  <br />
                  Il candidato riceverà un'email con un link unico per accedere all'assessment. 
                  Una volta completato, potrai visualizzare il report completo nella sezione Inviti.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-pink-600 text-white py-4 rounded-lg font-bold text-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Invio in corso...' : 'Invia Invito'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
